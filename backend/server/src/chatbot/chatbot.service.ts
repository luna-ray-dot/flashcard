import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

type DifficultyProfile = 'easy' | 'normal' | 'hard' | 'dynamic';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly openai?: OpenAI;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    this.openai = key ? new OpenAI({ apiKey: key }) : undefined;
  }

  /** Returns a hint/explanation using LLM (fallback to template if no key). */
  async getHint(question: string, context?: string): Promise<string> {
    if (!this.openai) {
      return `Hint: Think about key terms in the question and how they relate. (Local fallback)`;
    }
    const prompt = [
      `You are an expert tutor. Provide a concise, non-spoiler hint.`,
      `Question: ${question}`,
      context ? `Context: ${context}` : '',
      `Return 1–2 sentences max.`
    ].join('\n');

    const resp = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    return resp.choices[0]?.message?.content?.trim() ?? 'No hint available.';
  }

  /**
   * AI Battle answer with difficulty balancing:
   * - dynamic mode lowers accuracy and adds delay based on player XP/level.
   */
  async aiBattleAnswer(
    cardPrompt: string,
    userLevel: number,
    mode: DifficultyProfile = 'dynamic',
  ): Promise<{ answer: string; correct: boolean; delayMs: number }> {
    const { accuracy, minDelay, maxDelay } = this.computeDifficulty(userLevel, mode);
    const correct = Math.random() < accuracy;
    const delay = this.randomInt(minDelay, maxDelay);

    // If you have an LLM, you could synthesize a plausible wrong answer here too.
    let answer = correct ? 'correct' : 'wrong';
    if (this.openai && !correct) {
      const resp = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Produce a plausible but incorrect short answer.' },
          { role: 'user', content: `Question: ${cardPrompt}` },
        ],
        max_tokens: 12,
        temperature: 0.9,
      });
      answer = resp.choices[0]?.message?.content?.trim() || 'wrong';
    }
    return { answer, correct, delayMs: delay };
  }

  private computeDifficulty(userLevel: number, mode: DifficultyProfile) {
    if (mode === 'easy') return { accuracy: 0.45, minDelay: 1800, maxDelay: 3200 };
    if (mode === 'hard') return { accuracy: 0.9, minDelay: 700, maxDelay: 1500 };
    if (mode === 'normal') return { accuracy: 0.7, minDelay: 1000, maxDelay: 2200 };
    // dynamic: scale with userLevel (higher level => tougher AI)
    const clamped = Math.min(Math.max(userLevel, 0), 50);
    const accuracy = 0.55 + (clamped / 50) * 0.3; // 0.55 → 0.85
    const minDelay = 1200 + (1 - (clamped / 50)) * 800; // 1200–2000ms
    const maxDelay = minDelay + 1100; // spread
    return { accuracy, minDelay, maxDelay };
  }

  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
