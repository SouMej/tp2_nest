import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { CvsService } from './cvs.service';
import { Cv } from './entities/cv.entity';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { UserRoleEnum } from '../users/enums/user-role.enum';

describe('CvsService (ownership + admin access)', () => {
  let service: CvsService;

  const cvsRepository = {
    create: jest.fn((data: Partial<Cv>) => data),
    save: jest.fn((cv: Partial<Cv>) => Promise.resolve(cv)),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const usersRepository = { findOneBy: jest.fn() };
  const skillsRepository = { findBy: jest.fn() };

  const owner = { id: 1, username: 'owner' } as User;
  const ownerUser = { userId: 1, role: UserRoleEnum.USER };
  const adminUser = { userId: 99, role: UserRoleEnum.ADMIN };

  const relations = { user: true, skills: true };
  const dto = {
    name: 'Doe',
    firstname: 'John',
    age: 30,
    Cin: 12345678,
    Job: 'Dev',
    path: '/cv.pdf',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvsService,
        { provide: getRepositoryToken(Cv), useValue: cvsRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Skill), useValue: skillsRepository },
      ],
    }).compile();

    service = module.get(CvsService);
  });

  describe('create', () => {
    it('assigns the authenticated user as owner', async () => {
      usersRepository.findOneBy.mockResolvedValue(owner);

      const cv = await service.create(dto, 1);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(cv.user).toBe(owner);
    });

    it('ignores an owner id smuggled into the DTO', async () => {
      usersRepository.findOneBy.mockResolvedValue(owner);
      const spoofed = { ...dto, userId: 2 } as CreateCvDto;

      const cv = await service.create(spoofed, 1);

      expect(usersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(usersRepository.findOneBy).not.toHaveBeenCalledWith({ id: 2 });
      expect(cv.user).toBe(owner);
    });

    it('throws when the authenticated user no longer exists', async () => {
      usersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(NotFoundException);
      expect(cvsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => cvsRepository.find.mockResolvedValue([]));

    it('returns only the CVs of a normal user', async () => {
      await service.findAll(ownerUser);

      expect(cvsRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        relations,
      });
    });

    it('returns every CV for an admin', async () => {
      await service.findAll(adminUser);

      expect(cvsRepository.find).toHaveBeenCalledWith({ relations });
    });
  });

  describe('findOne', () => {
    it('filters by id AND owner in the query', async () => {
      const cv = { id: 5, user: owner };
      cvsRepository.findOne.mockResolvedValue(cv);

      await expect(service.findOne(5, 1)).resolves.toBe(cv);
      expect(cvsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 5, user: { id: 1 } },
        relations,
      });
    });

    it("returns 404 for another user's CV", async () => {
      cvsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(5, 2)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates a CV owned by the user', async () => {
      cvsRepository.findOne.mockResolvedValue({ id: 5, name: 'Old', user: owner });

      const cv = await service.update(5, { name: 'New' }, 1);

      expect(cvsRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 5, user: { id: 1 } } }),
      );
      expect(cv.name).toBe('New');
    });

    it('never changes the owner, even if the DTO contains userId', async () => {
      cvsRepository.findOne.mockResolvedValue({ id: 5, name: 'Old', user: owner });
      const spoofed = { name: 'New', userId: 2 } as UpdateCvDto;

      const cv = await service.update(5, spoofed, 1);

      expect(cv.user).toBe(owner);
      expect(usersRepository.findOneBy).not.toHaveBeenCalled();
    });

    it("rejects updating another user's CV", async () => {
      cvsRepository.findOne.mockResolvedValue(null);

      await expect(service.update(5, { name: 'Hacked' }, 2)).rejects.toThrow(
        NotFoundException,
      );
      expect(cvsRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes a CV owned by the user', async () => {
      const cv = { id: 5, user: owner };
      cvsRepository.findOne.mockResolvedValue(cv);

      await service.remove(5, 1);

      expect(cvsRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 5, user: { id: 1 } } }),
      );
      expect(cvsRepository.remove).toHaveBeenCalledWith(cv);
    });

    it("rejects deleting another user's CV", async () => {
      cvsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(5, 2)).rejects.toThrow(NotFoundException);
      expect(cvsRepository.remove).not.toHaveBeenCalled();
    });
  });
});
