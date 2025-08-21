import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { CardsModule } from '../cards/cards.module';

@Module({
  imports: [CardsModule],
  providers: [UploadsService],
  controllers: [UploadsController],
})
export class UploadsModule {}
