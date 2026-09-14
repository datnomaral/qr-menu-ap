import { Router, Request, Response } from 'express';
import { OrderStatus, ORDER_STATUSES } from '../types/order-status';
import * as orderService from '../services/order.service';

const router = Router();

// POST /api/v1/orders — Create a new order
router.post('/', async (req: Request, res: Response) => {
  const { tableId, items, notes } = req.body;

  // Basic body validation
  if (!tableId || typeof tableId !== 'string') {
    return res.status(400).json({ error: 'MISSING_TABLE_ID' });
  }

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'EMPTY_CART' });
  }

  try {
    const order = await orderService.create({ tableId, items, notes });
    return res.status(201).json(order);
  } catch (err) {
    if (err instanceof orderService.EmptyCartError) {
      return res.status(400).json({ error: 'EMPTY_CART' });
    }
    if (err instanceof orderService.TableNotFoundError) {
      return res.status(404).json({ error: 'TABLE_NOT_FOUND' });
    }
    if (err instanceof orderService.TableInactiveError) {
      return res.status(403).json({ error: 'TABLE_INACTIVE' });
    }
    if (err instanceof orderService.ItemUnavailableError) {
      return res.status(409).json({ error: 'ITEM_UNAVAILABLE', itemId: err.itemId });
    }
    console.error('POST /orders error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// GET /api/v1/orders?status= — List orders with optional status filter
router.get('/', async (req: Request, res: Response) => {
  const { status } = req.query;

  const validStatuses: OrderStatus[] = ORDER_STATUSES;

  if (status !== undefined && !validStatuses.includes(status as OrderStatus)) {
    return res.status(400).json({ error: 'INVALID_STATUS' });
  }

  try {
    const orders = await orderService.getAll(
      status ? { status: status as OrderStatus } : {}
    );
    return res.json(orders);
  } catch (err) {
    console.error('GET /orders error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/v1/orders/:id/status — Update order status
router.put('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'MISSING_STATUS' });
  }

  try {
    const order = await orderService.updateStatus(id, status);
    return res.json(order);
  } catch (err) {
    if (err instanceof orderService.InvalidStatusError) {
      return res.status(400).json({ error: 'INVALID_STATUS' });
    }
    if (err instanceof orderService.OrderNotFoundError) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    }
    console.error('PUT /orders/:id/status error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
