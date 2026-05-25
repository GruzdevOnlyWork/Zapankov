import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query;
  const where: any = {};

  if (category && category !== 'all') {
    where.category = category as string;
  }

  const items = await prisma.portfolioItem.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { year: 'desc' }],
  });

  res.json(items);
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, category, description, location, year, featured, imageUrl, sortOrder } = req.body;

  const item = await prisma.portfolioItem.create({
    data: {
      title,
      category,
      description,
      location,
      year: parseInt(year),
      featured: featured || false,
      imageUrl,
      sortOrder: sortOrder || 0,
    },
  });

  res.status(201).json(item);
});

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, category, description, location, year, featured, imageUrl, sortOrder } = req.body;

  const item = await prisma.portfolioItem.update({
    where: { id: parseInt(req.params.id as string) },
    data: {
      ...(title !== undefined && { title }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(location !== undefined && { location }),
      ...(year !== undefined && { year: parseInt(year) }),
      ...(featured !== undefined && { featured }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  res.json(item);
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.portfolioItem.delete({ where: { id: parseInt(req.params.id as string) } });
  res.json({ success: true });
});

export default router;
