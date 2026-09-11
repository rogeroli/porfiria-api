import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileStatus } from '../profiles/enums/profile-status.enum';
import { ProfileSummary } from '../profiles/types/profile-summary';
import { UserRole } from './enums/user-role.enum';
import { UserStatus } from './enums/user-status.enum';
import { PublicUser } from './types/public-user';

type UserWithProfile = Prisma.UserGetPayload<{ include: { profile: true } }>;

interface CreateUserInput {
  name: string;
  profileId: string;
  email: string;
  passwordHash: string;
  status?: UserStatus;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithProfile | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { profile: true },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    return user ? this.toPublicUser(user) : null;
  }

  async create(input: CreateUserInput): Promise<PublicUser> {
    const user = await this.prisma.user.create({
      data: input,
      include: { profile: true },
    });

    return this.toPublicUser(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<PublicUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: { profile: true },
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
      include: { profile: true },
    });

    return this.toPublicUser(user);
  }

  private toPublicUser(user: UserWithProfile): PublicUser {
    return {
      id: user.id,
      name: user.name,
      profileId: user.profileId,
      profile: {
        id: user.profile.id,
        code: user.profile.code,
        name: user.profile.name,
        description: user.profile.description,
        status: user.profile.status as ProfileStatus,
      } satisfies ProfileSummary,
      status: user.status as UserStatus,
      role: user.role as UserRole,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
