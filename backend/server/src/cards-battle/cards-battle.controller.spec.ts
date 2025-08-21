import { Test, TestingModule } from '@nestjs/testing';
import { CardsBattleController } from './cards-battle.controller';

describe('CardsBattleController', () => {
  let controller: CardsBattleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardsBattleController],
    }).compile();

    controller = module.get<CardsBattleController>(CardsBattleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
