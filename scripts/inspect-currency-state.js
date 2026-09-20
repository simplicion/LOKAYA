const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany();
  console.log('Stores in DB:', JSON.stringify(stores, null, 2));

  const products = await prisma.product.findMany({ include: { variants: true } });
  console.log('Products:', JSON.stringify(products.map(p => ({
    id: p.id,
    name: p.name,
    sellingPrice: p.sellingPrice,
    mrp: p.mrp,
    variants: p.variants.map(v => ({ id: v.id, name: v.name, price: v.price, stock: v.stock }))
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
