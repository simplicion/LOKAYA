# API Contracts & Architecture

## Base URL
All API requests are prefixed with: `/api/v1`

## 1. Authentication (Shared)
*   **POST** `/auth/register`: Register as Buyer or Seller.
*   **POST** `/auth/login`: Authenticate and receive JWT token.
*   **GET** `/auth/me`: Get current user profile and role.

## 2. Store Management (Seller Admin)
*   **POST** `/stores`: Onboard a new store.
*   **GET** `/stores/:storeId`: Get store details.
*   **PUT** `/stores/:storeId`: Update store configuration (UPI, Address).

## 3. Inventory & Products (Seller Admin / Buyer)
*   **GET** `/stores/:storeId/products`: List all products for a store (Buyer Discovery / Seller Inventory).
*   **POST** `/stores/:storeId/products`: Add a single product manually (generates QR_UUID).
*   **POST** `/stores/:storeId/products/bulk`: Bulk import CSV (Triggers BullMQ Background Job).
*   **GET** `/products/qr/:qrUuid`: Resolve physical QR scan to a product.
*   **PATCH** `/products/:productId`: Update stock count or price.

## 4. Orders & Checkout (Buyer)
*   **POST** `/orders`: Create a new order (Checkout). Returns `pickupToken` (QR string).
*   **GET** `/orders`: List buyer's past orders.
*   **GET** `/orders/:orderId`: Get order details.

## 5. Fulfillment & Pickup (Seller Admin)
*   **POST** `/orders/verify-pickup`: Scan buyer's `pickupToken`. Validates token and transitions order status to `DELIVERED`. Deducts inventory via transaction.

## 6. Background Jobs (Worker Queues)
The internal `worker` module processes the following BullMQ queues:
*   `inventory-import-queue`: Processes heavy CSV uploads for thousands of SKUs.
*   `notification-queue`: Sends Order Confirmation / Pickup Ready emails or SMS.

## 7. Real-time Events (Socket.io - Future Scope)
*   `inventory.updated`: Broadcasts stock changes.
*   `order.status.changed`: Notifies buyer when their order is confirmed or picked up.
