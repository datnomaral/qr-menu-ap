import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/v1/store-config (Public endpoint for VietQR generator)
router.get('/', async (_req: Request, res: Response) => {
  try {
    let config = await prisma.storeConfig.findUnique({ where: { id: 'default' } });
    if (!config) {
      config = await prisma.storeConfig.create({
        data: {
          id: 'default',
          storeName: 'QR MENU ORDER SYSTEM',
          bankId: 'MB',
          bankAccountNo: '0123456789',
          bankAccountName: 'NGUYEN VAN A',
        },
      });
    }
    return res.json(config);
  } catch (err) {
    console.error('GET /store-config error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// PUT /api/v1/store-config (Update store & bank settings)
router.put('/', async (req: Request, res: Response) => {
  const { storeName, bankId, bankAccountNo, bankAccountName, qrImageUrl } = req.body;

  try {
    const updated = await prisma.storeConfig.upsert({
      where: { id: 'default' },
      update: {
        ...(storeName ? { storeName } : {}),
        ...(bankId ? { bankId } : {}),
        ...(bankAccountNo !== undefined ? { bankAccountNo } : {}),
        ...(bankAccountName !== undefined ? { bankAccountName } : {}),
        ...(qrImageUrl !== undefined ? { qrImageUrl } : {}),
      },
      create: {
        id: 'default',
        storeName: storeName || 'QR MENU ORDER SYSTEM',
        bankId: bankId || 'MB',
        bankAccountNo: bankAccountNo || '0123456789',
        bankAccountName: bankAccountName || 'NGUYEN VAN A',
        qrImageUrl: qrImageUrl || null,
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error('PUT /store-config error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
