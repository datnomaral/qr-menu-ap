import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as categoryService from '../services/category.service';

const router = Router();

// Zod schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid('Each id must be a valid UUID'),
      displayOrder: z.number().int().min(0),
    })
  ).min(1, 'items array must not be empty'),
});

// GET /api/v1/categories — list active categories ordered by displayOrder
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.getActive();
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// POST /api/v1/categories — create a new category
router.post('/', async (req: Request, res: Response) => {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const category = await categoryService.create(parsed.data);
    res.status(201).json(category);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/v1/categories/reorder — update display order for multiple categories
// NOTE: This route must come before /:id to avoid "reorder" being treated as an id
router.put('/reorder', async (req: Request, res: Response) => {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const result = await categoryService.reorder(parsed.data.items);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/v1/categories/:id — update a category
router.put('/:id', async (req: Request, res: Response) => {
  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parsed.error.errors });
    return;
  }

  try {
    const { id } = req.params;

    const existing = await categoryService.getById(id);
    if (!existing) {
      res.status(404).json({ error: 'CATEGORY_NOT_FOUND' });
      return;
    }

    const category = await categoryService.update(id, parsed.data);
    res.json(category);
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// DELETE /api/v1/categories/:id — delete a category (guard: must have no menu items)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await categoryService.getById(id);
    if (!existing) {
      res.status(404).json({ error: 'CATEGORY_NOT_FOUND' });
      return;
    }

    const result = await categoryService.deleteById(id);

    if (result.hasItems) {
      res.status(409).json({ error: 'CATEGORY_HAS_ITEMS' });
      return;
    }

    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
