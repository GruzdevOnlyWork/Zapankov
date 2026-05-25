import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import ordersRoutes from './routes/orders';
import requestsRoutes from './routes/requests';
import clientsRoutes from './routes/clients';
import portfolioRoutes from './routes/portfolio';
import reportsRoutes from './routes/reports';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/image', express.static(path.join(__dirname, '..', '..', 'image')));

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
  const clientPath = path.join(__dirname, '..', '..', 'client', 'dist', 'client', 'browser');
  app.use(express.static(clientPath));
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

app.listen(PORT);

export default app;
