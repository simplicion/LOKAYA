import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stores = await prisma.store.findMany();
  if (stores.length > 0) {
    console.log("Store ID:", stores[0].id);
    
    // Test creating category using the API
    const res = await fetch('http://localhost:4101/api/v1/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storeId: stores[0].id,
        name: 'hihii',
        description: '',
        displayOrder: 1,
        isActive: true
      })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } else {
    console.log("No stores found.");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
