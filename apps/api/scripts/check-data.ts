import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== Tenants ===');
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true }
  });
  console.log(JSON.stringify(tenants, null, 2));

  console.log('\n=== Jobs ===');
  const jobs = await prisma.job.findMany({
    select: { id: true, title: true, tenantId: true, status: true }
  });
  console.log(JSON.stringify(jobs, null, 2));

  console.log('\n=== Candidates ===');
  const candidates = await prisma.candidate.findMany({
    select: { id: true, firstName: true, lastName: true, tenantId: true }
  });
  console.log(JSON.stringify(candidates, null, 2));

  console.log('\n=== Users ===');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, tenantId: true, role: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

