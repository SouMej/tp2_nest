import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRoleEnum } from '../../users/enums/user-role.enum';

// Must run after AuthGuard('jwt'), which populates request.user.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Roles from @Roles() on the method override those on the controller.
    // Without @Roles(), the guard defaults to admin only.
    const requiredRoles =
      this.reflector.getAllAndOverride<UserRoleEnum[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [UserRoleEnum.ADMIN];

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>();
    const role = request.user?.role;

    return !!role && requiredRoles.some((required) => required === role);
  }
}
