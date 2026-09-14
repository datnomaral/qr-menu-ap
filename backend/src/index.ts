import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import tablesRouter from './routes/tables.router';
import categoriesRouter from './routes/categories.router';
import menuItemsRouter from './routes/menu-items.router';
import ordersRouter from './routes/orders.router';
import sseRouter from './routes/sse.router';
import uploadRouter from './routes/upload.router';
import authRouter from './routes/auth.router';
import storeConfigRouter from './routes/store-config.router';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any localhost or 192.168.x.x or FRONTEND_URL
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/store-config', storeConfigRouter);
app.use('/api/v1/tables', tablesRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/menu-items', menuItemsRouter);
app.use('/api/v1/orders/stream', sseRouter);   // must be before /api/v1/orders to avoid conflict
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/upload', uploadRouter);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

export default app;
