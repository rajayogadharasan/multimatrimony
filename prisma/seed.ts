import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@matrimony.com';
  const adminPassword = 'admin'; // You can change this later

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        status: 'APPROVED',
        isActive: true,
      }
    });

    console.log(`Default admin created: ${adminUser.email}`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
