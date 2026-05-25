import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, search } = req.query;
  const where: any = {};

  if (status && status !== 'all') {
    where.status = status as string;
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search as string, mode: 'insensitive' } },
      { type: { contains: search as string, mode: 'insensitive' } },
      { client: { name: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(orders);
});

router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  const [total, newCount, inProgress, done] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'new' } }),
    prisma.order.count({ where: { status: { in: ['measuring', 'approval', 'production', 'installation'] } } }),
    prisma.order.count({ where: { status: 'done' } }),
  ]);

  const revenue = await prisma.order.aggregate({
    _sum: { amount: true },
    where: { status: 'done' },
  });

  res.json({
    total,
    new: newCount,
    inProgress,
    done,
    revenue: revenue._sum.amount || 0,
  });
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(req.params.id as string) },
    include: { client: true },
  });

  if (!order) {
    res.status(404).json({ error: 'Заказ не найден' });
    return;
  }

  res.json(order);
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, clientId, description, location, deadline, amount, status } = req.body;

  const lastOrder = await prisma.order.findFirst({ orderBy: { id: 'desc' } });
  const nextNum = lastOrder ? parseInt(lastOrder.orderNumber.replace('ORD-', '')) + 1 : 1;
  const orderNumber = `ORD-${String(nextNum).padStart(3, '0')}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      type,
      clientId,
      description,
      location,
      deadline,
      amount,
      status: status || 'new',
    },
    include: { client: true },
  });

  res.status(201).json(order);
});

router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, status, description, location, deadline, amount, amountPaid } = req.body;

  const order = await prisma.order.update({
    where: { id: parseInt(req.params.id as string) },
    data: {
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(deadline !== undefined && { deadline }),
      ...(amount !== undefined && { amount }),
      ...(amountPaid !== undefined && { amountPaid }),
    },
    include: { client: true },
  });

  res.json(order);
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.order.delete({ where: { id: parseInt(req.params.id as string) } });
  res.json({ success: true });
});

export default router;
