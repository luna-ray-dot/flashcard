import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class CardsAIService {
  constructor(private readonly neo4jService: Neo4jService) {}

  // Get next recommended cards for a user
  async getNextCards(userId: string, limit: number = 5) {
    const result = await this.neo4jService.read(`
      MATCH (u:User {id: $userId})-[:INTERACTED]->(c:Card)
      WITH c, u
      OPTIONAL MATCH (c)<-[:PREREQUISITE]-(prereq:Card)
      RETURN c, collect(prereq.id) AS prerequisites
      ORDER BY rand() // simple random prioritization; can use AI ranking
      LIMIT $limit
    `, { userId, limit });

    return result.records.map((r: any) => ({
      id: r.get('c').properties.id,
      title: r.get('c').properties.title,
      prerequisites: r.get('prerequisites'),
    }));
  }

  // Record user interaction (for AI analytics)
  async recordInteraction(userId: string, cardId: string, correct: boolean, hesitation: number) {
    return this.neo4jService.write(`
      MATCH (u:User {id: $userId}), (c:Card {id: $cardId})
      MERGE (u)-[r:INTERACTED]->(c)
      SET r.correct = $correct, r.hesitation = $hesitation, r.timestamp = datetime()
      RETURN r
    `, { userId, cardId, correct, hesitation });
  }
}
