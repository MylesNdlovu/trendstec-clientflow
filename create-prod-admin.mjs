import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createProdAdmin() {
  console.log('🚀 Creating admin user on production database...\n');
  
  const adminEmail = 'admin@trendstec.com';
  const adminPassword = 'Admin123456';
  
  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existing) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', adminEmail);
      console.log('🔐 You can reset the password if needed\n');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin User',
        role: 'SUPER_ADMIN',
        isActive: true,
        emailVerified: true
      }
    });
    
    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔐 Password:', adminPassword);
    console.log('👤 Role:', admin.role);
    console.log('\n🌐 Login at: https://my-svelte-2r0f4dtym-myles-projects-dd515697.vercel.app/login\n');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createProdAdmin();
