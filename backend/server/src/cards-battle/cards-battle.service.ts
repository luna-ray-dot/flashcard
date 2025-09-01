import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class CardsBattleService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async submitBattleAnswer(userId: string, cardId: string, correct: boolean) {
    // Update XP points
    const xpIncrement = correct ? 10 : 2;

    await this.neo4jService.write(`
      MATCH (u:User {id: $userId})
      SET u.xp = coalesce(u.xp, 0) + $xp
      RETURN u
    `, { userId, xp: xpIncrement });

    // Log battle attempt (for contest leaderboard)
    await this.neo4jService.write(`
      MERGE (c:Card {id: $cardId})
      MERGE (u:User {id: $userId})
      CREATE (u)-[:BATTLED {correct: $correct, timestamp: datetime()}]->(c)
    `, { userId, cardId, correct });

    // Return XP updated
    const result = await this.neo4jService.read(`
      MATCH (u:User {id: $userId})
      RETURN u.xp as xp
    `, { userId });

    return result.records[0]?.get('xp');
  }

  async getLeaderboard() {
    const result = await this.neo4jService.read(`
      MATCH (u:User)
      RETURN u.id as id, u.username as username, u.xp as xp
      ORDER BY u.xp DESC
      LIMIT 10
    `);

    return result.records.map((r: any) => r.toObject());
  }
}
