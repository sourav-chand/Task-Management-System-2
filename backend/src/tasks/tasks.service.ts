import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async getTasks(userId: string, status?: string, priority?: string, category?: string, search?: string, projectId?: string) {
    const where: any = { userId };

    if (projectId) {
      where.projectId = projectId;
    } else if (!projectId) {
      // When no projectId filter, return all tasks (standalone + project tasks)
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (search && search.trim()) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { tags: { contains: search } },
            { assigneeName: { contains: search } },
          ],
        },
      ];
    }

    return this.prisma.task.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getTaskById(id: string, userId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, userId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    let projectId: string | undefined = undefined;
    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, userId },
      });
      if (project) {
        projectId = project.id;
      }
    }

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        status: dto.status || 'To Do',
        priority: dto.priority || 'MEDIUM',
        category: dto.category || 'Deployment',
        assigneeName: dto.assigneeName || 'Admin',
        tags: dto.tags || 'Deployment,Deployment',
        dueDate: dto.dueDate || '29 Jul',
        userId,
        ...(projectId && { projectId }),
      },
    });
  }

  async updateTask(id: string, userId: string, dto: UpdateTaskDto) {
    await this.getTaskById(id, userId);

    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.assigneeName !== undefined && { assigneeName: dto.assigneeName }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate }),
        ...(dto.projectId !== undefined && { projectId: dto.projectId || null }),
      },
    });
  }

  async deleteTask(id: string, userId: string) {
    await this.getTaskById(id, userId);
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async seedFigmaDemoTasks(userId: string) {
    const tasksCount = await this.prisma.task.count({ where: { userId } });
    if (tasksCount > 0) return;

    await this.prisma.task.createMany({
      data: [
        // To Do
        {
          title: 'Write API Documentation',
          status: 'To Do',
          assigneeName: 'Admin',
          dueDate: '29 Jul',
          tags: 'Deployment,Deployment',
          userId,
        },
        {
          title: 'Implement Search Function',
          status: 'To Do',
          assigneeName: 'Admin',
          dueDate: '29 Jul',
          tags: 'Deployment,Deployment',
          userId,
        },
        {
          title: 'Deploy to Production',
          status: 'To Do',
          assigneeName: 'Admin',
          dueDate: '29 Jul',
          tags: 'Deployment,Deployment',
          userId,
        },
        // Doing
        {
          title: 'Code Review Completed',
          status: 'Doing',
          assigneeName: 'Admin',
          dueDate: '29 Jul',
          tags: 'Deployment,Deployment',
          userId,
        },
        {
          title: 'Design Mockups Finalized',
          status: 'Doing',
          assigneeName: 'Admin',
          dueDate: '29 Jul',
          tags: 'Deployment,Deployment',
          userId,
        },
        // Completed
        {
          title: 'Feature Testing Passed',
          status: 'Completed',
          assigneeName: 'QA Team',
          dueDate: '30 Jul',
          tags: 'Testing,Passed',
          userId,
        },
        {
          title: 'UI Design Updated',
          status: 'Completed',
          assigneeName: 'Designer',
          dueDate: '31 Jul',
          tags: 'Design,Updated',
          userId,
        },
        {
          title: 'Security Audit Scheduled',
          status: 'Completed',
          assigneeName: 'Security',
          dueDate: '01 Aug',
          tags: 'Audit,Scheduled',
          userId,
        },
        // On Hold
        {
          title: 'UI Review',
          status: 'On Hold',
          assigneeName: 'Design',
          dueDate: '02 Aug',
          tags: 'Review',
          userId,
        },
        {
          title: 'Backend Integration',
          status: 'On Hold',
          assigneeName: 'Dev Team',
          dueDate: '03 Aug',
          tags: 'Development',
          userId,
        },
        {
          title: 'User Feedback',
          status: 'On Hold',
          assigneeName: 'Product',
          dueDate: '04 Aug',
          tags: 'Research',
          userId,
        },
        {
          title: 'Performance Audit',
          status: 'On Hold',
          assigneeName: 'Engineering',
          dueDate: '05 Aug',
          tags: 'Optimization',
          userId,
        },
      ],
    });
  }
}
