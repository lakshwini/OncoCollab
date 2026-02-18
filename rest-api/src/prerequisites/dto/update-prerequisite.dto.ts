import { IsString, IsEnum, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePrerequisiteItemDto {
  @IsString()
  key: string;

  @IsEnum(['pending', 'done'])
  status: 'pending' | 'done';

  @IsOptional()
  @IsString()
  reference_id?: string | null;
}

export class UpdatePrerequisitesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePrerequisiteItemDto)
  items: UpdatePrerequisiteItemDto[];
}
