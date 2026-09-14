import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as menuItemService from '../services/menu-item.service';

const router = Router();

// Zod schemas
const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().nonnegative('Price must be non-negative'),
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  categoryId: z.string().uuid('categoryId must be a valid UUID'),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  price: z.number().nonnegative('Price must be non-negative').optional(),
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().optional(),
  displayOrder: z.number().int().nonnegative().optional(),
  categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid('id must be a valid UUID'),
      displayOrder: z.number().int().nonnegative(),
    })
  ).min(1, 'items must contain at least one entry'),
});

// GET /api/v1/menu-items?categoryId=
router.get('/', async (req: Request, res: Response) => {
  try {
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const items = await menuItemService.getAll({ categoryId });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/v1/menu-items/reorder — must be declared BEFORE /:id to avoid conflict
router.put('/reorder', async (req: Request, res: Response) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const updated = await menuItemService.reorder(parsed.data.items);
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// POST /api/v1/menu-items
router.post('/', async (req: Request, res: Response) => {
  const parsed = createMenuItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const item = await menuItemService.create(parsed.data);
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/v1/menu-items/:id
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = updateMenuItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const { id } = req.params;

    const existing = await menuItemService.getById(id);
    if (!existing) {
      res.status(404).json({ error: 'MENU_ITEM_NOT_FOUND' });
      return;
    }

    const item = await menuItemService.update(id, parsed.data);
    res.json(item);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/v1/menu-items/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await menuItemService.getById(id);
    if (!existing) {
      res.status(404).json({ error: 'MENU_ITEM_NOT_FOUND' });
      return;
    }

    await menuItemService.deleteById(id);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
