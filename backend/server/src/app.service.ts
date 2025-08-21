import { Injectable } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

@Injectable()
export class AppService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async getHello(): Promise<string> {
    const result = await this.neo4jService.run('RETURN "Neo4j Connected!" as message;');
    return result.records[0].get('message');
  }
}
