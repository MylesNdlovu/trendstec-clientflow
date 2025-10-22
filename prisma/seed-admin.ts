import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding admin user...');

  const hashedPassword = await bcrypt.hash('Admin123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@trendstec.com' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    },
    create: {
      email: 'admin@trendstec.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      emailVerified: true
    }
  });

  console.log('✅ Admin user created/updated:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
