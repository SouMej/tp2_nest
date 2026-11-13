
import {
  IsString,
  IsInt,
  Min,
  IsArray,
  IsOptional,
  IsNumber
} from 'class-validator';

export class CreateCvDto {

  @IsString()
  name: string;

  @IsString()
  firstname: string;

  @IsInt()
  @Min(0)
  age: number;

  @IsNumber()
  Cin: number;

  @IsString()
  Job: string;

  @IsString()
  path: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  skillIds?: number[];

}
