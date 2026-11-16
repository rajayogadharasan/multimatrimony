import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import bcrypt from 'bcrypt';
import type { Contract } from '../src/prisma/contract.js';
import contractJson from '../src/prisma/contract.json';

const db = postgres({
  contract: contractFromJson<Contract>(contractJson),
  url: process.env['DATABASE_URL']!,
});

async function main() {
  const adminEmail = 'admin@matrimony.com';
  const adminPassword = 'admin'; // You can change this later

  // Check if admin already exists
  const existingAdmin = await db.orm.public.User.where({ email: adminEmail }).first();

  if (!existingAdmin) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    const adminUser = await db.orm.public.User.create({
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      status: 'APPROVED',
      isActive: true,
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
    await db.close();
  });
