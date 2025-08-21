import { Controller, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { BattlesService, BattleState } from './battles.service';

@Controller('battles')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post('create')
  createBattle(@Body('cardId') cardId: string): Promise<BattleState> {
    return this.battlesService.createBattle([cardId]);
  }

  @Post('join')
  joinBattle(
    @Body('battleId') battleId: string,
    @Body('userId') userId: string,
  ): Promise<BattleState> {
    return this.battlesService.joinBattle(battleId, userId);
  }

  @Post('submit')
  submitAnswer(
    @Body('battleId') battleId: string,
    @Body('userId') userId: string,
    @Body('cardId') cardId: string,
    @Body('answer') answer: string,
  ): Promise<BattleState> {
    return this.battlesService.submitAnswer(battleId, userId, cardId, answer);
  }

  @Post(':battleId')
  async getBattle(@Param('battleId') battleId: string): Promise<BattleState> {
    const battle = await this.battlesService.getBattle(battleId);
    if (!battle) throw new NotFoundException('Battle not found');
    return battle;
  }
}
