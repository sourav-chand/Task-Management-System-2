import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { ProjectsService } from '../projects/projects.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService,
    private projectsService: ProjectsService,
    private jwtService: JwtService,
  ) {}

  async continueAsGuest() {
    let guestUser = await this.prisma.user.findFirst({
      where: { isGuest: true },
    });

    if (!guestUser) {
      guestUser = await this.prisma.user.create({
        data: {
          name: 'Dexter',
          isGuest: true,
          email: `dexter_guest@pyramid.app`,
          themePreference: 'system',
        },
      });
    }

    await this.tasksService.seedFigmaDemoTasks(guestUser.id);
    await this.projectsService.seedDefaultProjects(guestUser.id);

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
    const userEmail = email || 'dexter@pyramid.app';
    const userName = name || 'Dexter';

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
    }

    await this.tasksService.seedFigmaDemoTasks(user.id);
    await this.projectsService.seedDefaultProjects(user.id);

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
}
