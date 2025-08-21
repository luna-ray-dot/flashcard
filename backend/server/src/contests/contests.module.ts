import { Module } from '@nestjs/common';
import { ContestsService } from './contests.service';
import { ContestsController } from './contests.controller';
import { ContestsGateway } from './contests.gateway';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [ContestsService, ContestsGateway],
  controllers: [ContestsController],
})
export class ContestsModule {}
