import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from '../neo4j/neo4j.service';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

type BattleMode = 'fastest' | 'points';
type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

interface ParticipantState {
  userId: string;
  isAI?: boolean;
  answers: Array<{
    cardId: string;
    answer: string;
    correct: boolean;
    timeMs: number;
  }>;
  score: number;
  avgLatencyMs?: number;
}

export interface BattleState {
  id: string;
  cardIds: string[];
  mode: BattleMode;
  createdAt: string;
  participants: ParticipantState[];
  winner?: string;
  finished?: boolean;
}

@Injectable()
export class BattlesService {
  private openai?: OpenAI;

  constructor(
    private readonly neo4j: Neo4jService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    if (key) this.openai = new OpenAI({ apiKey: key });
  }

  /**
   * Create a battle persisted in Neo4j.
   * :Battle {id, mode, createdAt} -[:USES_CARD]-> (:Card)
   */
  async createBattle(cardIds: string[], mode: BattleMode = 'fastest'): Promise<BattleState> {
    if (!cardIds?.length) throw new BadRequestException('cardIds required');

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await this.neo4j.write(
      `
      MERGE (b:Battle { id: $id })
      SET b.mode = $mode, b.createdAt = datetime($createdAt), b.finished = false
      WITH b
      UNWIND $cardIds AS cid
      MATCH (c:Card { id: cid })
      MERGE (b)-[:USES_CARD]->(c)
      RETURN b
      `,
      { id, mode, createdAt, cardIds },
    );

    return {
      id,
      cardIds,
      mode,
      createdAt,
      participants: [],
      finished: false,
    };
  }

  /**
   * Join battle, persisted as (:User)-[:PARTICIPATES_IN]->(:Battle)
   */
  async joinBattle(battleId: string, userId: string, isAI = false): Promise<BattleState> {
    const battle = await this.getBattle(battleId);
    if (!battle) throw new BadRequestException('Battle not found');

    // Link participant in graph
    await this.neo4j.write(
      `
      MATCH (b:Battle { id: $battleId })
      MERGE (u:User { id: $userId })
      MERGE (u)-[:PARTICIPATES_IN]->(b)
      RETURN b
      `,
      { battleId, userId },
    );

    // Mirror into current state (dedupe)
    const exists = battle.participants.find(p => p.userId === userId);
    if (!exists) {
      battle.participants.push({
        userId,
        isAI,
        answers: [],
        score: 0,
        avgLatencyMs: undefined,
      });
    }

    // If single-player and no AI yet, spawn AI (but balanced)
    const humans = battle.participants.filter(p => !p.isAI);
    const hasAI = battle.participants.some(p => p.isAI);
    if (humans.length === 1 && !hasAI) {
      const aiId = 'AI_BOT';
      await this.joinBattle(battleId, aiId, true);
      // No immediate answer; AI will answer after human action or timeouts (handled in submit & simulate)
    }

    return battle;
  }

  /**
   * Submit an answer -> stored as :Answer node, relate to battle
   */
  async submitAnswer(battleId: string, userId: string, cardId: string, rawAnswer: string): Promise<BattleState> {
    const battle = await this.getBattle(battleId);
    if (!battle) throw new BadRequestException('Battle not found');

    const participant = battle.participants.find(p => p.userId === userId);
    if (!participant) throw new BadRequestException('Participant not found');

    const start = Date.now();
    // Evaluate correctness
    const correct = await this.evaluateAnswer(cardId, rawAnswer);

    const timeMs = Date.now() - start + Math.floor(Math.random() * 150) + 50; // tiny jitter for realism

    // Persist answer
    const answerId = randomUUID();
    await this.neo4j.write(
      `
      MATCH (b:Battle { id: $battleId })
      MATCH (u:User { id: $userId })
      MATCH (c:Card { id: $cardId })
      MERGE (a:Answer { id: $answerId })
      SET a.answer = $rawAnswer, a.correct = $correct, a.timeMs = $timeMs, a.createdAt = datetime()
      MERGE (b)-[:HAS_ANSWER]->(a)
      MERGE (u)-[:GAVE]->(a)
      MERGE (a)-[:FOR_CARD]->(c)
      `,
      { battleId, userId, cardId, answerId, rawAnswer, correct, timeMs },
    );

    // Update local state
    participant.answers.push({ cardId, answer: rawAnswer, correct, timeMs });
    this.updateScore(battle, participant, correct, timeMs);
    this.updateWinnerIfNeeded(battle);

    // If AI participant exists and hasn't answered this card, simulate a balanced AI response
    const ai = battle.participants.find(p => p.isAI);
    if (ai && !ai.answers.find(a => a.cardId === cardId)) {
      this.simulateAIAnswer(battle, ai.userId, cardId).catch(() => void 0);
    }

    return battle;
  }

  /**
   * Get battle state assembled from Neo4j.
   */
  async getBattle(battleId: string): Promise<BattleState | null> {
    // Pull basic battle + cards
    const res = await this.neo4j.read(
      `
      MATCH (b:Battle { id: $battleId })
      OPTIONAL MATCH (b)-[:USES_CARD]->(c:Card)
      WITH b, collect(c.id) as cardIds
      OPTIONAL MATCH (u:User)-[:PARTICIPATES_IN]->(b)
      RETURN b{.*, createdAt: toString(b.createdAt)} as battle, cardIds, collect(u.id) as users
      `,
      { battleId },
    );
    if (!res.records.length) return null;

    const record = res.records[0];
    const b = record.get('battle');
    const cardIds: string[] = record.get('cardIds') || [];
    const users: string[] = record.get('users') || [];

    // Build participants (answers per user)
    const participants: ParticipantState[] = [];
    for (const uid of users) {
      const answersRes = await this.neo4j.read(
        `
        MATCH (u:User { id: $uid })-[:GAVE]->(a:Answer)<-[:HAS_ANSWER]-(b:Battle { id: $battleId })
        RETURN collect(a{.*, createdAt: toString(a.createdAt)}) as answers
        `,
        { uid, battleId },
      );
      const answers = (answersRes.records[0]?.get('answers') || []).map((a: any) => ({
        cardId: a.cardId ?? '', // might be absent; we can recover via FOR_CARD if needed
        answer: a.answer,
        correct: !!a.correct,
        timeMs: Number(a.timeMs || 0),
      }));

      // isAI if special UID
      const isAI = uid === 'AI_BOT';
      const score = this.computeScoreFromAnswers(answers, b.mode);
      const avgLatencyMs =
        answers.length ? Math.round(answers.reduce((s, x) => s + (x.timeMs || 0), 0) / answers.length) : undefined;

      participants.push({ userId: uid, isAI, answers, score, avgLatencyMs });
    }

    return {
      id: b.id,
      cardIds,
      mode: (b.mode as BattleMode) || 'fastest',
      createdAt: b.createdAt,
      participants,
      finished: !!b.finished,
      winner: b.winner,
    };
  }

  // -------------------------
  // Scoring & winner logic
  // -------------------------

  private updateScore(battle: BattleState, p: ParticipantState, correct: boolean, timeMs: number) {
    if (battle.mode === 'fastest') {
      if (correct) {
        // First correct answer on a card should be rewarded most — handled by winner logic.
        p.score += 10;
      } else {
        p.score -= 2;
      }
    } else {
      // points mode: correctness + slight speed bonus
      if (correct) p.score += 10 + this.speedBonus(timeMs);
      else p.score -= 1;
    }
    if (p.score < 0) p.score = 0;
  }

  private speedBonus(timeMs: number) {
    // ~0..5 bonus for being faster than ~2s
    if (timeMs <= 1000) return 5;
    if (timeMs <= 2000) return 3;
    if (timeMs <= 3000) return 1;
    return 0;
  }

  private updateWinnerIfNeeded(battle: BattleState) {
    if (battle.mode === 'fastest') {
      // Winner is first participant who has a correct answer for ANY card sooner than others.
      const all = battle.participants.flatMap(p =>
        p.answers.filter(a => a.correct).map(a => ({ userId: p.userId, timeMs: a.timeMs })),
      );
      if (all.length) {
        const first = all.sort((a, b) => a.timeMs - b.timeMs)[0];
        battle.winner = first.userId;
        battle.finished = true;
      }
    } else {
      // points mode: can define finish by #cards or time externally; here we set winner dynamically as max score
      const max = Math.max(...battle.participants.map(p => p.score));
      const top = battle.participants.find(p => p.score === max);
      if (top) battle.winner = top.userId;
    }
  }

  private computeScoreFromAnswers(answers: ParticipantState['answers'], mode: BattleMode): number {
    if (!answers.length) return 0;
    if (mode === 'fastest') {
      // 10 per correct, -2 per wrong (min 0)
      const s = answers.reduce((acc, a) => acc + (a.correct ? 10 : -2), 0);
      return Math.max(0, s);
    }
    // points mode: 10 for correct + speed bonus, -1 wrong
    const s = answers.reduce((acc, a) => acc + (a.correct ? 10 + this.speedBonus(a.timeMs) : -1), 0);
    return Math.max(0, s);
  }

  // -------------------------
  // Answer evaluation
  // -------------------------

  private async evaluateAnswer(cardId: string, userAnswer: string): Promise<boolean> {
    // Try to read a canonical answer from Card.correctAnswer or acceptableAnswers
    const res = await this.neo4j.read(
      `
      MATCH (c:Card { id: $cardId })
      RETURN c.correctAnswer AS correctAnswer, c.acceptableAnswers AS acceptable
      `,
      { cardId },
    );

    const correctAnswer: string | null = res.records[0]?.get('correctAnswer') ?? null;
    const acceptable: string[] | null = res.records[0]?.get('acceptable') ?? null;

    const norm = (s: string) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
    const ua = norm(userAnswer);

    if (correctAnswer && ua === norm(correctAnswer)) return true;
    if (acceptable && acceptable.some(a => norm(a) === ua)) return true;

    // Fallback heuristic: partial match with 70% similarity against correctAnswer
    if (correctAnswer) {
      const sim = this.stringSimilarity(ua, norm(correctAnswer));
      if (sim >= 0.7) return true;
    }
    return false;
  }

  private stringSimilarity(a: string, b: string): number {
    // Jaccard on word sets, simple + fast
    const A = new Set(a.split(' '));
    const B = new Set(b.split(' '));
    const inter = new Set([...A].filter(x => B.has(x))).size;
    const union = new Set([...A, ...B]).size || 1;
    return inter / union;
  }

  // -------------------------
  // AI fairness & simulation
  // -------------------------

  private async simulateAIAnswer(battle: BattleState, aiId: string, cardId: string) {
    // Compute player skill to balance difficulty
    const player = battle.participants.find(p => !p.isAI);
    const skill = await this.estimatePlayerSkill(player?.userId);

    // Adaptive delay (AI slower if player is novice)
    const baseDelay = this.config.get<number>('AI_BASE_DELAY_MS') ?? 2200;
    const extra = Math.max(0, 2000 - Math.floor(skill * 500)); // more extra delay for lower skill
    const jitter = Math.floor(Math.random() * 1200);
    const delay = baseDelay + extra + jitter;

    // Adaptive accuracy (AI less accurate for novices; more accurate for experts)
    const baseAcc = this.config.get<number>('AI_BASE_ACCURACY') ?? 0.78;
    const acc = Math.min(0.95, Math.max(0.55, baseAcc + (skill - 0.5) * 0.3));

    // Decide if AI answers correctly
    const correct = Math.random() < acc;

    // If OpenAI key present & we want realism, ask the model for an answer draft
    let aiText = correct ? 'AI: correct' : 'AI: wrong';
    try {
      if (this.openai) {
        const card = await this.getCard(cardId);
        if (card?.content) {
          const prompt = `Question:\n${card.title}\nContext:\n${card.content}\n\nProvide a concise, 1-sentence answer.`;
          const chat = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: correct ? 0.2 : 1.0,
            max_tokens: 32,
          });
          const text = chat.choices?.[0]?.message?.content?.trim();
          if (text) aiText = text;
        }
      }
    } catch {
      // ignore API errors silently; fall back to simple text
    }

    await new Promise(res => setTimeout(res, delay));
    await this.submitAnswer(battle.id, aiId, cardId, aiText);
  }

  private async getCard(cardId: string): Promise<{ id: string; title: string; content?: string } | null> {
    const res = await this.neo4j.read(
      `
      MATCH (c:Card { id: $cardId })
      RETURN c.id as id, c.title as title, c.content as content
      `,
      { cardId },
    );
    if (!res.records.length) return null;
    return {
      id: res.records[0].get('id'),
      title: res.records[0].get('title'),
      content: res.records[0].get('content') ?? undefined,
    };
  }

  private async estimatePlayerSkill(userId?: string): Promise<number> {
    if (!userId) return 0.5;
    // Skill ~ recent correctness ratio on Answers; default 0.5
    const res = await this.neo4j.read(
      `
      MATCH (u:User { id: $userId })-[:GAVE]->(a:Answer)
      WITH a ORDER BY a.createdAt DESC
      LIMIT 50
      WITH collect(a.correct) as cs
      WITH reduce(s=0, x IN cs | s + (CASE WHEN x THEN 1 ELSE 0 END)) as corrects, size(cs) as total
      RETURN CASE WHEN total=0 THEN 0.5 ELSE toFloat(corrects)/toFloat(total) END as skill
      `,
      { userId },
    );
    const skill: number = res.records[0]?.get('skill') ?? 0.5;
    // Clamp
    return Math.min(1, Math.max(0, Number(skill)));
  }
}
