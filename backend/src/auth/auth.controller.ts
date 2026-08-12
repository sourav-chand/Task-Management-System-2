import { Controller, Post, Get, Patch, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('guest')
  async continueAsGuest() {
    return this.authService.continueAsGuest();
  }

  @Post('google')
  async loginWithGoogle(@Body() body: { email?: string; name?: string }) {
    return this.authService.loginWithGoogle(body?.email, body?.name);
  }

  @Get('me')
  async getProfile(@Headers('authorization') authHeader?: string) {
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = this.jwtService.verify(token);
      return this.authService.getProfile(decoded.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Patch('theme')
  async updateTheme(
    @Headers('authorization') authHeader: string,
    @Body() body: { theme: string },
  ) {
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = this.jwtService.verify(token);
      return this.authService.updateTheme(decoded.sub, body.theme);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
