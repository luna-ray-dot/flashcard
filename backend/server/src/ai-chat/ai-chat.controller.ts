import { Controller, Get, Param, Query } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiService: AiChatService) {}

  @Get('recommendations/:userId')
  getRecommendations(@Param('userId') userId: string) {
    return this.aiService.getRecommendations(userId);
  }

  @Get('ask/:userId')
  askQuestion(@Param('userId') userId: string, @Query('message') message: string) {
    return this.aiService.askQuestion(userId, message);
  }
}
