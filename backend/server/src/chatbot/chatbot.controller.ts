import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('hint')
  async getHint(@Body() body: { question: string; context?: string }) {
    return this.chatbotService.getHint(body.question, body.context);
  }
}
