import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ContestsService } from './contests.service';

@WebSocketGateway({ cors: true })
export class ContestsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly contestsService: ContestsService) {}

  @SubscribeMessage('joinContest')
  handleJoinContest(@MessageBody() data: { contestId: string; userId: string }) {
    const contest = this.contestsService.joinContest(data.contestId, data.userId);
    this.server.to(data.contestId).emit('contestUpdate', contest);
    return contest;
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(@MessageBody() data: { contestId: string; userId: string; answer: string; correct: boolean }) {
    const contest = this.contestsService.submitAnswer(data.contestId, data.userId, data.answer, data.correct);
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
