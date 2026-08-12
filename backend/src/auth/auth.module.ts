import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'pyramid_secret_jwt_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
    forwardRef(() => TasksModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
