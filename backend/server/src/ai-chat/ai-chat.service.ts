import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class AiChatService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async getRecommendations(userId: string) {
    const result = await this.neo4jService.read(
      `
      MATCH (u:User {id:$userId})-[:CREATED]->(c:Card)
      RETURN c ORDER BY c.level ASC LIMIT 5
      `,
      { userId },
    );

    return result.records.map(r => r.get('c').properties);
  }

  async askQuestion(userId: string, message: string) {
    // AI logic placeholder (can integrate OpenAI API or local model)
    const recommendations = await this.getRecommendations(userId);
    return {
      reply: `Based on your progress, try reviewing: ${recommendations.map(c => c.title).join(', ')}`,
    };
  }
}
