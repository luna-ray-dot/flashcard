import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly neo4jService: Neo4jService) {}

  // Create a new user
  async createUser(createUserDto: CreateUserDto) {
    const { username, password, email } = createUserDto;

    // Check if username or email already exists
    const existing = await this.neo4jService.read(
      `
      MATCH (u:User)
      WHERE u.username = $username OR u.email = $email
      RETURN u
      `,
      { username, email }
    );

    if (existing.records.length) {
      throw new BadRequestException('Username or email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.neo4jService.write(
      `
      CREATE (u:User {
        id: randomUUID(),
        username: $username,
        password: $password,
        email: $email
      })
      RETURN u
      `,
      { username, password: hashedPassword, email }
    );

    const user = result.records[0]?.get('u');
    if (!user) {
      throw new BadRequestException('Failed to create user');
    }
    return user.properties;
  }

  // List all users
  async listUsers() {
    const result = await this.neo4jService.read(
      `
      MATCH (u:User)
      RETURN u
      `
    );

    return result.records.map((r: any) => r.get('u')?.properties || {});
  }

  // Save onboarding data
  async saveOnboarding(
    userId: string,
    data: {
      name: string;
      age: number;
      school: string;
      field: string;
      learningSpeed: 'fast' | 'average' | 'slow';
    }
  ) {
    const { name, age, school, field, learningSpeed } = data;

    const result = await this.neo4jService.write(
      `
      MATCH (u:User {id: $userId})
      SET u.name = $name,
          u.age = $age,
          u.school = $school,
          u.field = $field,
          u.learningSpeed = $learningSpeed
      RETURN u
      `,
      { userId, name, age, school, field, learningSpeed }
    );

    const user = result.records[0]?.get('u');
    if (!user) {
      throw new BadRequestException('Failed to update user');
    }
    return user.properties;
  }

  // Find user by ID
  async findById(userId: string) {
    const result = await this.neo4jService.read(
      `
      MATCH (u:User {id: $userId})
      RETURN u
      `,
      { userId }
    );

    if (!result.records.length) {
      throw new NotFoundException('User not found');
    }

    return result.records[0].get('u').properties;
  }

  // Find user by username
  async findByUsername(username: string) {
    const result = await this.neo4jService.read(
      `
      MATCH (u:User {username: $username})
      RETURN u
      `,
      { username }
    );

    return result.records.length ? result.records[0].get('u').properties : null;
  }
}
