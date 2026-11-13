
import { JwtService } from '@nestjs/jwt';

describe('JWT Authentication - Slide 11', () => {
  const secret = 'test-secret-only-for-unit-tests';

  const jwtService = new JwtService({
    secret,
    signOptions: { expiresIn: '1h' },
  });

  const payload = {
    sub: 1,
    username: 'testuser',
    role: 'user',
  };

  it('should generate a valid JWT', async () => {
    const token = await jwtService.signAsync(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = await jwtService.verifyAsync(token);

    expect(decoded.sub).toBe(1);
    expect(decoded.username).toBe('testuser');
    expect(decoded.role).toBe('user');
  });

  it('should reject a token signed with another secret', async () => {
    const token = await jwtService.signAsync(payload);

    const otherJwtService = new JwtService({
      secret: 'different-secret',
    });

    await expect(
      otherJwtService.verifyAsync(token),
    ).rejects.toThrow();
  });

  it('should reject expired tokens', async () => {
    const expiredToken = await jwtService.signAsync(
      payload,
      { expiresIn: -1 },
    );

    await expect(
      jwtService.verifyAsync(expiredToken),
    ).rejects.toThrow();
  });
});
