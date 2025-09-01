import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { BattlesService } from './battles.service';
import { BattleState, Participant } from './battles.types';

@WebSocketGateway({ cors: true })
export class BattlesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()


  server!: Server; // definite assignment
main

  constructor(private readonly battlesService: BattlesService) {}

  @SubscribeMessage('joinBattle')
  async handleJoinBattle(@MessageBody() data: { battleId: string; userId: string }) {
    const battle: BattleState = await this.battlesService.joinBattle(data.battleId, data.userId);
    this.server.to(data.battleId).emit('battleUpdate', battle);

    const humanCount = battle.participants.filter((p: Participant) => !p.isAI).length;
    const aiExists = battle.participants.some((p: Participant) => p.isAI);

    if (humanCount === 1 && !aiExists) {
      const aiDelay = 2000 + Math.random() * 4000;
      const correctChance = 0.6 + Math.random() * 0.3;

      setTimeout(async () => {
        await this.battlesService.joinBattle(data.battleId, 'AI_BOT', true);
        const aiAnswer = Math.random() < correctChance ? 'AI Correct' : 'AI Wrong';
        const nextCardId = battle.currentCardId || 'dummy_card_id';
        const updatedBattle = await this.battlesService.submitAnswer(
          data.battleId,
          'AI_BOT',
          nextCardId,
          aiAnswer
        );

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
  async handleSubmitAnswer(@MessageBody() data: { battleId: string; userId: string; cardId: string; answer: string }) {
    const battle: BattleState = await this.battlesService.submitAnswer(
      data.battleId,
      data.userId,
      data.cardId,
      data.answer
    );

    this.server.to(data.battleId).emit('battleUpdate', battle);

    if (battle.winner) {
      this.server.to(data.battleId).emit('notification', {
        message: `${battle.winner} wins the battle! 🎉`,
        type: 'success',
      });
    }

    return battle;
  }

  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected:', client.id);
  }
}
