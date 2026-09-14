import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting DB seed...');
  
  // Clean up
  await prisma.auditLog.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.riskFactor.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.device.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.customerBaseline.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Users
  const customer = await prisma.user.create({
    data: {
      email: 'customer@trustflow.local',
      passwordHash,
      role: 'CUSTOMER',
      trustState: 'NORMAL',
    }
  });

  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@trustflow.local',
      passwordHash,
      role: 'ANALYST',
      trustState: 'TRUSTED',
    }
  });

  // Account
  const account = await prisma.account.create({
    data: {
      userId: customer.id,
      accountNumber: 'ACC100020003000',
      balance: 150000.0,
      currency: 'INR'
    }
  });

  // Baseline
  await prisma.customerBaseline.create({
    data: {
      userId: customer.id,
      medianAmount: 2500,
      stdDevAmount: 500,
      typicalFrequency: 10
    }
  });

  // Beneficiary
  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId: customer.id,
      name: 'Utility Company',
      accountNumber: 'UTIL999888'
    }
  });

  // Device
  const device = await prisma.device.create({
    data: {
      userId: customer.id,
      deviceName: 'iPhone 13 - Safari',
      ipAddress: '192.168.1.45',
      isTrusted: true,
      lastSeen: new Date()
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
