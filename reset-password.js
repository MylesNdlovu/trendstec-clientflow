import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetPassword() {
  const email = 'admin@trendstec.com';
  const newPassword = 'Admin123!@#';

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      failedLoginCount: 0,
      lockedUntil: null
    }
  });

  console.log('✅ Password reset successfully for:', email);
  console.log('📧 Email:', email);
  console.log('🔑 Password:', newPassword);

  await prisma.$disconnect();
}

resetPassword().catch(console.error);
