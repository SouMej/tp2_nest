import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { CvsController } from './cvs.controller';
import { CvsService } from './cvs.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { UserRoleEnum } from '../users/enums/user-role.enum';

// HTTP-level tests: real JwtStrategy, AuthGuard('jwt'), AdminGuard and
// ValidationPipe; only the CvsService (database) is mocked.
describe('CvsController (route protection + admin access)', () => {
  const SECRET = 'test-secret-only-for-unit-tests';

  let app: INestApplication<App>;
  let jwtService: JwtService;
  let userToken: string;
  let adminToken: string;

  const cvsService = {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  const validCv = {
    name: 'Doe',
    firstname: 'John',
    age: 30,
    Cin: 12345678,
    Job: 'Dev',
    path: '/cv.pdf',
  };

  const normalUser = { userId: 1, username: 'alice', role: UserRoleEnum.USER };
  const adminUser = { userId: 2, username: 'boss', role: UserRoleEnum.ADMIN };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret: SECRET })],
      controllers: [CvsController],
      providers: [
        JwtStrategy,
        { provide: CvsService, useValue: cvsService },
        { provide: ConfigService, useValue: { get: () => SECRET } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Same pipe configuration as main.ts
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    jwtService = moduleRef.get(JwtService);
    userToken = await jwtService.signAsync({ sub: 1, username: 'alice', role: 'user' });
    adminToken = await jwtService.signAsync({ sub: 2, username: 'boss', role: 'admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const server = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('unauthenticated requests are rejected (401)', () => {
    it.each([
      ['POST', '/cvs'],
      ['GET', '/cvs'],
      ['GET', '/cvs/all'],
      ['GET', '/cvs/1'],
      ['PATCH', '/cvs/1'],
      ['DELETE', '/cvs/1'],
    ])('%s %s without token', async (method, url) => {
      const verb = method.toLowerCase() as 'get' | 'post' | 'patch' | 'delete';

      await server()[verb](url).send(validCv).expect(401);
    });

    it('rejects a token signed with another secret', async () => {
      const forged = await new JwtService({ secret: 'other' }).signAsync({
        sub: 2,
        username: 'boss',
        role: 'admin',
      });

      await server().get('/cvs/all').set(bearer(forged)).expect(401);
    });

    it('rejects an expired token', async () => {
      const expired = await jwtService.signAsync(
        { sub: 1, username: 'alice', role: 'user' },
        { expiresIn: -1 },
      );

      await server().get('/cvs').set(bearer(expired)).expect(401);
    });

    it('never reaches the service', async () => {
      await server().get('/cvs').expect(401);

      expect(cvsService.findAll).not.toHaveBeenCalled();
    });
  });

  describe('ownership: the authenticated user is passed to the service', () => {
    it('POST /cvs uses the token user as owner and strips a client userId', async () => {
      await server()
        .post('/cvs')
        .set(bearer(userToken))
        .send({ ...validCv, userId: 2 })
        .expect(201);

      const [dto, ownerId] = cvsService.create.mock.calls[0];
      expect(ownerId).toBe(1);
      expect(dto).not.toHaveProperty('userId');
    });

    it('GET /cvs returns the user own CVs', async () => {
      await server().get('/cvs').set(bearer(userToken)).expect(200);

      expect(cvsService.findAll).toHaveBeenCalledWith(normalUser);
    });

    it('GET /cvs/:id is scoped to the user', async () => {
      await server().get('/cvs/7').set(bearer(userToken)).expect(200);

      expect(cvsService.findOne).toHaveBeenCalledWith(7, 1);
    });

    it('PATCH /cvs/:id is scoped to the user and strips a client userId', async () => {
      await server()
        .patch('/cvs/7')
        .set(bearer(userToken))
        .send({ name: 'New', userId: 2 })
        .expect(200);

      const [id, dto, ownerId] = cvsService.update.mock.calls[0];
      expect(id).toBe(7);
      expect(ownerId).toBe(1);
      expect(dto).not.toHaveProperty('userId');
    });

    it('DELETE /cvs/:id is scoped to the user', async () => {
      await server().delete('/cvs/7').set(bearer(userToken)).expect(200);

      expect(cvsService.remove).toHaveBeenCalledWith(7, 1);
    });

    it('an admin token does not bypass ownership on update/delete', async () => {
      await server().patch('/cvs/7').set(bearer(adminToken)).send({ name: 'X' }).expect(200);
      await server().delete('/cvs/7').set(bearer(adminToken)).expect(200);

      expect(cvsService.update.mock.calls[0][2]).toBe(2);
      expect(cvsService.remove).toHaveBeenCalledWith(7, 2);
    });
  });

  describe('admin access: GET /cvs/all', () => {
    it('allows an admin and asks the service for all CVs', async () => {
      await server().get('/cvs/all').set(bearer(adminToken)).expect(200);

      expect(cvsService.findAll).toHaveBeenCalledWith(adminUser, true);
    });

    it('denies a normal user (403) without calling the service', async () => {
      await server().get('/cvs/all').set(bearer(userToken)).expect(403);

      expect(cvsService.findAll).not.toHaveBeenCalled();
    });

    it('is not treated as GET /cvs/:id', async () => {
      await server().get('/cvs/all').set(bearer(adminToken)).expect(200);

      expect(cvsService.findOne).not.toHaveBeenCalled();
    });
  });
});
