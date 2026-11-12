import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Le nom d’utilisateur est obligatoire' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @IsString()
  password: string;
}

