
import {
  Controller, Get, Post, Body,
  Patch, Param, Delete, ParseIntPipe, UseGuards, Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { CvsService } from './cvs.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../users/enums/user-role.enum';

// Shape of req.user as returned by JwtStrategy.validate()
interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    username: string;
    role: string;
  };
}

@UseGuards(AuthGuard('jwt'))
@Controller('cvs')
export class CvsController {

  constructor(private readonly cvsService: CvsService) {}

  @Post()
  create(@Body() dto: CreateCvDto, @Req() req: AuthenticatedRequest) {
    return this.cvsService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.cvsService.findAll(req.user);
  }

  // Admin only: every CV. Declared before ':id' so 'all' is not parsed as an id.
  @Get('all')
  @Roles(UserRoleEnum.ADMIN)
  @UseGuards(AdminGuard)
  findAllForAdmin(@Req() req: AuthenticatedRequest) {
    return this.cvsService.findAll(req.user, true);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cvsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCvDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cvsService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cvsService.remove(id, req.user.userId);
  }
}
