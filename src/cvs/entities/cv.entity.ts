import { ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ManyToMany, JoinTable } from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('cvs')
export class Cv {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  firstname: string;

  @Column()
  age: number;

  @Column()
  Cin: number;

  @Column()
  Job: string;

  @Column()
  path: string;
  @ManyToOne(() => User, (user) => user.cvs)
  user: User;
  @ManyToMany(() => Skill, (skill) => skill.cvs)
  @JoinTable()
  skills: Skill[];

}
