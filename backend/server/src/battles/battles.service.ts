import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from '../neo4j/neo4j.service';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';

type BattleMode = 'fastest' | 'points';
type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface ParticipantState {
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
  currentCardId?: string;
}

@Injectable()
export class BattlesService {
  private openai?: OpenAI;

  constructor(private readonly neo4j: Neo4jService, private readonly config: ConfigService) {
    const key = this.config.get<string>('OPENAI_API_KEY');
    if (key) this.openai = new OpenAI({ apiKey: key });
  }

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
      { id, mode, createdAt, cardIds }
    );

    return { id, cardIds, mode, createdAt, participants: [], finished: false };
  }

  async joinBattle(battleId: string, userId: string, isAI = false): Promise<BattleState> {
    const battle = await this.getBattle(battleId);
    if (!battle) throw new BadRequestException('Battle not found');

    await this.neo4j.write(
      `
      MATCH (b:Battle { id: $battleId })
      MERGE (u:User { id: $userId })
      MERGE (u)-[:PARTICIPATES_IN]->(b)
      RETURN b
      `,
      { battleId, userId }
    );

    if (!battle.participants.find((p) => p.userId === userId)) {
      battle.participants.push({ userId, isAI, answers: [], score: 0 });
    }

    const humans = battle.participants.filter((p) => !p.isAI);
    const hasAI = battle.participants.some((p) => p.isAI);
    if (humans.length === 1 && !hasAI) {
      await this.joinBattle(battleId, 'AI_BOT', true);
    }

    return battle;
  }

  async submitAnswer(
    battleId: string,
    userId: string,
    cardId: string,
    rawAnswer: string
  ): Promise<BattleState> {
    const battle = await this.getBattle(battleId);
    if (!battle) throw new BadRequestException('Battle not found');

    const participant = battle.participants.find((p) => p.userId === userId);
    if (!participant) throw new BadRequestException('Participant not found');

    const start = Date.now();
    const correct = await this.evaluateAnswer(cardId, rawAnswer);
    const timeMs = Date.now() - start + Math.floor(Math.random() * 150) + 50;

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
      { battleId, userId, cardId, answerId, rawAnswer, correct, timeMs }
    );

    participant.answers.push({ cardId, answer: rawAnswer, correct, timeMs });
    this.updateScore(battle, participant, correct, timeMs);
    this.updateWinnerIfNeeded(battle);

    const ai = battle.participants.find((p) => p.isAI && !p.answers.some((a) => a.cardId === cardId));
    if (ai) {
      this.simulateAIAnswer(battle, ai.userId, cardId).catch(() => void 0);
    }

    return battle;
  }

  async getBattle(battleId: string): Promise<BattleState | null> {
    const res = await this.neo4j.read(
      `
      MATCH (b:Battle { id: $battleId })
      OPTIONAL MATCH (b)-[:USES_CARD]->(c:Card)
      WITH b, collect(c.id) as cardIds
      OPTIONAL MATCH (u:User)-[:PARTICIPATES_IN]->(b)
      RETURN b{.*, createdAt: toString(b.createdAt)} as battle, cardIds, collect(u.id) as users
      `,
      { battleId }
    );

    if (!res.records.length) return null;

    const record = res.records[0];
    const b = record.get('battle');
    const cardIds: string[] = record.get('cardIds') ?? [];
    const users: string[] = record.get('users') ?? [];

    const participants: ParticipantState[] = [];
    for (const uid of users) {
      const answersRes = await this.neo4j.read(
        `
        MATCH (u:User { id: $uid })-[:GAVE]->(a:Answer)<-[:HAS_ANSWER]-(b:Battle { id: $battleId })
        RETURN collect(a{.*, createdAt: toString(a.createdAt)}) as answers
        `,
        { uid, battleId }
      );

      const answers = (answersRes.records[0]?.get('answers') ?? []).map((a: any) => ({
        cardId: a.cardId ?? '',
        answer: a.answer,
        correct: !!a.correct,
        timeMs: Number(a.timeMs ?? 0),
      }));

      const isAI = uid === 'AI_BOT';
      const score = this.computeScoreFromAnswers(answers, b.mode);
      const avgLatencyMs =
        answers.length > 0
          ? Math.round(
              answers.reduce((s: number, x: { timeMs: number }) => s + (x.timeMs || 0), 0) / answers.length
            )
          : undefined;

      participants.push({ userId: uid, isAI, answers, score, avgLatencyMs });
    }

    return {
      id: b.id,
      cardIds,
      mode: (b.mode as BattleMode) ?? 'fastest',
      createdAt: b.createdAt,
      participants,
      finished: !!b.finished,
      winner: b.winner,
    };
  }

  private updateScore(battle: BattleState, p: ParticipantState, correct: boolean, timeMs: number) {
    if (battle.mode === 'fastest') {
      p.score += correct ? 10 : -2;
    } else {
      p.score += correct ? 10 + this.speedBonus(timeMs) : -1;
    }
    if (p.score < 0) p.score = 0;
  }

  private speedBonus(timeMs: number) {
    if (timeMs <= 1000) return 5;
    if (timeMs <= 2000) return 3;
    if (timeMs <= 3000) return 1;
    return 0;
  }

  private updateWinnerIfNeeded(battle: BattleState) {
    if (battle.mode === 'fastest') {
      const all = battle.participants.flatMap((p) =>
        p.answers.filter((a) => a.correct).map((a) => ({ userId: p.userId, timeMs: a.timeMs }))
      );
      if (all.length) {
        const first = all.sort((a, b) => a.timeMs - b.timeMs)[0];
        battle.winner = first.userId;
        battle.finished = true;
      }
    } else {
      const max = Math.max(...battle.participants.map((p) => p.score));
      const top = battle.participants.find((p) => p.score === max);
      if (top) battle.winner = top.userId;
    }
  }

  private computeScoreFromAnswers(answers: ParticipantState['answers'], mode: BattleMode): number {
    if (!answers.length) return 0;
    if (mode === 'fastest') {
      const s = answers.reduce((acc: number, a) => acc + (a.correct ? 10 : -2), 0);
      return Math.max(0, s);
    }
    const s = answers.reduce((acc: number, a) => acc + (a.correct ? 10 + this.speedBonus(a.timeMs) : -1), 0);
    return Math.max(0, s);
  }

  private async evaluateAnswer(cardId: string, userAnswer: string): Promise<boolean> {
    const res = await this.neo4j.read(
      `
      MATCH (c:Card { id: $cardId })
      RETURN c.correctAnswer AS correctAnswer, c.acceptableAnswers AS acceptable
      `,
      { cardId }
    );

    const correctAnswer: string | null = res.records[0]?.get('correctAnswer') ?? null;
    const acceptable: string[] | null = res.records[0]?.get('acceptable') ?? null;

    const norm = (s: string) => s.toString().trim().toLowerCase().replace(/\s+/g, ' ');
    const ua = norm(userAnswer);

    if (correctAnswer && ua === norm(correctAnswer)) return true;
    if (acceptable && acceptable.some((a) => norm(a) === ua)) return true;

    if (correctAnswer && this.stringSimilarity(ua, norm(correctAnswer)) >= 0.7) return true;
    return false;
  }

  private stringSimilarity(a: string, b: string): number {
    const A = new Set(a.split(' '));
    const B = new Set(b.split(' '));
    const inter = new Set([...A].filter((x) => B.has(x))).size;
    const union = new Set([...A, ...B]).size || 1;
    return inter / union;
  }

  private async simulateAIAnswer(battle: BattleState, aiId: string, cardId: string) {
    const player = battle.participants.find((p) => !p.isAI);
    const skill = await this.estimatePlayerSkill(player?.userId);

    const baseDelay = this.config.get<number>('AI_BASE_DELAY_MS') ?? 2200;
    const extra = Math.max(0, 2000 - Math.floor(skill * 500));
    const jitter = Math.floor(Math.random() * 1200);
    const delay = baseDelay + extra + jitter;

    const baseAcc = this.config.get<number>('AI_BASE_ACCURACY') ?? 0.78;
    const acc = Math.min(0.95, Math.max(0.55, baseAcc + (skill - 0.5) * 0.3));
    const correct = Math.random() < acc;

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
    } catch {}

    await new Promise((res) => setTimeout(res, delay));
    await this.submitAnswer(battle.id, aiId, cardId, aiText);
  }

  private async getCard(cardId: string): Promise<{ id: string; title: string; content?: string } | null> {
    const res = await this.neo4j.read(
      `
      MATCH (c:Card { id: $cardId })
      RETURN c.id as id, c.title as title, c.content as content
      `,
      { cardId }
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

    const res = await this.neo4j.read(
      `
      MATCH (u:User { id: $userId })-[:GAVE]->(a:Answer)
      WITH a ORDER BY a.createdAt DESC
      LIMIT 50
      WITH collect(a.correct) as cs
      WITH reduce(s=0, x IN cs | s + (CASE WHEN x THEN 1 ELSE 0 END)) as corrects, size(cs) as total
      RETURN CASE WHEN total=0 THEN 0.5 ELSE toFloat(corrects)/toFloat(total) END as skill
      `,
      { userId }
    );
    const skill: number = res.records[0]?.get('skill') ?? 0.5;
    return Math.min(1, Math.max(0, Number(skill)));
  }
}
