import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  // Create a new card
  @Post('create/:userId')
  async createCard(
    @Param('userId') userId: string,
    @Body() createCardDto: CreateCardDto,
  ) {
    return this.cardsService.createCard(userId, createCardDto);
  }

  // List all cards for a user
  @Get(':userId')
  async listCards(@Param('userId') userId: string) {
    return this.cardsService.listCards(userId);
  }

  // Get the next card for spaced repetition
  @Get('next/:userId')
  async getNextCard(@Param('userId') userId: string) {
    return this.cardsService.getNextCard(userId);
  }

  // Record review for a card (correct/incorrect)
  @Post('review/:userId/:cardId')
  async recordCardReview(
    @Param('userId') userId: string,
    @Param('cardId') cardId: string,
    @Body('correct') correct: boolean,
  ) {
    return this.cardsService.recordCardReview(userId, cardId, correct);
  }
}
