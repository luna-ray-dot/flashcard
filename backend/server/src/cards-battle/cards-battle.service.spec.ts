import { Test, TestingModule } from '@nestjs/testing';
import { CardsBattleService } from './cards-battle.service';

describe('CardsBattleService', () => {
  let service: CardsBattleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CardsBattleService],
    }).compile();

    service = module.get<CardsBattleService>(CardsBattleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
