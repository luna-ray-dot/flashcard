import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ContestsService } from './contests.service';

@Controller('contests')
export class ContestsController {
  constructor(private readonly contestsService: ContestsService) {}

  @Post('create')
  async createContest(@Body() body: { cardIds: string[] }): Promise<any> {
    return await this.contestsService.createContest(body.cardIds);
  }

  @Post('join/:contestId/:userId')
  async joinContest(
    @Param('contestId') contestId: string,
    @Param('userId') userId: string
  ): Promise<any> {
    return await this.contestsService.joinContest(contestId, userId);
  }

  @Post('submit/:contestId/:userId')
  async submitAnswer(
    @Param('contestId') contestId: string,
    @Param('userId') userId: string,
    @Body() body: { cardId?: string; answer: string; correct: boolean }
  ): Promise<any> {
    const cardId = body.cardId || 'dummy_card_id'; // supply dummy if missing
    return await this.contestsService.submitAnswer(
      contestId,
      userId,
      cardId,
      body.answer,
      body.correct
    );
  }

  @Get(':contestId')
  async getContest(@Param('contestId') contestId: string): Promise<any> {
    return await this.contestsService.findContest(contestId);
  }

  @Get()
  async listContests(): Promise<any[]> {
    return await this.contestsService.listContests();
  }

  @Get('leaderboard')
  async leaderboard(): Promise<{ userId: string; score: number }[]> {
    const contests = await this.contestsService.listContests();
    const leaderboard: { userId: string; score: number }[] = [];

    contests.forEach(c => {
      c.participants.forEach(p => {
        const existing = leaderboard.find(l => l.userId === p.userId);
        if (existing) {
          existing.score += p.score || 0;
        } else {
          leaderboard.push({ userId: p.userId, score: p.score || 0 });
        }
      });
    });

    return leaderboard.sort((a, b) => b.score - a.score);
  }
}
