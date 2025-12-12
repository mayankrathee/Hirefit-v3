import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'demo-company' }
  });

  if (!tenant) {
    console.error('Demo tenant not found. Please login first to create the demo tenant.');
    process.exit(1);
  }

  // Find demo user
  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id }
  });

  if (!user) {
    console.error('Demo user not found.');
    process.exit(1);
  }

  console.log(`Creating jobs for tenant: ${tenant.name} (${tenant.id})`);

  // Create Product Manager job
  const pmJob = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      createdById: user.id,
      title: 'Senior Product Manager',
      description: `We are looking for an experienced Senior Product Manager to lead our product strategy and roadmap. You will work closely with engineering, design, and business teams to deliver exceptional products that delight our customers.

Responsibilities:
• Define product vision, strategy, and roadmap
• Gather and prioritize product requirements from stakeholders
• Work with engineering teams to deliver features on time
• Analyze market trends and competitive landscape
• Drive product metrics and KPIs
• Conduct user research and usability testing
• Create PRDs and user stories

Requirements:
• 5+ years of product management experience
• Strong analytical and problem-solving skills
• Excellent communication and stakeholder management
• Experience with Agile/Scrum methodologies
• Technical background preferred
• MBA or equivalent experience is a plus`,
      department: 'Product',
      location: 'San Francisco, CA',
      locationType: 'hybrid',
      employmentType: 'full_time',
      salaryCurrency: 'USD',
      salaryMin: 150000,
      salaryMax: 200000,
      status: 'open',
      publishedAt: new Date(),
      requirements: JSON.stringify(['Product Management', 'Agile', 'User Research', 'Data Analysis', 'Stakeholder Management']),
      pipelineStages: JSON.stringify(['Applied', 'Phone Screen', 'Technical Interview', 'Final Interview', 'Offer']),
    }
  });
  console.log(`✅ Created job: ${pmJob.title} (${pmJob.id})`);

  // Create Project Manager job
  const projJob = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      createdById: user.id,
      title: 'Technical Project Manager',
      description: `We are seeking a Technical Project Manager to oversee the planning, execution, and delivery of complex software projects. You will coordinate cross-functional teams and ensure projects are delivered on time and within budget.

Responsibilities:
• Lead end-to-end project planning and execution
• Manage project scope, timeline, and budget
• Coordinate with engineering, design, and QA teams
• Identify and mitigate project risks
• Facilitate daily standups and sprint planning
• Prepare status reports and communicate with stakeholders
• Manage resource allocation and capacity planning

Requirements:
• 4+ years of project management experience in software development
• PMP or Agile certification preferred
• Strong understanding of SDLC and Agile methodologies
• Excellent organizational and time management skills
• Experience with project management tools (Jira, Asana, MS Project)
• Technical background or CS degree is a plus
• Strong leadership and team coordination skills`,
      department: 'Engineering',
      location: 'New York, NY',
      locationType: 'remote',
      employmentType: 'full_time',
      salaryCurrency: 'USD',
      salaryMin: 120000,
      salaryMax: 160000,
      status: 'open',
      publishedAt: new Date(),
      requirements: JSON.stringify(['Project Management', 'Agile', 'Scrum', 'Jira', 'Risk Management']),
      pipelineStages: JSON.stringify(['Applied', 'Screening', 'Interview', 'Final Round', 'Offer']),
    }
  });
  console.log(`✅ Created job: ${projJob.title} (${projJob.id})`);

  // Create Associate Product Manager job
  const apmJob = await prisma.job.create({
    data: {
      tenantId: tenant.id,
      createdById: user.id,
      title: 'Associate Product Manager',
      description: `Join our product team as an Associate Product Manager and help shape the future of our platform. This is an excellent opportunity for early-career professionals looking to grow in product management.

Responsibilities:
• Assist in defining product features and user stories
• Conduct competitive analysis and market research
• Support the product team with data analysis
• Help prioritize the product backlog
• Work with UX to create wireframes and mockups
• Gather feedback from customers and stakeholders
• Document product requirements and specifications

Requirements:
• 1-2 years of experience in product, consulting, or tech
• Strong analytical and critical thinking skills
• Excellent written and verbal communication
• Familiarity with product management concepts
• Experience with data analysis tools (Excel, SQL, etc.)
• Bachelor's degree in Business, CS, or related field
• Passionate about building great products`,
      department: 'Product',
      location: 'Austin, TX',
      locationType: 'onsite',
      employmentType: 'full_time',
      salaryCurrency: 'USD',
      salaryMin: 90000,
      salaryMax: 120000,
      status: 'open',
      publishedAt: new Date(),
      requirements: JSON.stringify(['Product Thinking', 'Data Analysis', 'Communication', 'SQL', 'User Research']),
      pipelineStages: JSON.stringify(['Applied', 'Phone Screen', 'Case Study', 'Final Interview', 'Offer']),
    }
  });
  console.log(`✅ Created job: ${apmJob.title} (${apmJob.id})`);

  // Create sample candidates
  const candidate1 = await prisma.candidate.create({
    data: {
      tenantId: tenant.id,
      createdById: user.id,
      email: 'sarah.johnson@email.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1-555-0123',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      source: 'LinkedIn',
      tags: JSON.stringify(['product', 'senior', 'tech']),
    }
  });
  console.log(`✅ Created candidate: ${candidate1.firstName} ${candidate1.lastName}`);

  const candidate2 = await prisma.candidate.create({
    data: {
      tenantId: tenant.id,
      createdById: user.id,
      email: 'mike.chen@email.com',
      firstName: 'Mike',
      lastName: 'Chen',
      phone: '+1-555-0456',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      source: 'Referral',
      tags: JSON.stringify(['project-management', 'agile', 'technical']),
    }
  });
  console.log(`✅ Created candidate: ${candidate2.firstName} ${candidate2.lastName}`);

  const candidate3 = await prisma.candidate.create({
    data: {
      tenantId: tenant.id,
      createdById: user.id,
      email: 'emily.wilson@email.com',
      firstName: 'Emily',
      lastName: 'Wilson',
      phone: '+1-555-0789',
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      source: 'Indeed',
      tags: JSON.stringify(['product', 'early-career']),
    }
  });
  console.log(`✅ Created candidate: ${candidate3.firstName} ${candidate3.lastName}`);

  console.log('\n🎉 Seed data created successfully!');
  console.log('\nSummary:');
  console.log('- 3 Job Postings (Senior PM, Technical Project Manager, Associate PM)');
  console.log('- 3 Sample Candidates');
  console.log('\nYou can now test:');
  console.log('1. Upload resumes to candidates');
  console.log('2. Apply candidates to jobs');
  console.log('3. Manage application pipeline');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

