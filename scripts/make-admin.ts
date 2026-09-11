import * as bcrypt from 'bcrypt';
import { PrismaClient, UserProfile, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();
const PASSWORD_SALT_ROUNDS = 12;

async function main(): Promise<void> {
  const [, , emailArg, passwordArg, nameArg] = process.argv;
  const email = emailArg?.toLowerCase();

  if (!email) {
    throw new Error('Informe o email: npm run users:make-admin -- admin@email.com Senha@123');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        role: UserRole.ADMIN,
        status: UserStatus.AVAILABLE,
      },
    });
    console.log(`Usuario promovido para ADMIN: ${email}`);
    return;
  }

  if (!passwordArg) {
    throw new Error('Usuario nao existe. Informe uma senha inicial forte como segundo argumento.');
  }

  const passwordHash = await bcrypt.hash(passwordArg, PASSWORD_SALT_ROUNDS);
  await prisma.user.create({
    data: {
      name: nameArg ?? 'Administrador',
      profileId: '33333333-3333-4333-8333-333333333333',
      role: UserRole.ADMIN,
      status: UserStatus.AVAILABLE,
      email,
      passwordHash,
    },
  });
  console.log(`Usuario ADMIN criado: ${email}`);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
