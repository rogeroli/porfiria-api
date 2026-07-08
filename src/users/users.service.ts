import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserProfile } from './enums/user-profile.enum';
import { UserStatus } from './enums/user-status.enum';
import { PublicUser } from './types/public-user';

interface CreateUserInput {
  name: string;
  profile: UserProfile;
  email: string;
  passwordHash: string;
  status?: UserStatus;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toPublicUser(user) : null;
  }

  async create(input: CreateUserInput): Promise<PublicUser> {
    const user = await this.prisma.user.create({
      data: input,
    });

    return this.toPublicUser(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    return this.toPublicUser(user);
  }

  async updatePasswordAndStatus(
    id: string,
    passwordHash: string,
    status: UserStatus,
  ): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        status,
      },
    });

    return this.toPublicUser(user);
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      profile: user.profile as UserProfile,
      status: user.status as UserStatus,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
