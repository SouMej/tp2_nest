import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AdminGuard } from './admin.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRoleEnum } from '../../users/enums/user-role.enum';

// Fake controllers used only to carry @Roles() metadata
@Roles(UserRoleEnum.USER)
class UserLevelController {
  @Roles(UserRoleEnum.ADMIN)
  adminOnly(this: void) {}

  inheritsClassRoles(this: void) {}
}

class NoRolesController {
  noRoles(this: void) {}

  @Roles('moderator' as UserRoleEnum)
  moderatorOnly(this: void) {}
}

const buildContext = (
  handler: () => void,
  controller: object,
  user?: { role?: string },
): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('AdminGuard (slides 13-14)', () => {
  const guard = new AdminGuard(new Reflector());
  const admin = { role: UserRoleEnum.ADMIN };
  const user = { role: UserRoleEnum.USER };

  describe('with @Roles(ADMIN) on the method', () => {
    const handler = UserLevelController.prototype.adminOnly;

    it('allows an admin', () => {
      expect(guard.canActivate(buildContext(handler, UserLevelController, admin))).toBe(true);
    });

    it('denies a normal user', () => {
      expect(guard.canActivate(buildContext(handler, UserLevelController, user))).toBe(false);
    });

    it('method roles override controller roles (getAllAndOverride)', () => {
      // The class says USER, but the method says ADMIN: the method wins
      expect(guard.canActivate(buildContext(handler, UserLevelController, user))).toBe(false);
    });
  });

  it('falls back to the controller @Roles() when the method has none', () => {
    const handler = UserLevelController.prototype.inheritsClassRoles;

    expect(guard.canActivate(buildContext(handler, UserLevelController, user))).toBe(true);
  });

  describe('without any @Roles()', () => {
    const handler = NoRolesController.prototype.noRoles;

    it('defaults to admin only: allows an admin', () => {
      expect(guard.canActivate(buildContext(handler, NoRolesController, admin))).toBe(true);
    });

    it('defaults to admin only: denies a normal user', () => {
      expect(guard.canActivate(buildContext(handler, NoRolesController, user))).toBe(false);
    });
  });

  it('denies when there is no authenticated user', () => {
    const handler = UserLevelController.prototype.adminOnly;

    expect(guard.canActivate(buildContext(handler, UserLevelController, undefined))).toBe(false);
    expect(guard.canActivate(buildContext(handler, UserLevelController, {}))).toBe(false);
  });

  it('supports new roles without changing the guard (extensibility)', () => {
    const handler = NoRolesController.prototype.moderatorOnly;

    expect(guard.canActivate(buildContext(handler, NoRolesController, { role: 'moderator' }))).toBe(true);
    expect(guard.canActivate(buildContext(handler, NoRolesController, admin))).toBe(false);
  });
});
