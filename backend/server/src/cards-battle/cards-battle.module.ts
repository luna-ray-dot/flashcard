import { Module } from '@nestjs/common';
import { CardsBattleService } from './cards-battle.service';
import { CardsBattleController } from './cards-battle.controller';
import { Neo4jService } from '../neo4j/neo4j.service';

@Module({
  controllers: [CardsBattleController],
  providers: [CardsBattleService, Neo4jService],
  exports: [CardsBattleService],
})
export class CardsBattleModule {}
