
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

// Does not extend BaseService: every CV operation is scoped to its owner,
// so the generic (unscoped) base methods must not be exposed here.
@Injectable()
export class CvsService {

  constructor(
    @InjectRepository(Cv)
    private cvsRepository: Repository<Cv>,

    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Skill)
    private skillsRepository: Repository<Skill>,
  ) {}

  // CREATE : spécifique à CV
  // The owner always comes from the authenticated user, never from the DTO
  async create(createCvDto: CreateCvDto, userId: number) {

    const { skillIds, ...cvData } = createCvDto;

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

  // READ ALL : only the CVs owned by the user
  async findAll(userId: number) {
    return this.cvsRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
        skills: true,
      },
    });
  }

  // READ ONE : a CV owned by another user is treated as not found
  async findOne(id: number, userId: number) {
    const cv = await this.cvsRepository.findOne({
      where: { id, user: { id: userId } },
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

  // UPDATE : only the owner can update, and the owner cannot be changed
  async update(id: number, updateCvDto: UpdateCvDto, userId: number) {

    const cv = await this.findOne(id, userId);

    const { skillIds, ...cvData } = updateCvDto;

    Object.assign(cv, cvData);

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

  // DELETE : only the owner can delete
  async remove(id: number, userId: number) {
    const cv = await this.findOne(id, userId);

    await this.cvsRepository.remove(cv);
  }

}
