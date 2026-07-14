import('../generated/prisma/index.js').then(async (mod) => {
  const prisma = new mod.PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
  console.log(user);
  await prisma.$disconnect();
}).catch((e) => {
  console.error('Failed to load prisma client', e);
});
