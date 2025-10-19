import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetProdAdmin() {
  console.log('🔄 Resetting admin password on production...\n');
  
  const adminEmail = 'admin@trendstec.com';
  const adminPassword = 'Admin123456';
  
  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        failedLoginCount: 0,
        lockedUntil: null,
        isActive: true
      }
    });
    
    console.log('✅ Admin password reset successfully!\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('\n🌐 Login at: https://my-svelte-2r0f4dtym-myles-projects-dd515697.vercel.app/login\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetProdAdmin();
