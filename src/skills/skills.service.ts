
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Skill } from './entities/skill.entity';
import { BaseService } from '../common/services/base.service';

@Injectable()
export class SkillsService extends BaseService<Skill> {

  constructor(
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>
  ) {
    super(skillRepository);
  }

}
