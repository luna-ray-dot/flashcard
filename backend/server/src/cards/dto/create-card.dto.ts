import { IsString, IsOptional, IsArray, IsInt, Min } from 'class-validator';

export class CreateCardDto {
  @IsString()
  title!: string; // ✅ definite assignment assertion

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @IsOptional()
  relatedCardIds?: string[]; // Neo4j relationship links

  @IsInt()
  @IsOptional()
  @Min(1)
  level?: number;
}
