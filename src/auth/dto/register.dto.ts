import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Le nom d’utilisateur est obligatoire' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'L’email est obligatoire' })
  @IsEmail({}, { message: 'Format d’email invalide' })
  email: string;

  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

}
