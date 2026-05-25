import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { name, phone, email, serviceType, location, deadline, description } = req.body;

  if (!name || !phone || !serviceType || !description) {
    res.status(400).json({ error: 'Заполните обязательные поля' });
    return;
  }

  const request = await prisma.request.create({
    data: { name, phone, email, serviceType, location, deadline, description },
  });

  res.status(201).json(request);
});

router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query;
  const where: any = {};
  if (status && status !== 'all') {
    where.status = status as string;
  }

  const requests = await prisma.request.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json(requests);
});

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;

  const request = await prisma.request.update({
    where: { id: parseInt(req.params.id as string) },
    data: { status },
  });

  res.json(request);
});

router.post('/:id/convert', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const request = await prisma.request.findUnique({
    where: { id: parseInt(req.params.id as string) },
  });

  if (!request) {
    res.status(404).json({ error: 'Заявка не найдена' });
    return;
  }

  let client = await prisma.client.findFirst({
    where: { phone: request.phone },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        name: request.name,
        phone: request.phone,
        email: request.email,
      },
    });
  }

  const lastOrder = await prisma.order.findFirst({ orderBy: { id: 'desc' } });
  const nextNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('ORD-', '')) + 1 : 1;
  const orderNumber = `ORD-${String(nextNum).padStart(3, '0')}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      type: request.serviceType,
      clientId: client.id,
      description: request.description,
      location: request.location,
      deadline: request.deadline,
    },
    include: { client: true },
  });

  await prisma.request.update({
    where: { id: request.id },
    data: { status: 'converted' },
  });

  res.status(201).json(order);
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.request.delete({ where: { id: parseInt(req.params.id as string) } });
  res.json({ success: true });
});

export default router;
