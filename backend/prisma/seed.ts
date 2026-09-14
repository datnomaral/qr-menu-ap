import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Default Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Quản trị viên',
      passwordHash,
      role: 'admin',
    },
  });
  console.log(`✅ Default admin created: ${adminUser.username} / admin123`);

  // Seed Default Store Config for VietQR
  const storeConfig = await prisma.storeConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'QR MENU ORDER SYSTEM',
      bankId: 'MB',
      bankAccountNo: '0123456789',
      bankAccountName: 'NGUYEN VAN A',
    },
  });
  console.log(`✅ Default store config created: ${storeConfig.storeName} (${storeConfig.bankId})`);

  // Xóa dữ liệu cũ theo thứ tự để tránh vi phạm foreign key
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();

  // Tạo 2 bàn
  const table1 = await prisma.table.create({
    data: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Bàn 1',
      isActive: true,
    },
  });

  const table2 = await prisma.table.create({
    data: {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Bàn 2',
      isActive: true,
    },
  });

  console.log(`✅ Created tables: ${table1.name}, ${table2.name}`);

  // Tạo 2 category
  const categoryMonAn = await prisma.category.create({
    data: {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Món Ăn',
      displayOrder: 1,
      isActive: true,
    },
  });

  const categoryDoUong = await prisma.category.create({
    data: {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Đồ Uống',
      displayOrder: 2,
      isActive: true,
    },
  });

  console.log(`✅ Created categories: ${categoryMonAn.name}, ${categoryDoUong.name}`);

  // Tạo 5 món ăn
  const monAn1 = await prisma.menuItem.create({
    data: {
      name: 'Cơm Tấm Sườn',
      price: 45000,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      displayOrder: 1,
      categoryId: categoryMonAn.id,
    },
  });

  const monAn2 = await prisma.menuItem.create({
    data: {
      name: 'Phở Bò',
      price: 55000,
      imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      displayOrder: 2,
      categoryId: categoryMonAn.id,
    },
  });

  const monAn3 = await prisma.menuItem.create({
    data: {
      name: 'Bún Bò Huế',
      price: 50000,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      displayOrder: 3,
      categoryId: categoryMonAn.id,
    },
  });

  const doUong1 = await prisma.menuItem.create({
    data: {
      name: 'Trà Đá',
      price: 5000,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      displayOrder: 1,
      categoryId: categoryDoUong.id,
    },
  });

  const doUong2 = await prisma.menuItem.create({
    data: {
      name: 'Nước Ngọt Coca',
      price: 15000,
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
      isAvailable: true,
      displayOrder: 2,
      categoryId: categoryDoUong.id,
    },
  });

  console.log(`✅ Created menu items:`);
  console.log(`   - ${monAn1.name} (${monAn1.price.toString()}đ)`);
  console.log(`   - ${monAn2.name} (${monAn2.price.toString()}đ)`);
  console.log(`   - ${monAn3.name} (${monAn3.price.toString()}đ)`);
  console.log(`   - ${doUong1.name} (${doUong1.price.toString()}đ)`);
  console.log(`   - ${doUong2.name} (${doUong2.price.toString()}đ)`);

  console.log('\n✨ Seeding completed!');
}

main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
