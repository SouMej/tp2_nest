import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '../../users/enums/user-role.enum';

export const ROLES_KEY = 'roles';

// Declares which roles may access a route or controller.
// New roles only need to be added to UserRoleEnum.
export const Roles = (...roles: UserRoleEnum[]) =>
  SetMetadata(ROLES_KEY, roles);
