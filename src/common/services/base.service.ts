
import {
  Repository,
  ObjectLiteral,
  DeepPartial,
  FindOptionsWhere,
} from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';

interface HasId {
  id: number;
}

@Injectable()
export class BaseService<T extends ObjectLiteral & HasId> {

  constructor(
    protected readonly repository: Repository<T>
  ) {}

  // CREATE
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  // READ ALL
  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  // READ ONE
  async findOne(id: number): Promise<T> {
    const where = { id } as FindOptionsWhere<T>;

    const entity = await this.repository.findOne({ where });

    if (!entity) {
      throw new NotFoundException(
        `Entity with id ${id} not found`
      );
    }

    return entity;
  }

  // UPDATE
  async update(id: number, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findOne(id);

    const updatedEntity = this.repository.merge(entity, data);

    return await this.repository.save(updatedEntity);
  }

  // DELETE
  async remove(id: number): Promise<void> {
    const entity = await this.findOne(id);

    await this.repository.remove(entity);
  }
}
