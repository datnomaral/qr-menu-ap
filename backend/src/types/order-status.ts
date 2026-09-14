/**
 * OrderStatus mirrors the Prisma enum.
 * Defined locally so the code compiles without `prisma generate`.
 */
export type OrderStatus = 'pending' | 'confirmed' | 'served' | 'completed';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'served', 'completed'];
