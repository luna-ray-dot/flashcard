// backend/server/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Neo4jModule } from './neo4j/neo4j.module';
import { UsersModule } from './users/users.module';
import { CardsModule } from './cards/cards.module';
import { CardsBattleModule } from './cards-battle/cards-battle.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { UploadsModule } from './uploads/uploads.module';
import { BattlesModule } from './battles/battles.module';
import { AiModule } from './ai/ai.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      load: [configuration],
    }),
    Neo4jModule,
    UsersModule,
    CardsModule,
    CardsBattleModule,
    AiChatModule,
    UploadsModule,
    BattlesModule,
    AiModule, // <-- add this
  ],
})
export class AppModule {}
