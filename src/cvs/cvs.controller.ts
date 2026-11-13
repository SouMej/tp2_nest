
import {
  Controller, Get, Post, Body,
  Patch, Param, Delete, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CvsService } from './cvs.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('cvs')
export class CvsController {

  constructor(private readonly cvsService: CvsService) {}

  @Post()
  create(@Body() dto: CreateCvDto) {
    return this.cvsService.create(dto);
  }

  @Get()
  findAll() {
    return this.cvsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cvsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCvDto,
  ) {
    return this.cvsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cvsService.remove(id);
  }
}
