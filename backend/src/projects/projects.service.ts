import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async getProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { tasks: true } } },
    });
  }

  async getProjectById(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        priority: dto.priority || 'Medium',
        lead: dto.lead || 'Admin',
        dueDate: dto.dueDate || '',
        status: dto.status || 'To Do',
        team: dto.team || '',
        labels: dto.labels || '',
        userId,
      },
    });
  }

  async updateProject(id: string, userId: string, dto: UpdateProjectDto) {
    await this.getProjectById(id, userId);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.lead !== undefined && { lead: dto.lead }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.team !== undefined && { team: dto.team }),
        ...(dto.labels !== undefined && { labels: dto.labels }),
      },
    });
  }

  async deleteProject(id: string, userId: string) {
    await this.getProjectById(id, userId);
    return this.prisma.project.delete({ where: { id } });
  }

  async seedDefaultProjects(userId: string) {
    const count = await this.prisma.project.count({ where: { userId } });
    if (count > 0) return;

    const p1 = await this.prisma.project.create({
      data: {
        name: 'Design Homepage',
        priority: 'High',
        lead: 'Dexter',
        dueDate: '30 Aug',
        status: 'In Progress',
        team: 'Design',
        labels: 'Frontend',
        userId,
      },
    });

    const p2 = await this.prisma.project.create({
      data: {
        name: 'Develop Login Feature',
        priority: 'Low',
        lead: 'Admin',
        dueDate: '05 Sep',
        status: 'To Do',
        team: 'Dev',
        labels: 'Backend',
        userId,
      },
    });

    const p3 = await this.prisma.project.create({
      data: {
        name: 'Test Payment Gateway',
        priority: 'Medium',
        lead: 'QA Team',
        dueDate: '12 Sep',
        status: 'In Progress',
        team: 'QA',
        labels: 'Testing',
        userId,
      },
    });

    await this.prisma.task.createMany({
      data: [
        // Project 1 tasks
        { title: 'Design Homepage', status: 'To Do', priority: 'HIGH', assigneeName: 'Dexter', dueDate: '12 Sep 2026', userId, projectId: p1.id },
        { title: 'Develop Login Feature', status: 'To Do', priority: 'LOW', assigneeName: 'CN', dueDate: '15 Sep 2026', userId, projectId: p1.id },
        { title: 'Test Payment Gateway', status: 'To Do', priority: 'MEDIUM', assigneeName: '', dueDate: '18 Sep 2026', userId, projectId: p1.id },
        { title: 'Design Homepage', status: 'Doing', priority: 'HIGH', assigneeName: 'Dexter', dueDate: '12 Sep 2026', userId, projectId: p1.id },
        { title: 'Develop Login Feature', status: 'Doing', priority: 'LOW', assigneeName: 'CN', dueDate: '15 Sep 2026', userId, projectId: p1.id },
        { title: 'Test Payment Gateway', status: 'Doing', priority: 'MEDIUM', assigneeName: '', dueDate: '18 Sep 2026', userId, projectId: p1.id },
        { title: 'Design Homepage', status: 'Completed', priority: 'HIGH', assigneeName: 'Dexter', dueDate: '12 Sep 2026', userId, projectId: p1.id },
        { title: 'Develop Login Feature', status: 'Completed', priority: 'LOW', assigneeName: 'CN', dueDate: '15 Sep 2026', userId, projectId: p1.id },
        { title: 'Test Payment Gateway', status: 'Completed', priority: 'MEDIUM', assigneeName: '', dueDate: '18 Sep 2026', userId, projectId: p1.id },

        // Project 2 tasks
        { title: 'Set Up Auth Endpoints', status: 'To Do', priority: 'HIGH', assigneeName: 'Admin', dueDate: '01 Sep 2026', userId, projectId: p2.id },
        { title: 'Design Login UI', status: 'To Do', priority: 'MEDIUM', assigneeName: 'Designer', dueDate: '03 Sep 2026', userId, projectId: p2.id },
        { title: 'Write Auth Unit Tests', status: 'Doing', priority: 'MEDIUM', assigneeName: 'QA Team', dueDate: '04 Sep 2026', userId, projectId: p2.id },
        { title: 'Integrate OAuth Provider', status: 'Doing', priority: 'URGENT', assigneeName: 'Admin', dueDate: '05 Sep 2026', userId, projectId: p2.id },
        { title: 'Stakeholder Sign-Off', status: 'Completed', priority: 'LOW', assigneeName: 'Admin', dueDate: '28 Aug 2026', userId, projectId: p2.id },

        // Project 3 tasks
        { title: 'Write Payment Test Cases', status: 'To Do', priority: 'HIGH', assigneeName: 'QA Team', dueDate: '08 Sep 2026', userId, projectId: p3.id },
        { title: 'Mock Payment API', status: 'To Do', priority: 'MEDIUM', assigneeName: 'Dev Team', dueDate: '09 Sep 2026', userId, projectId: p3.id },
        { title: 'Run Integration Tests', status: 'Doing', priority: 'URGENT', assigneeName: 'QA Team', dueDate: '11 Sep 2026', userId, projectId: p3.id },
        { title: 'Fix Failed Transactions', status: 'Doing', priority: 'HIGH', assigneeName: 'Dev Team', dueDate: '12 Sep 2026', userId, projectId: p3.id },
        { title: 'Document Test Results', status: 'Completed', priority: 'LOW', assigneeName: 'QA Team', dueDate: '06 Sep 2026', userId, projectId: p3.id },
        { title: 'Security Review', status: 'On Hold', priority: 'URGENT', assigneeName: 'Security', dueDate: '14 Sep 2026', userId, projectId: p3.id },
      ],
    });
  }
}
