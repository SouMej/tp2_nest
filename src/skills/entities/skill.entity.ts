import { ManyToMany } from 'typeorm';
import { Cv } from '../../cvs/entities/cv.entity';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('skills')
export class Skill {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  Designation: string;
  @ManyToMany(() => Cv, (cv) => cv.skills)
  cvs: Cv[];

}
