require('ts-node/register');
const prisma = require('./src/lib/prisma').default;

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    include: { profile: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
