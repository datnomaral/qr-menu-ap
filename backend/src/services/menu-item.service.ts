import prisma from '../lib/prisma';

export interface MenuItemFilters {
  categoryId?: string;
}

export interface CreateMenuItemData {
  name: string;
  price: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  displayOrder?: number;
  categoryId: string;
}

export interface UpdateMenuItemData {
  name?: string;
  price?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  displayOrder?: number;
  categoryId?: string;
}

export interface ReorderItem {
  id: string;
  displayOrder: number;
}

export async function getAll(filters: MenuItemFilters = {}) {
  return prisma.menuItem.findMany({
    where: {
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    orderBy: { displayOrder: 'asc' },
    include: { category: true },
  });
}

export async function getById(id: string) {
  return prisma.menuItem.findUnique({
    where: { id },
    include: { category: true },
  });
}

export async function create(data: CreateMenuItemData) {
  return prisma.menuItem.create({
    data: {
      name: data.name,
      price: data.price,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable ?? true,
      displayOrder: data.displayOrder ?? 0,
      categoryId: data.categoryId,
    },
    include: { category: true },
  });
}

export async function update(id: string, data: UpdateMenuItemData) {
  return prisma.menuItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.isAvailable !== undefined ? { isAvailable: data.isAvailable } : {}),
      ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
    },
    include: { category: true },
  });
}

export async function deleteById(id: string) {
  return prisma.menuItem.delete({
    where: { id },
  });
}

export async function reorder(items: ReorderItem[]) {
  const updates = items.map(({ id, displayOrder }) =>
    prisma.menuItem.update({
      where: { id },
      data: { displayOrder },
    })
  );
  return prisma.$transaction(updates);
}
