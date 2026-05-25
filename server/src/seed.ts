import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'zapankovegor@mail.ru' },
    update: {},
    create: {
      email: 'zapankovegor@mail.ru',
      password: hashedPassword,
      name: 'Администратор',
    },
  });

  const clients = await Promise.all([
    prisma.client.create({ data: { name: 'Алексей Морозов', phone: '+7 926 555-12-34', email: 'a.morozov@mail.ru' } }),
    prisma.client.create({ data: { name: 'Ирина Козлова', phone: '+7 903 777-88-99', email: 'kozlova.i@gmail.com' } }),
    prisma.client.create({ data: { name: 'Дмитрий Сидоров', phone: '+7 916 333-44-55', email: 'sidorov.d@yandex.ru' } }),
    prisma.client.create({ data: { name: 'Павел Иванов', phone: '+7 925 111-22-33' } }),
    prisma.client.create({ data: { name: 'Сергей Петров', phone: '+7 926 999-00-11', email: 's.petrov@mail.ru' } }),
    prisma.client.create({ data: { name: 'Анна Белова', phone: '+7 903 222-33-44', email: 'belova.a@gmail.com' } }),
    prisma.client.create({ data: { name: 'Виктор Николаев', phone: '+7 916 444-55-66' } }),
  ]);

  await Promise.all([
    prisma.order.create({
      data: {
        orderNumber: 'ORD-047',
        type: 'gates',
        status: 'new',
        clientId: clients[0].id,
        description: 'Нужны откатные ворота с автоматикой на проём 4.5 метра. Забор из профнастила, нужно сделать в том же стиле. Желательно с калиткой рядом.',
        location: 'КП «Сосны», Истринский р-н',
        deadline: 'normal',
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-046',
        type: 'canopy',
        status: 'new',
        clientId: clients[1].id,
        description: 'Навес на 2 машины, размер примерно 6x6 м. Поликарбонат, цвет бронза.',
        location: 'Красногорский район',
        deadline: 'flexible',
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-045',
        type: 'stairs',
        status: 'production',
        clientId: clients[2].id,
        description: 'Винтовая лестница в частный дом. Высота между этажами 3.2 м.',
        location: 'Красногорск',
        deadline: 'normal',
        amount: 145000,
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-044',
        type: 'fence',
        status: 'measuring',
        clientId: clients[3].id,
        description: 'Забор из профнастила, периметр участка ~80 м.',
        location: 'Истринский район',
        deadline: 'normal',
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-043',
        type: 'frame',
        status: 'installation',
        clientId: clients[4].id,
        description: 'Металлокаркас гаража 4x8 м, профильная труба 80x80.',
        location: 'Дмитровский район',
        deadline: 'urgent',
        amount: 210000,
        amountPaid: 105000,
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-042',
        type: 'gates',
        status: 'done',
        clientId: clients[5].id,
        description: 'Распашные ворота, филёнчатые створки 3×2 м.',
        location: 'Химки',
        amount: 78000,
        amountPaid: 78000,
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-041',
        type: 'canopy',
        status: 'done',
        clientId: clients[6].id,
        description: 'Козырёк над входом, кованые кронштейны, закалённое стекло.',
        location: 'Балашиха',
        amount: 42000,
        amountPaid: 42000,
      },
    }),
  ]);

  await Promise.all([
    prisma.request.create({
      data: {
        name: 'Елена Смирнова',
        phone: '+7 905 666-77-88',
        email: 'smirnova@mail.ru',
        serviceType: 'stairs',
        location: 'Подольск',
        deadline: 'normal',
        description: 'Нужна маршевая лестница на второй этаж, высота 3 м.',
        status: 'new',
      },
    }),
    prisma.request.create({
      data: {
        name: 'Андрей Кузнецов',
        phone: '+7 916 888-99-00',
        serviceType: 'fence',
        location: 'Чеховский район',
        deadline: 'flexible',
        description: 'Забор из профнастила 50 метров, с воротами и калиткой.',
        status: 'new',
      },
    }),
  ]);

  await Promise.all([
    prisma.portfolioItem.create({
      data: {
        title: 'Откатные ворота с автоматикой',
        category: 'gates',
        description: 'Проём 4.5 м, профнастил с вертикальным ребром, привод Doorhan. Калитка в единой стилистике.',
        location: 'Коттеджный посёлок «Сосны»',
        year: 2024,
        featured: true,
        sortOrder: 1,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Винтовая лестница',
        category: 'stairs',
        description: 'Центральный столб, ступени из листа 4 мм, перила с деревянным поручнем.',
        location: 'Красногорск',
        year: 2024,
        sortOrder: 2,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Навес на 2 машины',
        category: 'canopy',
        description: 'Арочная конструкция 6×6 м, сотовый поликарбонат, снеговая нагрузка до 180 кг/м².',
        location: 'Истринский район',
        year: 2023,
        sortOrder: 3,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Забор с элементами ковки',
        category: 'fence',
        description: '60 м периметра, кованые секции между кирпичными столбами.',
        location: 'Одинцово',
        year: 2023,
        sortOrder: 4,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Распашные ворота',
        category: 'gates',
        description: 'Филёнчатые створки 3×2 м, петли с подшипниками, антивандальные замки.',
        location: 'Химки',
        year: 2023,
        sortOrder: 5,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Металлокаркас гаража',
        category: 'frame',
        description: 'Размер 4×8 м, профильная труба 80×80, подготовка под обшивку сэндвич-панелями.',
        location: 'Дмитровский район',
        year: 2023,
        featured: true,
        sortOrder: 6,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Маршевая лестница',
        category: 'stairs',
        description: 'Два марша с площадкой, косоуры из швеллера 140, ограждение со стеклом.',
        location: 'Мытищи',
        year: 2023,
        sortOrder: 7,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Козырёк над входом',
        category: 'canopy',
        description: 'Кованые кронштейны, закалённое стекло 10 мм, водоотвод в водосточную систему.',
        location: 'Балашиха',
        year: 2022,
        sortOrder: 8,
      },
    }),
    prisma.portfolioItem.create({
      data: {
        title: 'Мангальная зона',
        category: 'other',
        description: 'Мангал с крышей, разделочный стол, дровница — единый комплекс под патио.',
        location: 'Индивидуальный заказ',
        year: 2022,
        sortOrder: 9,
      },
    }),
  ]);

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
