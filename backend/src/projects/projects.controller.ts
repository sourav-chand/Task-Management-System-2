import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtService } from '@nestjs/jwt';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
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
  async getProjects(@Headers('authorization') authHeader: string) {
    const userId = this.extractUserId(authHeader);
    return this.projectsService.getProjects(userId);
  }

  @Get(':id')
  async getProjectById(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.projectsService.getProjectById(id, userId);
  }

  @Post()
  async createProject(
    @Headers('authorization') authHeader: string,
    @Body() dto: CreateProjectDto,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.projectsService.createProject(userId, dto);
  }

  @Patch(':id')
  async updateProject(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.projectsService.updateProject(id, userId, dto);
  }

  @Delete(':id')
  async deleteProject(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.projectsService.deleteProject(id, userId);
  }
}
