import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ContestsService } from './contests.service';

@Controller('contests')
export class ContestsController {
  constructor(private readonly contestsService: ContestsService) {}

  // Create a new contest
  @Post('create')
  async createContest(@Body() body: { cardIds: string[] }) {
    return this.contestsService.createContest(body.cardIds);
  }

  // Join an existing contest
  @Post('join/:contestId/:userId')
  async joinContest(@Param('contestId') contestId: string, @Param('userId') userId: string) {
    return this.contestsService.joinContest(contestId, userId);
  }

  // Submit an answer for a contest
  @Post('submit/:contestId/:userId')
  async submitAnswer(
    @Param('contestId') contestId: string,
    @Param('userId') userId: string,
    @Body() body: { answer: string; correct: boolean },
  ) {
    return this.contestsService.submitAnswer(contestId, userId, body.answer, body.correct);
  }

  // Get a single contest
  @Get(':contestId')
  async getContest(@Param('contestId') contestId: string) {
    return this.contestsService.findContest(contestId);
  }

  // Get all contests
  @Get()
  async listContests() {
    return this.contestsService.listContests();
  }

  // Leaderboard (aggregate top participants)
  @Get('leaderboard')
  async leaderboard() {
    const contests = this.contestsService.listContests();
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
