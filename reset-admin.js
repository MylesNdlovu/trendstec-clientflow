import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAdmin() {
  const email = 'admin@trendstec.com';
  const newPassword = 'Admin123456';  // Simple password without special chars

  console.log('Resetting admin password...');
  console.log('Email:', email);
  console.log('New Password:', newPassword);

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      failedLoginCount: 0,
      lockedUntil: null
    }
  });

  console.log('✅ Password reset successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email:', email);
  console.log('  Password:', newPassword);

  await prisma.$disconnect();
}

resetAdmin().catch(console.error);
