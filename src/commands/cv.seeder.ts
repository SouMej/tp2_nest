import { NestFactory } from '@nestjs/core';
import {
  rand,
  randEmail,
  randFilePath,
  randFirstName,
  randJobTitle,
  randLastName,
  randNumber,
  randPassword,
  randSkill,
  randUserName,
} from '@ngneat/falso';

import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { SkillsService } from '../skills/skills.service';
import { CvsService } from '../cvs/cvs.service';
import { User } from '../users/entities/user.entity';
import { Skill } from '../skills/entities/skill.entity';

const NB_USERS = 5;
const NB_SKILLS = 10;
const NB_CVS = 20;
const NB_SKILLS_PAR_CV = 3;

// Choisit n éléments différents au hasard dans un tableau
function pickRandom<T>(items: T[], n: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, n);
}

async function bootstrap() {
  // Application standalone : uniquement le conteneur IoC, pas de serveur HTTP
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // On récupère les services depuis le conteneur
    const usersService = app.get(UsersService);
    const skillsService = app.get(SkillsService);
    const cvsService = app.get(CvsService);

    // 1. Les users (un cv a besoin d'un user existant)
    const users: User[] = [];
    for (let i = 0; i < NB_USERS; i++) {
      const user = await usersService.create({
        username: randUserName(),
        email: randEmail(),
        password: randPassword(),
      });
      users.push(user);
    }

    // 2. Les skills (le Set enlève les désignations en double)
    const designations = [...new Set(randSkill({ length: NB_SKILLS }))];
    const skills: Skill[] = [];
    for (const designation of designations) {
      const skill = await skillsService.create({ Designation: designation });
      skills.push(skill);
    }

    // 3. Les cvs, reliés à un user et à plusieurs skills
    for (let i = 0; i < NB_CVS; i++) {
      await cvsService.create(
        {
          name: randLastName(),
          firstname: randFirstName(),
          age: randNumber({ min: 18, max: 65 }),
          Cin: randNumber({ min: 10000000, max: 99999999 }),
          Job: randJobTitle(),
          path: randFilePath(),
          skillIds: pickRandom(skills, NB_SKILLS_PAR_CV).map((skill) => skill.id),
        },
        rand(users).id,
      );
    }

    console.log(
      `Seed terminé : ${users.length} users, ${skills.length} skills, ${NB_CVS} cvs`,
    );
  } finally {
    // On ferme le contexte (et la connexion à la base) dans tous les cas
    await app.close();
  }
}

bootstrap();