import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../prisma';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query;
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const clients = await prisma.client.findMany({
    where,
    include: { orders: { orderBy: { createdAt: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(clients);
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await prisma.client.findUnique({
    where: { id: parseInt(req.params.id as string) },
    include: { orders: { orderBy: { createdAt: 'desc' } } },
  });

  if (!client) {
    res.status(404).json({ error: 'Клиент не найден' });
    return;
  }

  res.json(client);
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, email } = req.body;

  const client = await prisma.client.create({
    data: { name, phone, email },
  });

  res.status(201).json(client);
});

router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, email } = req.body;

  const client = await prisma.client.update({
    where: { id: parseInt(req.params.id as string) },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
    },
  });

  res.json(client);
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.client.delete({ where: { id: parseInt(req.params.id as string) } });
  res.json({ success: true });
});

export default router;
