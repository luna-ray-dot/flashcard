import { IsString, IsOptional, IsArray, IsInt, Min } from 'class-validator';

export class CreateCardDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  relatedCardIds?: string[]; // Neo4j relationship links

  @IsInt()
  @IsOptional()
  @Min(1)
  level?: number; // ✅ add this to fix the TS error
}
