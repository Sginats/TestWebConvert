import { PrismaClient, Role } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminHash = await argon2.hash('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminHash,
      name: 'Admin User',
      role: Role.ADMIN,
      wallet: { create: { balance: 9999 } },
    },
  });
  console.log('Created admin:', admin.email);

  // Create normal user
  const userHash = await argon2.hash('User123!');
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: userHash,
      name: 'Test User',
      role: Role.USER,
      wallet: { create: { balance: 20 } },
    },
  });
  console.log('Created user:', user.email);

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
