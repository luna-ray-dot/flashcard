import { Module } from '@nestjs/common';
import { BattlesService } from './battles.service';
import { BattlesController } from './battles.controller';
import { BattlesGateway } from './battles.gateway';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [BattlesService, BattlesGateway],
  controllers: [BattlesController],
})
export class BattlesModule {}
