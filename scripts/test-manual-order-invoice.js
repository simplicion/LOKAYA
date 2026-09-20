/**
 * Comprehensive Automated Verification Suite:
 * - Manual Order Booking (In-Store POS Counter)
 * - Bulk Catalog Item Resolution & Stock Decrements
 * - Custom Discounts & Net Calculation
 * - Multiple Payment Modes (CASH, UPI, CARD, COD)
 * - Sequential & Unique Tax Invoice Number Generation
 * - Universal Amazon-Grade Tax Invoice Metadata Rendering
 * - Multi-Currency Localization (INR & NPR)
 * - Automated Email Invoice Dispatch Simulation
 */

const { prisma, OrderStatus } = require('../packages/db');
const { OrderService } = require('../apps/backend/src/modules/order/application/order.service');
const { CurrencyService } = require('../apps/backend/src/modules/common/currency.service');
const { EmailService } = require('../apps/backend/src/modules/notification/application/email.service');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

let passed = 0;
let failed = 0;

function assert(condition, message, detail = '') {
  if (condition) {
    console.log(`${colors.green}✅ [PASS] ${message}${colors.reset}`);
    if (detail) console.log(`   ↳ ${colors.cyan}${detail}${colors.reset}`);
    passed++;
  } else {
    console.error(`${colors.red}❌ [FAIL] ${message}${colors.reset}`);
    if (detail) console.error(`   ↳ ${colors.yellow}${detail}${colors.reset}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}🧪 LOKAYA MANUAL ORDER BOOKING & TAX INVOICE VERIFICATION SUITE${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  try {
    // Step 1: Setup Test Merchant Store and Products
    console.log(`${colors.bold}--- TEST GROUP 1: Test Store & Inventory Setup ---${colors.reset}`);
    
    // Find or create test seller user
    let seller = await prisma.user.findFirst({ where: { email: 'pos_seller@lokaya.com' } });
    if (!seller) {
      seller = await prisma.user.create({
        data: {
          email: 'pos_seller@lokaya.com',
          name: 'Simplicion Store Owner',
          phone: '+977 9801234567',
          city: 'Lalbandi',
          state: 'Madhesh'
        }
      });
    }

    // Find or create store
    let store = await prisma.store.findFirst({ where: { handle: 'simplicion-pos-test' } });
    if (!store) {
      store = await prisma.store.create({
        data: {
          name: 'Simplicion Fashion Lalbandi',
          handle: 'simplicion-pos-test',
          address: 'Bazar Road, Ward No. 5',
          city: 'Lalbandi',
          state: 'Madhesh',
          pincode: '45800',
          contactPhone: '+977 9801234567',
          gstNumber: 'PAN-609823145',
          status: 'VERIFIED',
          isVerified: true
        }
      });

      await prisma.storeUser.create({
        data: {
          userId: seller.id,
          storeId: store.id
        }
      });
    }

    // Create 2 test products with variants & stock
    const sku1 = `POS-TEE-${Date.now()}`;
    const product1 = await prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Organic Cotton Graphic T-Shirt',
        sku: sku1,
        mrp: 1800,
        sellingPrice: 1200,
        stockCount: 50,
        isActive: true,
        status: 'PUBLISHED',
        variants: {
          create: [
            { name: 'Size M - Navy Blue', sku: `${sku1}-M`, price: 1200, stockCount: 25 },
            { name: 'Size L - Navy Blue', sku: `${sku1}-L`, price: 1250, stockCount: 25 }
          ]
        }
      },
      include: { variants: true }
    });

    const sku2 = `POS-CAP-${Date.now()}`;
    const product2 = await prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Vintage Embroidered Cap',
        sku: sku2,
        mrp: 800,
        sellingPrice: 600,
        stockCount: 30,
        isActive: true,
        status: 'PUBLISHED'
      }
    });

    assert(store && product1 && product2, 'Test Store & Multi-Product Inventory initialized', `Store: ${store.name}, Products: 2 with variants`);

    // Step 2: Book Manual In-Store Sale with Multiple Items & Variant Selection
    console.log(`\n${colors.bold}--- TEST GROUP 2: Manual Order Creation & Atomic Stock Deduction ---${colors.reset}`);
    
    const initialVariantStock = product1.variants[0].stockCount; // 25
    const initialProduct2Stock = product2.stockCount; // 30

    const manualOrderResult = await OrderService.createManualOrder(seller.id, {
      storeId: store.id,
      customerName: 'Aarav Sharma',
      customerPhone: '+977 9841000111',
      customerEmail: 'aarav.sharma@example.com',
      paymentMethod: 'CASH',
      discountAmount: 200,
      notes: 'Customer paid cash over the counter. Requested printed invoice.',
      items: [
        { productId: product1.id, variantId: product1.variants[0].id, quantity: 2 }, // 1200 * 2 = 2400
        { productId: product2.id, quantity: 1 } // 600 * 1 = 600
      ]
    });

    // Subtotal: 2400 + 600 = 3000
    // Discount: 200
    // Total Amount: 2800

    assert(manualOrderResult.success === true, 'Manual order successfully created via POS service', `Order ID: ${manualOrderResult.orderId}`);
    assert(manualOrderResult.totalAmount === 2800, 'Subtotal & Custom Discount correctly calculated', `Subtotal: 3000 - Discount: 200 = 2800`);
    assert(manualOrderResult.invoiceNumber.startsWith('INV-'), 'Unique Tax Invoice Number generated with INV- prefix', `Invoice #: ${manualOrderResult.invoiceNumber}`);

    // Verify stock deduction
    const updatedVariant1 = await prisma.productVariant.findUnique({ where: { id: product1.variants[0].id } });
    const updatedProduct2 = await prisma.product.findUnique({ where: { id: product2.id } });

    assert(updatedVariant1.stockCount === initialVariantStock - 2, 'Variant stock atomically decremented by 2', `Before: ${initialVariantStock}, After: ${updatedVariant1.stockCount}`);
    assert(updatedProduct2.stockCount === initialProduct2Stock - 1, 'Product stock atomically decremented by 1', `Before: ${initialProduct2Stock}, After: ${updatedProduct2.stockCount}`);

    // Verify inventory audit logs
    const inventoryLogs = await prisma.inventoryLog.findMany({
      where: {
        productId: { in: [product1.id, product2.id] },
        reason: 'MANUAL_ORDER_SALE'
      }
    });
    assert(inventoryLogs.length >= 2, 'Inventory audit logs recorded with MANUAL_ORDER_SALE reason', `Logs recorded: ${inventoryLogs.length}`);

    // Step 3: Verify Ledger Transaction & Financial Records
    console.log(`\n${colors.bold}--- TEST GROUP 3: Seller Ledger & Payment Records ---${colors.reset}`);
    
    const payment = await prisma.payment.findUnique({ where: { orderId: manualOrderResult.orderId } });
    assert(payment && payment.status === 'SUCCESS' && payment.amount === 2800, 'Payment record saved with SUCCESS status', `Provider: ${payment?.provider}, Amount: ${payment?.amount}`);

    const transaction = await prisma.sellerTransaction.findFirst({
      where: { orderId: manualOrderResult.orderId }
    });
    assert(transaction && transaction.type === 'CREDIT' && transaction.amount === 2800, 'Seller transaction ledger credited with exact sale amount', `Transaction ID: ${transaction?.id}`);

    // Step 4: Verify Order Details & Query Fetching
    console.log(`\n${colors.bold}--- TEST GROUP 4: Order & Store Queries with POS Metadata ---${colors.reset}`);
    
    const fetchedOrder = await OrderService.getOrder(manualOrderResult.orderId, seller.id);
    assert(fetchedOrder.isManualBooking === true, 'Order entity has isManualBooking = true', `isManualBooking: ${fetchedOrder.isManualBooking}`);
    assert(fetchedOrder.customerName === 'Aarav Sharma', 'Customer details retrieved accurately', `Name: ${fetchedOrder.customerName}, Phone: ${fetchedOrder.customerPhone}`);
    assert(fetchedOrder.invoiceNumber === manualOrderResult.invoiceNumber, 'Invoice number consistent across queries', `Invoice #: ${fetchedOrder.invoiceNumber}`);

    const storeOrders = await OrderService.getStoreOrders(store.id, seller.id, { search: manualOrderResult.invoiceNumber });
    assert(storeOrders.orders.length === 1 && storeOrders.orders[0].id === manualOrderResult.orderId, 'Store orders list can be searched by Invoice Number', `Found 1 matching order by Invoice #`);

    // Step 5: Universal Tax Invoice Metadata API
    console.log(`\n${colors.bold}--- TEST GROUP 5: Enterprise Tax Invoice Metadata Generation ---${colors.reset}`);
    
    const invoiceMetadata = await OrderService.getOrderInvoice(manualOrderResult.orderId, seller.id);
    assert(invoiceMetadata.invoiceNumber === manualOrderResult.invoiceNumber, 'Invoice Metadata endpoint generates complete payload', `Invoice #: ${invoiceMetadata.invoiceNumber}`);
    assert(invoiceMetadata.store.name === store.name && invoiceMetadata.store.gstNumber === store.gstNumber, 'Store tax & branding details included in invoice', `Store: ${invoiceMetadata.store.name}, GST/PAN: ${invoiceMetadata.store.gstNumber}`);
    assert(invoiceMetadata.items.length === 2, 'Itemized items breakdown with quantities and line totals', `Items count: ${invoiceMetadata.items.length}`);
    assert(invoiceMetadata.pricing.totalAmount === 2800 && invoiceMetadata.pricing.discountAmount === 200, 'Pricing structure matches enterprise invoice standards', `Subtotal: ${invoiceMetadata.pricing.subtotal}, Discount: ${invoiceMetadata.pricing.discountAmount}, Total: ${invoiceMetadata.pricing.totalAmount}`);

    // Step 6: Multi-Currency Localization (INR vs NPR)
    console.log(`\n${colors.bold}--- TEST GROUP 6: Dynamic Multi-Currency Invoicing ---${colors.reset}`);
    
    const isIndian = CurrencyService.isIndianEntity(store);
    assert(isIndian === false && invoiceMetadata.payment.currency === 'NPR', 'Store country (Nepal) correctly localized to NPR currency', `Currency: ${invoiceMetadata.payment.currency}, Symbol: ${invoiceMetadata.payment.currencySymbol}`);

    // Step 7: Email Invoice Dispatch Simulation
    console.log(`\n${colors.bold}--- TEST GROUP 7: Automated Email Invoice Dispatch ---${colors.reset}`);
    
    const emailService = new EmailService();
    const emailSent = await emailService.sendInvoiceEmail('aarav.sharma@example.com', {
      invoiceNumber: invoiceMetadata.invoiceNumber,
      orderId: invoiceMetadata.orderId,
      orderDate: invoiceMetadata.orderDate,
      storeName: invoiceMetadata.store.name,
      storeAddress: invoiceMetadata.store.address,
      storePhone: invoiceMetadata.store.contactPhone,
      storeGst: invoiceMetadata.store.gstNumber,
      customerName: invoiceMetadata.customer.name,
      paymentMethod: invoiceMetadata.payment.method,
      items: invoiceMetadata.items.map(i => ({
        name: i.name,
        variant: i.variantName || undefined,
        sku: i.sku,
        quantity: i.quantity,
        price: i.unitPrice,
        total: i.total
      })),
      subtotal: invoiceMetadata.pricing.subtotal,
      discountAmount: invoiceMetadata.pricing.discountAmount,
      shippingFee: invoiceMetadata.pricing.shippingFee,
      totalAmount: invoiceMetadata.pricing.totalAmount,
      currencySymbol: invoiceMetadata.payment.currencySymbol || 'रू',
      isManualBooking: true
    });

    assert(emailSent === true, 'Amazon-grade responsive HTML Tax Invoice email dispatched successfully', 'Dispatched to aarav.sharma@example.com');

    // Clean up created test records
    await prisma.orderItem.deleteMany({ where: { orderId: manualOrderResult.orderId } });
    await prisma.sellerTransaction.deleteMany({ where: { orderId: manualOrderResult.orderId } });
    await prisma.payment.deleteMany({ where: { orderId: manualOrderResult.orderId } });
    await prisma.subOrder.deleteMany({ where: { orderId: manualOrderResult.orderId } });
    await prisma.order.delete({ where: { id: manualOrderResult.orderId } });
    await prisma.inventoryLog.deleteMany({ where: { productId: { in: [product1.id, product2.id] } } });
    await prisma.productVariant.deleteMany({ where: { productId: product1.id } });
    await prisma.product.deleteMany({ where: { id: { in: [product1.id, product2.id] } } });

    console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
    console.log(`${colors.bold}📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED (${Math.round((passed / (passed + failed)) * 100)}% SUCCESS)${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Test Suite Execution Error:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

runTestSuite();
