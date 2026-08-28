export type Address = {
  id: string;
  name: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

export const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    name: 'Saavi Singh',
    type: 'HOME',
    addressLine1: '3/1, Green Park Extension',
    addressLine2: 'Near Metro Station',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    phone: '+91 98765 43210',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'Work',
    type: 'WORK',
    addressLine1: 'Unit 45, Sector 5',
    addressLine2: 'Cyber Hub',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122001',
    phone: '+91 91234 56789',
    isDefault: false,
  }
];

export type OrderStatus = 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED';

export type OrderItem = {
  id: string;
  productId: string;
  title: string;
  subtitle: string;
  price: number;
  quantity: number;
  image: string;
  status: OrderStatus;
};

export type TrackingEvent = {
  status: OrderStatus;
  date: string;
  time: string;
  location?: string;
  description: string;
};

export type Order = {
  id: string;
  date: string;
  totalAmount: number;
  paymentMethod: string;
  deliveryAddress: Address;
  items: OrderItem[];
  tracking: TrackingEvent[];
  estimatedDelivery: string;
  status: OrderStatus; // Aggregate status
};

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-240509-001',
    date: '12 May 2024, 10:30 AM',
    totalAmount: 6348,
    paymentMethod: 'UPI',
    deliveryAddress: MOCK_ADDRESSES[0],
    estimatedDelivery: '17 - 19 May, 2024',
    status: 'OUT_FOR_DELIVERY',
    items: [
      {
        id: 'item-1',
        productId: 'fashion-123',
        title: 'Waffle Knit Shirt',
        subtitle: 'Brown • M',
        price: 1499,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=200&q=80',
        status: 'OUT_FOR_DELIVERY'
      },
      {
        id: 'item-2',
        productId: 'shoes-001',
        title: 'Urban Runner Sneakers',
        subtitle: 'Beige • UK 8',
        price: 3999,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
        status: 'OUT_FOR_DELIVERY'
      }
    ],
    tracking: [
      { status: 'CONFIRMED', date: '12 May', time: '10:30 AM', description: 'Order has been placed successfully.' },
      { status: 'PACKED', date: '13 May', time: '02:15 PM', description: 'Seller has processed your order.' },
      { status: 'SHIPPED', date: '14 May', time: '09:00 AM', location: 'Delhi Hub', description: 'Order has been shipped.' },
      { status: 'OUT_FOR_DELIVERY', date: '16 May', time: '08:45 AM', location: 'Local Hub', description: 'Your order is out for delivery today.' }
    ]
  },
  {
    id: 'ORD-240410-089',
    date: '10 Apr 2024, 05:20 PM',
    totalAmount: 350,
    paymentMethod: 'Credit Card',
    deliveryAddress: MOCK_ADDRESSES[1],
    estimatedDelivery: '12 Apr 2024',
    status: 'DELIVERED',
    items: [
      {
        id: 'item-3',
        productId: 'grocery-789',
        title: 'Organic Honey (Raw & Unfiltered)',
        subtitle: '500g Glass Jar',
        price: 350,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1587049352847-81a56d773c1c?w=200&q=80',
        status: 'DELIVERED'
      }
    ],
    tracking: [
      { status: 'CONFIRMED', date: '10 Apr', time: '05:20 PM', description: 'Order has been placed.' },
      { status: 'DELIVERED', date: '12 Apr', time: '04:10 PM', description: 'Order delivered successfully.' }
    ]
  }
];
