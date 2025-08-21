import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as neo4j from 'neo4j-driver';

@Global()
@Module({
  imports: [ConfigModule.forRoot()],
  providers: [
    {
      provide: 'NEO4J',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('NEO4J_URI') ?? 'bolt://localhost:7687';
        const user = config.get<string>('NEO4J_USER') ?? 'neo4j';
        const password = config.get<string>('NEO4J_PASSWORD') ?? 'password';

        return neo4j.driver(uri, neo4j.auth.basic(user, password));
      },
    },
  ],
  exports: ['NEO4J'],
})
export class Neo4jModule {}
