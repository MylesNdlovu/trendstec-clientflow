// Simple login test without any frameworks
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLogin() {
  const testPassword = 'SimplePass123';
  const testEmail = 'test@example.com';

  console.log('\n=== CREATING TEST USER ===');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);

  // Hash password
  const hashedPassword = await bcrypt.hash(testPassword, 12);
  console.log('Hashed password:', hashedPassword.substring(0, 30) + '...');

  // Delete existing test user
  await prisma.user.deleteMany({ where: { email: testEmail } });

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      name: 'Test User',
      password: hashedPassword,
      role: 'USER',
      isActive: true,
      emailVerified: true,
      failedLoginCount: 0
    }
  });

  console.log('\n✅ User created:', user.email);

  // Test password verification
  console.log('\n=== TESTING PASSWORD VERIFICATION ===');
  const isValid = await bcrypt.compare(testPassword, user.password);
  console.log('Password match:', isValid ? '✅ YES' : '❌ NO');

  // Clean up
  await prisma.user.delete({ where: { id: user.id } });
  console.log('\n✅ Test user deleted');

  await prisma.$disconnect();
}

testLogin().catch(console.error);
