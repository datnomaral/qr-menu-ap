import { Router, Request, Response } from 'express';
import { z } from 'zod';
import QRCode from 'qrcode';
import * as tableService from '../services/table.service';

const router = Router();

// Zod schemas for request body validation
const createTableSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean().optional(),
});

const updateTableSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  isActive: z.boolean().optional(),
});

// GET /api/v1/tables — list all tables
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tables = await tableService.getAll();
    res.json(tables);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// GET /api/v1/tables/:id — get table by id (used for QR validation)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await tableService.getById(id);

    if (!table) {
      res.status(404).json({ error: 'TABLE_NOT_FOUND' });
      return;
    }

    if (!table.isActive) {
      res.status(403).json({ error: 'TABLE_INACTIVE' });
      return;
    }

    res.json(table);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// POST /api/v1/tables — create a new table
router.post('/', async (req: Request, res: Response) => {
  const parsed = createTableSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const table = await tableService.create(parsed.data);
    res.status(201).json(table);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/v1/tables/:id — update a table
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = updateTableSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const { id } = req.params;

    // Check if table exists
    const existing = await tableService.getById(id);
    if (!existing) {
      res.status(404).json({ error: 'TABLE_NOT_FOUND' });
      return;
    }

    const table = await tableService.update(id, parsed.data);
    res.json(table);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// GET /api/v1/tables/:id/qr — generate and download QR PNG
router.get('/:id/qr', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const table = await tableService.getById(id);

    if (!table) {
      res.status(404).json({ error: 'TABLE_NOT_FOUND' });
      return;
    }

    // QR URL always uses tableId (UUID) — stable even if table name changes
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const qrUrl = `${frontendUrl}/?tableId=${id}`;

    const pngBuffer = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      width: 400,
      margin: 2,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="table-${id}.png"`);
    res.send(pngBuffer);
  } catch (err) {
    console.error('GET /tables/:id/qr error:', err);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
