import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader?: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const decoded = this.jwtService.verify(token);
      return decoded.sub;
    } catch {
      throw new UnauthorizedException('Invalid authorization token');
    }
  }

  @Get()
  async getTasks(
    @Headers('authorization') authHeader: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tasksService.getTasks(userId, status, priority, category, search);
  }

  @Get(':id')
  async getTaskById(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tasksService.getTaskById(id, userId);
  }

  @Post()
  async createTask(
    @Headers('authorization') authHeader: string,
    @Body() dto: CreateTaskDto,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tasksService.createTask(userId, dto);
  }

  @Patch(':id')
  async updateTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tasksService.updateTask(id, userId, dto);
  }

  @Delete(':id')
  async deleteTask(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.tasksService.deleteTask(id, userId);
  }
}
