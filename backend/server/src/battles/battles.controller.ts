import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { BattlesService } from './battles.service';

@Controller('battles')
export class BattlesController {
  constructor(private readonly battlesService: BattlesService) {}

  @Post('create')
  createBattle(@Body('cardId') cardId: string) {
    return this.battlesService.createBattle(cardId);
  }

  @Post('join')
  joinBattle(@Body('battleId') battleId: string, @Body('userId') userId: string) {
    return this.battlesService.joinBattle(battleId, userId);
  }

  @Post('submit')
  submitAnswer(
    @Body('battleId') battleId: string,
    @Body('userId') userId: string,
    @Body('answer') answer: string,
  ) {
    return this.battlesService.submitAnswer(battleId, userId, answer);
  }

  @Get(':battleId')
  getBattle(@Param('battleId') battleId: string) {
    return this.battlesService.getBattle(battleId);
  }
}
