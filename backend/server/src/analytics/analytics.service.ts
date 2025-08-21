import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  // Compute learning metrics for a user
  async getUserMetrics(userId: string) {
    const result = await this.neo4jService.read(`
      MATCH (u:User {id: $userId})-[r:INTERACTED]->(c:Card)
      RETURN 
        count(r) AS totalInteractions,
        sum(CASE WHEN r.correct = true THEN 1 ELSE 0 END) AS correctCount,
        avg(r.hesitation) AS avgHesitation
    `, { userId });

    const record = result.records[0];
    return {
      totalInteractions: record.get('totalInteractions').toNumber(),
      correctCount: record.get('correctCount').toNumber(),
      accuracy: record.get('correctCount').toNumber() / record.get('totalInteractions').toNumber(),
      avgHesitation: record.get('avgHesitation'),
    };
  }
}
