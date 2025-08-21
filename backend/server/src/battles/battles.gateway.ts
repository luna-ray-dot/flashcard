import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { BattlesService } from './battles.service';

@WebSocketGateway({ cors: true })
export class BattlesGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly battlesService: BattlesService) {}

  @SubscribeMessage('joinBattle')
  handleJoinBattle(@MessageBody() data: { battleId: string; userId: string }) {
    const battle = this.battlesService.joinBattle(data.battleId, data.userId);
    this.server.to(data.battleId).emit('battleUpdate', battle);

    // 🔹 AI fallback if only one human
    const humanCount = battle.participants.filter(p => p.userId !== 'AI_BOT').length;
    const aiExists = battle.participants.some(p => p.userId === 'AI_BOT');

    if (humanCount === 1 && !aiExists) {
      const aiDelay = 2000 + Math.random() * 4000; // 2-6 sec
      const correctChance = 0.6 + Math.random() * 0.3; // 60%-90% correct

      setTimeout(() => {
        this.battlesService.joinBattle(data.battleId, 'AI_BOT');
        const aiAnswer = Math.random() < correctChance ? 'AI Correct' : 'AI Wrong';
        const updatedBattle = this.battlesService.submitAnswer(data.battleId, 'AI_BOT', aiAnswer);
        this.server.to(data.battleId).emit('battleUpdate', updatedBattle);

        if (updatedBattle.winner) {
          this.server.to(data.battleId).emit('notification', {
            message: `${updatedBattle.winner} wins the battle! 🎉`,
            type: 'success',
          });
        }
      }, aiDelay);
    }

    return battle;
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(@MessageBody() data: { battleId: string; userId: string; answer: string }) {
    const battle = this.battlesService.submitAnswer(data.battleId, data.userId, data.answer);
    this.server.to(data.battleId).emit('battleUpdate', battle);

    // 🔔 Notify winner
    if (battle.winner) {
      this.server.to(data.battleId).emit('notification', {
        message: `${battle.winner} wins the battle! 🎉`,
        type: 'success',
      });
    }

    return battle;
  }

  handleConnection(client) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client) {
    console.log('Client disconnected:', client.id);
  }
}
