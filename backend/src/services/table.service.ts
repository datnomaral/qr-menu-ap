import prisma from '../lib/prisma';

export interface CreateTableData {
  name: string;
  isActive?: boolean;
}

export interface UpdateTableData {
  name?: string;
  isActive?: boolean;
}

export async function getAll() {
  return prisma.table.findMany({
    orderBy: { createdAt: 'asc' },
  });
}

export async function getById(id: string) {
  return prisma.table.findUnique({
    where: { id },
  });
}

export async function create(data: CreateTableData) {
  return prisma.table.create({
    data: {
      name: data.name,
      isActive: data.isActive ?? true,
    },
  });
}

export async function update(id: string, data: UpdateTableData) {
  return prisma.table.update({
    where: { id },
    data,
  });
}
