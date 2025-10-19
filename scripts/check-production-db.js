const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProductionUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('=== PRODUCTION DATABASE USERS ===\n');

    if (users.length === 0) {
      console.log('❌ No users found in production database!');
      console.log('   Need to migrate schema and create admin user.\n');
    } else {
      users.forEach((user, idx) => {
        console.log(`User ${idx + 1}:`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Name: ${user.name || 'N/A'}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Email Verified: ${user.emailVerified}`);
        console.log(`  Active: ${user.isActive}`);
        console.log('');
      });
      console.log(`Total users: ${users.length}\n`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error accessing production database:', error.message);
    console.log('\nThis likely means the schema needs to be migrated to production.');
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkProductionUsers();
