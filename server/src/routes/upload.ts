import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', '..', 'image'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения (jpeg, jpg, png, gif, webp)'));
    }
  },
});

router.post('/', authMiddleware, upload.single('image'), (req: AuthRequest, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'Файл не загружен' });
    return;
  }

  const url = `/api/image/${req.file.filename}`;
  res.json({ url, filename: req.file.filename });
});

export default router;
