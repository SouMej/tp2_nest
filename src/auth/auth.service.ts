
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  // SLIDE 10 - REGISTER (Your friend's implementation)
  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException(
        'Le nom d’utilisateur ou l’email est déjà utilisé',
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    const { password: _, ...result } = savedUser;
    return result;
  }

  // SLIDE 11 - VALIDATE USER (Passport LocalStrategy)
  async validateUser(username: string, password: string) {
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }],
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Remove password before returning the user
    const { password: _, ...safeUser } = user;

    return safeUser;
  }

  // SLIDE 10 - ORIGINAL LOGIN METHOD (Preserved)
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(
      loginDto.username,
      loginDto.password,
    );

    // Reuse the JWT generation method
    return this.loginForUser(user);
  }

  // SLIDE 11 - GENERATE JWT AFTER AUTHENTICATION
  async loginForUser(user: {
    id: number;
    username: string;
    email: string;
    role: string;
  }) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Connexion réussie',
      access_token: accessToken,
      token_type: 'Bearer',
      user,
    };
  }
}
