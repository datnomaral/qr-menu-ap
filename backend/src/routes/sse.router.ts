import { Router, Request, Response } from 'express';

const router = Router();

// In-memory set of active SSE connections
const clients = new Set<Response>();

/**
 * Broadcasts an event to all connected SSE clients.
 * Call this from order.service.ts after a new order is created.
 */
export function broadcastNewOrder(order: unknown): void {
  const data = JSON.stringify(order);
  for (const client of clients) {
    client.write(`event: new-order\ndata: ${data}\n\n`);
  }
}

// GET /api/v1/orders/stream — SSE endpoint for Admin Dashboard
router.get('/', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if behind proxy
  res.flushHeaders();

  // Send a comment to keep connection alive immediately
  res.write(': connected\n\n');

  // Register client
  clients.add(res);

  // Send keepalive ping every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(': ping\n\n');
  }, 30_000);

  // Cleanup when client disconnects
  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
  });
});

export default router;
