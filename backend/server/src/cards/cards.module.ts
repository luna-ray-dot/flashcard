import { Module } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService], // <-- add this line
})
export class CardsModule {}
