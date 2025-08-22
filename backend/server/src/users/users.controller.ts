import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';




@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Register a new user
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  // List all users
  @Get()
  async getUsers() {
    return this.usersService.listUsers();
  }

  // Save onboarding data for a specific user
  @Post('onboarding/:userId')
  async onboarding(
    @Param('userId') userId: string,
    @Body() body: {
      name: string;
      age: number;
      school: string;
      field: string;
      learningSpeed: 'fast' | 'average' | 'slow';
    }
  ) {
    return this.usersService.saveOnboarding(userId, body);
  }

  // Get currently logged-in user (requires JWT auth)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      return { error: 'User not found' };
    }
    return this.usersService.findById(userId);
  }

  // Get a user by ID
  @Get(':userId')
  async getUserById(@Param('userId') userId: string) {
    return this.usersService.findById(userId);
  }
}
