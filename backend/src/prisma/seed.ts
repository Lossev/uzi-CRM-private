import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const assistantPassword = await bcrypt.hash('assistant123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@uzi.com' },
    update: {},
    create: {
      email: 'admin@uzi.com',
      password: hashedPassword,
      name: 'Администратор',
      role: UserRole.ADMIN,
    },
  });

  const assistant1 = await prisma.user.upsert({
    where: { email: 'assistant1@uzi.com' },
    update: {},
    create: {
      email: 'assistant1@uzi.com',
      password: assistantPassword,
      name: 'Ассистент 1',
      role: UserRole.ASSISTANT,
    },
  });

  const assistant2 = await prisma.user.upsert({
    where: { email: 'assistant2@uzi.com' },
    update: {},
    create: {
      email: 'assistant2@uzi.com',
      password: assistantPassword,
      name: 'Ассистент 2',
      role: UserRole.ASSISTANT,
    },
  });

  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'УЗИ органов брюшной полости',
        description: 'Комплексное исследование органов брюшной полости',
        duration: 30,
        price: 2500,
      },
    }),
    prisma.service.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'УЗИ щитовидной железы',
        description: 'Исследование щитовидной железы',
        duration: 20,
        price: 1500,
      },
    }),
    prisma.service.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'УЗИ сердца (Эхокардиография)',
        description: 'Исследование сердца',
        duration: 40,
        price: 3000,
      },
    }),
    prisma.service.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'УЗИ почек',
        description: 'Исследование почек и надпочечников',
        duration: 20,
        price: 1500,
      },
    }),
    prisma.service.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: 'УЗИ малого таза',
        description: 'Исследование органов малого таза',
        duration: 30,
        price: 2000,
      },
    }),
  ]);

  await prisma.scheduleSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      workStartTime: '09:00',
      workEndTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      slotDuration: 30,
      workDays: '1,2,3,4,5',
    },
  });

  console.log({ admin, assistant1, assistant2, services });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
