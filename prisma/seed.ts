import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Starting database seed...');

	// Create SUPER_ADMIN user
	const adminEmail = 'admin@trendstec.com';
	const adminPassword = 'Admin123!@#'; // Change this in production!

	const existingAdmin = await prisma.user.findUnique({
		where: { email: adminEmail }
	});

	if (existingAdmin) {
		console.log('✅ Super admin user already exists');
	} else {
		const hashedPassword = await bcrypt.hash(adminPassword, 12);

		await prisma.user.create({
			data: {
				email: adminEmail,
				name: 'Super Admin',
				password: hashedPassword,
				role: 'SUPER_ADMIN',
				isActive: true,
				emailVerified: true
			}
		});

		console.log('✅ Created super admin user:');
		console.log('   Email:', adminEmail);
		console.log('   Password:', adminPassword);
		console.log('   ⚠️  IMPORTANT: Change this password after first login!');
	}

	console.log('🌱 Database seed completed!');
}

main()
	.catch((e) => {
		console.error('❌ Seed error:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
