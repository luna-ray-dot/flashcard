import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface Participant {
  userId: string;
  score: number;
  answers: { cardId: string; answer: string; correct: boolean; time: number }[];
  isAI?: boolean;
}

interface Contest {
  id: string;
  cardIds: string[];
  participants: Participant[];
  winner?: string;
  mode: 'score' | 'fastest' | 'sudden_death';
}

@Injectable()
export class ContestsService {
  private contests: Map<string, Contest> = new Map();
  private openai: OpenAI;

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly configService: ConfigService,
  ) {
    this.openai = new OpenAI({ apiKey: this.configService.get<string>('OPENAI_API_KEY') });
  }

  async createContest(cardIds: string[], mode: 'score' | 'fastest' | 'sudden_death' = 'score'): Promise<Contest> {
    const contest: Contest = {
      id: randomUUID(),
      cardIds,
      participants: [],
      mode,
    };

    this.contests.set(contest.id, contest);

    await this.neo4jService.write(`
      CREATE (c:Contest {id: $id, mode: $mode, cardIds: $cardIds})
    `, { id: contest.id, mode, cardIds });

    return contest;
  }

  async joinContest(contestId: string, userId: string, isAI = false): Promise<Contest | null> {
    const contest = this.contests.get(contestId);
    if (!contest) return null;

    if (!contest.participants.some(p => p.userId === userId)) {
      contest.participants.push({ userId, score: 0, answers: [], isAI });
    }

    // AI fallback if only one human
    if (contest.participants.length === 1 && !contest.participants.some(p => p.isAI)) {
      contest.participants.push({ userId: 'AI_BOT', score: 0, answers: [], isAI: true });
      this.simulateAIAttempts(contest);
    }

    return contest;
  }

  async submitAnswer(contestId: string, userId: string, cardId: string, answer: string, correct: boolean): Promise<Contest | null> {
    const contest = this.contests.get(contestId);
    if (!contest) return null;

    const participant = contest.participants.find(p => p.userId === userId);
    if (!participant) return null;

    const entry = { cardId, answer, correct, time: Date.now() };
    participant.answers.push(entry);

    // Advanced scoring
    if (correct) {
      const timeBonus = Math.max(0, 5000 - (Date.now() - entry.time)) / 1000; // up to +5 bonus
      participant.score += 10 + timeBonus;
    } else {
      participant.score -= 2; // penalty
    }

    this.updateWinner(contest);
    return contest;
  }

  private updateWinner(contest: Contest) {
    if (contest.mode === 'fastest') {
      const firstCorrect = contest.participants
        .flatMap(p => p.answers.map(a => ({ ...a, userId: p.userId })))
        .filter(a => a.correct)
        .sort((a, b) => a.time - b.time)[0];
      contest.winner = firstCorrect?.userId;
    } else {
      const maxScore = Math.max(...contest.participants.map(p => p.score));
      const leaders = contest.participants.filter(p => p.score === maxScore);
      contest.winner = leaders.length === 1 ? leaders[0].userId : undefined;
    }
  }

  private async simulateAIAttempts(contest: Contest) {
    const ai = contest.participants.find(p => p.isAI);
    if (!ai) return;

    for (const cardId of contest.cardIds) {
      const delay = 2000 + Math.random() * 3000;
      setTimeout(async () => {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: `Answer question for card ${cardId} in short form.` }],
        });

        const aiAnswer = response.choices[0].message.content || 'Guess';
        const correct = Math.random() < 0.75; // adjustable difficulty

        this.submitAnswer(contest.id, ai.userId, cardId, aiAnswer, correct);
      }, delay);
    }
  }

  listContests(): Contest[] {
    return Array.from(this.contests.values());
  }

  findContest(contestId: string): Contest | null {
    return this.contests.get(contestId) || null;
  }
}
