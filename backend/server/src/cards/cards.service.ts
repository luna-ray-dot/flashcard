import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { CreateCardDto } from './dto/create-card.dto';



@Injectable()
export class CardsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async createCard(userId: string, createCardDto: CreateCardDto) {
    const { title, content, level } = createCardDto;
    const result = await this.neo4jService.write(
      `
      MERGE (u:User {id: $userId})
      CREATE (c:Card {id: randomUUID(), title: $title, content: $content, level: $level, interval: 1, repetitions: 0, easiness: 2.5, nextReview: datetime()})
      MERGE (u)-[:CREATED]->(c)
      RETURN c
      `,
      { userId, title, content, level }
    );
    return result.records[0]?.get('c');
  }

  async listCards(userId: string) {
    const result = await this.neo4jService.read(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(c:Card)
      RETURN c
      ORDER BY c.level ASC
      `,
      { userId }
    );
    return result.records.map((r: any) => r.get('c').properties);
  }

  async getNextCard(userId: string) {
    const now = new Date().toISOString();
    const result = await this.neo4jService.read(
      `
      MATCH (u:User {id: $userId})-[:CREATED]->(c:Card)
      WHERE c.nextReview <= datetime($now)
      RETURN c
      ORDER BY c.nextReview ASC
      LIMIT 1
      `,
      { userId, now }
    );
    return result.records[0]?.get('c').properties;
  }

  async recordCardReview(userId: string, cardId: string, correct: boolean) {
    // Fetch current card data
    const result = await this.neo4jService.read(
      `
      MATCH (c:Card {id: $cardId})<-[:CREATED]-(u:User {id: $userId})
      RETURN c
      `,
      { cardId, userId }
    );
    const card = result.records[0]?.get('c').properties;
    if (!card) return null;

    // SM-2 algorithm
    const q = correct ? 5 : 2; // quality score
    let easiness = card.easiness || 2.5;
    let repetitions = card.repetitions || 0;
    let interval = card.interval || 1;

    if (q >= 3) {
      repetitions += 1;
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * easiness);
    } else {
      repetitions = 0;
      interval = 1;
    }

    easiness = Math.max(1.3, easiness + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    // Update card review data
    await this.neo4jService.write(
      `
      MATCH (c:Card {id: $cardId})
      SET c.repetitions = $repetitions,
          c.easiness = $easiness,
          c.interval = $interval,
          c.nextReview = datetime($nextReview)
      RETURN c
      `,
      { cardId, repetitions, easiness, interval, nextReview: nextReview.toISOString() }
    );

    // Award XP
    const xpGain = correct ? 10 : 2;
    await this.neo4jService.write(
      `
      MERGE (u:User {id: $userId})-[:HAS_XP]->(xp:XP)
      ON CREATE SET xp.points = $xpGain
      ON MATCH SET xp.points = xp.points + $xpGain
      RETURN xp
      `,
      { userId, xpGain }
    );

    return { nextReview, xpGain };
  }
}
