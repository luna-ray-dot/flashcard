import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { CardsBattleService } from './cards-battle.service';

@Controller('cards-battle')
export class CardsBattleController {
  constructor(private readonly cardsBattleService: CardsBattleService) {}

  @Post('submit/:userId/:cardId')
  async submitAnswer(
    @Param('userId') userId: string,
    @Param('cardId') cardId: string,
    @Body('correct') correct: boolean,
  ) {
    const xp = await this.cardsBattleService.submitBattleAnswer(userId, cardId, correct);

    // This is where you could trigger a WebSocket notification (example in frontend later)
    return { message: 'Battle recorded', xp };
  }

  @Get('leaderboard')
  async leaderboard() {
    return this.cardsBattleService.getLeaderboard();
  }
}
