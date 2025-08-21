import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CardsAIService } from '../ai/cards-ai.service';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  providers: [AnalyticsService, CardsAIService],
  exports: [AnalyticsService, CardsAIService],
})
export class AnalyticsModule {}
