import { Injectable, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class Neo4jService implements OnModuleDestroy {
  private driver: Driver;

  constructor(private readonly configService: ConfigService) {
    const uri = this.configService.get<string>('NEO4J_URI');
    const user = this.configService.get<string>('NEO4J_USER');
    const password = this.configService.get<string>('NEO4J_PASSWORD');

    if (!uri || !user || !password) {
      throw new Error('Neo4j credentials are missing in environment variables');
    }

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }

  getDriver(): Driver {
    return this.driver;
  }

  async read(query: string, params?: any): Promise<any> {
    const session: Session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      const result = await session.run(query, params);
      return result;
    } catch (error) {
      console.error('Neo4j read error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async write(query: string, params?: any): Promise<any> {
    const session: Session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
      const result = await session.run(query, params);
      return result;
    } catch (error) {
      console.error('Neo4j write error:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
  }
}
