
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { Cv } from './entities/cv.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';

import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';

import { BaseService } from '../common/services/base.service';

@Injectable()
export class CvsService extends BaseService<Cv> {

  constructor(
    @InjectRepository(Cv)
    private cvsRepository: Repository<Cv>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
  ) {
    super(cvsRepository);
  }

  // CREATE : spécifique à CV
  async create(createCvDto: CreateCvDto) {

    const { userId, skillIds, ...cvData } = createCvDto;

    const user = await this.usersRepository.findOneBy({
      id: userId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skills = skillIds?.length
      ? await this.skillsRepository.findBy({
          id: In(skillIds),
        })
      : [];

    if (skills.length !== (skillIds?.length ?? 0)) {
      throw new NotFoundException('One or more skills not found');
    }

    const cv = this.cvsRepository.create({
      ...cvData,
      user,
      skills,
    });

    return this.cvsRepository.save(cv);
  }

  // READ ALL : spécifique à CV (avec relations)
  async findAll() {
    return this.cvsRepository.find({
      relations: {
        user: true,
        skills: true,
      },
    });
  }

  // READ ONE : spécifique à CV (avec relations)
  async findOne(id: number) {
    const cv = await this.cvsRepository.findOne({
      where: { id },
      relations: {
        user: true,
        skills: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    return cv;
  }

  // UPDATE : spécifique à CV
  async update(id: number, updateCvDto: UpdateCvDto) {

    const cv = await this.findOne(id);

    const { userId, skillIds, ...cvData } = updateCvDto;

    Object.assign(cv, cvData);

    if (userId !== undefined) {
      const user = await this.usersRepository.findOneBy({
        id: userId,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      cv.user = user;
    }

    if (skillIds !== undefined) {
      const skills = skillIds.length
        ? await this.skillsRepository.findBy({
            id: In(skillIds),
          })
        : [];

      if (skills.length !== skillIds.length) {
        throw new NotFoundException('One or more skills not found');
      }

      cv.skills = skills;
    }

    return this.cvsRepository.save(cv);
  }

}
