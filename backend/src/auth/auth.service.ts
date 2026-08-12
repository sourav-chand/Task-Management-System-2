import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async continueAsGuest() {
    // Create a new guest user or reuse guest account
    const guestUser = await this.prisma.user.create({
      data: {
        name: `Guest User #${Math.floor(1000 + Math.random() * 9000)}`,
        isGuest: true,
        email: `guest_${Date.now()}@pyramid.app`,
        themePreference: 'system',
      },
    });

    // Create seed demo tasks for the new guest user
    await this.seedDemoTasksForUser(guestUser.id);

    const token = this.jwtService.sign({
      sub: guestUser.id,
      name: guestUser.name,
      isGuest: true,
    });

    return {
      user: guestUser,
      token,
      message: 'Logged in as guest successfully',
    };
  }

  async loginWithGoogle(email?: string, name?: string) {
    const userEmail = email || 'user@example.com';
    const userName = name || 'Google User';

    let user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: userEmail,
          name: userName,
          isGuest: false,
          themePreference: 'system',
        },
      });

      await this.seedDemoTasksForUser(user.id);
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      isGuest: false,
    });

    return {
      user,
      token,
      message: 'Logged in with Google successfully',
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async updateTheme(userId: string, theme: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { themePreference: theme },
    });
  }

  private async seedDemoTasksForUser(userId: string) {
    await this.prisma.task.createMany({
      data: [
        {
          title: 'Design System Alignment & Figma Audit',
          description: 'Ensure layout accuracy, typography, spacing, and buttons match Figma specs.',
          status: 'COMPLETED',
          priority: 'HIGH',
          category: 'Design',
          userId,
        },
        {
          title: 'Implement Dynamic Theme Persist (Light / Dark)',
          description: 'Persist theme selection across refreshes using localStorage & NextJS Theme provider.',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          category: 'Frontend',
          userId,
        },
        {
          title: 'Connect Guest Auth to NestJS API endpoints',
          description: 'Enable full stack task CRUD operations and real-time backend persistence.',
          status: 'TODO',
          priority: 'MEDIUM',
          category: 'Backend',
          userId,
        },
      ],
    });
  }
}
