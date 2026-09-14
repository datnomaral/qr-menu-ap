import prisma from '../lib/prisma';
import { OrderStatus, ORDER_STATUSES } from '../types/order-status';
import { broadcastNewOrder } from '../routes/sse.router';

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
}

export interface CreateOrderData {
  tableId: string;
  notes?: string;
  items: OrderItemInput[];
}

export interface GetOrdersFilters {
  status?: OrderStatus;
}

// Custom error classes for domain-level errors
export class EmptyCartError extends Error {
  constructor() {
    super('EMPTY_CART');
    this.name = 'EmptyCartError';
  }
}

export class TableNotFoundError extends Error {
  constructor() {
    super('TABLE_NOT_FOUND');
    this.name = 'TableNotFoundError';
  }
}

export class TableInactiveError extends Error {
  constructor() {
    super('TABLE_INACTIVE');
    this.name = 'TableInactiveError';
  }
}

export class ItemUnavailableError extends Error {
  public itemId: string;
  constructor(itemId: string) {
    super('ITEM_UNAVAILABLE');
    this.name = 'ItemUnavailableError';
    this.itemId = itemId;
  }
}

export class InvalidStatusError extends Error {
  constructor(status: string) {
    super(`INVALID_STATUS: ${status}`);
    this.name = 'InvalidStatusError';
  }
}

export class OrderNotFoundError extends Error {
  constructor() {
    super('ORDER_NOT_FOUND');
    this.name = 'OrderNotFoundError';
  }
}

const VALID_STATUSES: OrderStatus[] = ORDER_STATUSES;

export async function create(data: CreateOrderData) {
  // Validate Cart is not empty
  if (!data.items || data.items.length === 0) {
    throw new EmptyCartError();
  }

  // Validate tableId exists
  const table = await prisma.table.findUnique({ where: { id: data.tableId } });
  if (!table) {
    throw new TableNotFoundError();
  }

  // Validate table is active
  if (!table.isActive) {
    throw new TableInactiveError();
  }

  // Validate each menuItemId is available and snapshot prices
  const orderItemsData: Array<{
    menuItemId: string;
    quantity: number;
    priceAtOrder: number;
    notes?: string;
  }> = [];

  for (const item of data.items) {
    const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
    if (!menuItem || !menuItem.isAvailable) {
      throw new ItemUnavailableError(item.menuItemId);
    }
    orderItemsData.push({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      priceAtOrder: Number(menuItem.price),
      notes: item.notes?.trim() || undefined,
    });
  }

  // Create order with snapshot prices
  const order = await prisma.order.create({
    data: {
      tableId: data.tableId,
      status: 'pending',
      notes: data.notes?.trim() || undefined,
      orderItems: {
        create: orderItemsData.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
          notes: item.notes,
        })),
      },
    },
    include: {
      table: { select: { name: true } },
      orderItems: {
        include: {
          menuItem: { select: { name: true } },
        },
      },
    },
  });

  // Broadcast to Admin Dashboard via SSE (≤5s requirement)
  broadcastNewOrder(order);

  return order;
}

export async function getAll(filters: GetOrdersFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.status !== undefined) {
    where['status'] = filters.status;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { orderedAt: 'asc' },
    include: {
      table: { select: { name: true } },
      orderItems: {
        include: {
          menuItem: { select: { name: true } },
        },
      },
    },
  });

  return orders;
}

export async function updateStatus(id: string, status: string) {
  // Validate status value
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    throw new InvalidStatusError(status);
  }

  // Check order exists
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    throw new OrderNotFoundError();
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: status as OrderStatus },
    include: {
      table: { select: { name: true } },
      orderItems: {
        include: {
          menuItem: { select: { name: true } },
        },
      },
    },
  });

  return updated;
}
