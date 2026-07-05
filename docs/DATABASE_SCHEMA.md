# Database Schema (Prisma)

The application uses PostgreSQL as the primary database, managed via Prisma ORM.

## Prisma Schema Definition (`@workspace/db/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  BUYER
  SELLER_ADMIN
  SELLER_STAFF
  SYSTEM_ADMIN
}

enum OrderStatus {
  PENDING
  PAID
  READY_FOR_PICKUP
  DELIVERED
  CANCELLED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  phone     String?  @unique
  password  String
  role      Role     @default(BUYER)
  name      String
  
  // Relations
  stores    StoreUser[]
  orders    Order[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Store {
  id          String   @id @default(uuid())
  name        String
  address     String
  gstNumber   String?
  upiId       String?
  latitude    Float?
  longitude   Float?
  
  // Relations
  users       StoreUser[]
  products    Product[]
  orders      Order[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Junction table for User <-> Store Many-to-Many
model StoreUser {
  userId    String
  storeId   String
  user      User     @relation(fields: [userId], references: [id])
  store     Store    @relation(fields: [storeId], references: [id])

  @@id([userId, storeId])
}

model Product {
  id            String   @id @default(uuid())
  storeId       String
  name          String
  brand         String?
  category      String?
  sku           String   @unique
  qrUuid        String   @unique // Unique identifier encoded in physical QR
  mrp           Float
  sellingPrice  Float
  stockCount    Int      @default(0)
  imageUrl      String?

  store         Store    @relation(fields: [storeId], references: [id])
  orderItems    OrderItem[]
  inventoryLogs InventoryLog[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Order {
  id            String      @id @default(uuid())
  buyerId       String
  storeId       String
  status        OrderStatus @default(PENDING)
  totalAmount   Float
  pickupToken   String?     @unique // Token generated for buyer's QR
  
  buyer         User        @relation(fields: [buyerId], references: [id])
  store         Store       @relation(fields: [storeId], references: [id])
  items         OrderItem[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  productId String
  quantity  Int
  priceAt   Float   // Price at the time of purchase

  order     Order   @relation(fields: [orderId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
}

model InventoryLog {
  id        String   @id @default(uuid())
  productId String
  change    Int      // +ve for stock in, -ve for stock out
  reason    String   // "BULK_IMPORT", "ORDER_DELIVERED", "MANUAL_ADJUST"
  
  product   Product  @relation(fields: [productId], references: [id])

  createdAt DateTime @default(now())
}
```

## Indexing Strategy
- **Primary Keys**: UUIDs used to prevent predictable sequential IDs.
- **Unique Indexes**: `email`, `phone`, `sku`, `qrUuid`, `pickupToken`.
- **Foreign Keys**: Indexed implicitly by Prisma to speed up relation queries.
