import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ContestsService } from './contests.service';

@WebSocketGateway({ cors: true })
export class ContestsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly contestsService: ContestsService) {}

  @SubscribeMessage('joinContest')
  async handleJoinContest(@MessageBody() data: { contestId: string; userId: string }): Promise<any> {
    const contest = await this.contestsService.joinContest(data.contestId, data.userId);
    this.server.to(data.contestId).emit('contestUpdate', contest);
    return contest;
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(
    @MessageBody() data: { contestId: string; userId: string; cardId?: string; answer: string; correct: boolean }
  ): Promise<any> {
    const cardId = data.cardId || 'dummy_card_id'; // fallback if missing
    const contest = await this.contestsService.submitAnswer(
      data.contestId,
      data.userId,
      cardId,
      data.answer,
      data.correct
    );

    this.server.to(data.contestId).emit('contestUpdate', contest);

    if (contest?.winner) {
      this.server.to(data.contestId).emit('notification', {
        message: `${contest.winner} wins the contest! 🏆`,
        type: 'success',
      });
    }

    return contest;
  }
}
