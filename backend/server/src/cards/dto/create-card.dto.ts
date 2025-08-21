import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateCardDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  relatedCardIds?: string[]; // Neo4j relationship links
}
