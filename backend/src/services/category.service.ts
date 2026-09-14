import prisma from '../lib/prisma';

export interface CreateCategoryData {
  name: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryData {
  name?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface ReorderItem {
  id: string;
  displayOrder: number;
}

/**
 * Returns only active categories, ordered by displayOrder ascending.
 */
export async function getActive() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });
}

export async function getById(id: string) {
  return prisma.category.findUnique({
    where: { id },
  });
}

export async function create(data: CreateCategoryData) {
  return prisma.category.create({
    data: {
      name: data.name,
      displayOrder: data.displayOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
}

export async function update(id: string, data: UpdateCategoryData) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

/**
 * Deletes a category only if it has no MenuItems.
 * Returns null if the category has items (caller should respond with 409).
 */
export async function deleteById(id: string): Promise<{ hasItems: true } | { hasItems: false; deleted: true }> {
  const count = await prisma.menuItem.count({
    where: { categoryId: id },
  });

  if (count > 0) {
    return { hasItems: true };
  }

  await prisma.category.delete({ where: { id } });
  return { hasItems: false, deleted: true };
}

/**
 * Updates displayOrder for each category in the list.
 * Accepts an array of { id, displayOrder } pairs.
 */
export async function reorder(items: ReorderItem[]) {
  const updates = items.map(({ id, displayOrder }) =>
    prisma.category.update({
      where: { id },
      data: { displayOrder },
    })
  );

  return prisma.$transaction(updates);
}
