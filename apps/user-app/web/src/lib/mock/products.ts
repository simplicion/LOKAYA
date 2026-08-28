export type ProductVariationOption = {
  label: string;
  value: string;
  meta?: string; // e.g. hex code for colors
};

export type ProductVariation = {
  name: string;
  type: 'color' | 'pill' | 'dropdown';
  options: ProductVariationOption[];
};

export type ProductSpecification = {
  key: string;
  value: string;
};

export type ProductHighlight = {
  icon: string; // lucide icon name or standard identifier
  text: string;
};

export type ProductTrustBadge = {
  icon: string;
  title: string;
  subtitle: string;
};

export type ProductReviewDistribution = {
  star: number;
  count: number;
};

export type StoreInfo = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviews: string;
  positivePercentage: string;
};

export type Product = {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  price: number;
  originalPrice?: number;
  discountLabel?: string;
  images: string[];
  store: StoreInfo;
  
  rating?: {
    score: number;
    count: number;
    distribution: ProductReviewDistribution[];
  };
  
  badges?: ProductTrustBadge[];
  variations?: ProductVariation[];
  highlights?: ProductHighlight[];
  description: string;
  specifications?: ProductSpecification[];
  
  delivery?: {
    fee: number;
    freeAbove?: number;
    estimatedDays: string;
  };
  
  offers?: {
    title: string;
    description: string;
  }[];
  
  inStock: boolean;
};

export const MOCK_PRODUCTS: Record<string, Product> = {
  // 1. Fashion Product (from mockup)
  'fashion-123': {
    id: 'fashion-123',
    category: 'Fashion',
    title: 'Waffle Knit Shirt',
    subtitle: 'Brown • Relaxed Fit • Half Sleeve',
    price: 1499,
    originalPrice: 2499,
    discountLabel: '40% OFF',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?w=800&q=80'
    ],
    store: {
      id: 'store-ut',
      name: 'Urban Threads',
      handle: '@urbanthreads',
      avatar: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=100&h=100&fit=crop',
      verified: true,
      rating: 4.8,
      reviews: '12.4K',
      positivePercentage: '98%'
    },
    rating: {
      score: 4.7,
      count: 1234,
      distribution: [
        { star: 5, count: 834 },
        { star: 4, count: 282 },
        { star: 3, count: 84 },
        { star: 2, count: 32 },
        { star: 1, count: 22 }
      ]
    },
    badges: [
      { icon: 'star', title: '4.7', subtitle: '(1.2K reviews)' },
      { icon: 'shield-check', title: 'Trusted', subtitle: 'Top Rated Store' },
      { icon: 'clock', title: '7 Days', subtitle: 'Easy Returns' }
    ],
    variations: [
      {
        name: 'Color',
        type: 'color',
        options: [
          { label: 'Brown', value: 'brown', meta: '#5C4033' },
          { label: 'Beige', value: 'beige', meta: '#F5F5DC' },
          { label: 'Black', value: 'black', meta: '#000000' },
          { label: 'White', value: 'white', meta: '#FFFFFF' }
        ]
      },
      {
        name: 'Size',
        type: 'pill',
        options: [
          { label: 'S', value: 's' },
          { label: 'M', value: 'm' },
          { label: 'L', value: 'l' },
          { label: 'XL', value: 'xl' },
          { label: 'XXL', value: 'xxl' }
        ]
      }
    ],
    highlights: [
      { icon: 'grid', text: 'Waffle Knit Texture' },
      { icon: 'wind', text: 'Breathable Fabric' },
      { icon: 'shirt', text: 'Relaxed Fit' },
      { icon: 'smile', text: 'All Day Comfort' }
    ],
    description: 'Crafted from premium waffle knit fabric, this shirt offers breathability and a relaxed fit for all-day comfort. Perfect for casual outings or effortless layering.',
    specifications: [
      { key: 'Fabric', value: '100% Cotton Waffle Knit' },
      { key: 'Fit', value: 'Relaxed/Oversized' },
      { key: 'Neck', value: 'Cuban Collar' },
      { key: 'Care', value: 'Machine wash cold' }
    ],
    delivery: { fee: 40, freeAbove: 999, estimatedDays: 'Fri, 23 May' },
    offers: [
      { title: 'Bank Offer', description: '10% Off on ICICI Cards' }
    ],
    inStock: true
  },
  
  // 2. Electronics Product (Lots of specs, generic variations)
  'tech-456': {
    id: 'tech-456',
    category: 'Electronics',
    title: 'SonicPro Wireless ANC Headphones',
    subtitle: 'Active Noise Cancelling • 40hr Battery',
    price: 4999,
    originalPrice: 8999,
    discountLabel: '44% OFF',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80'
    ],
    store: {
      id: 'store-teq',
      name: 'Tech Haven',
      handle: '@techhaven',
      avatar: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
      verified: true,
      rating: 4.5,
      reviews: '8.2K',
      positivePercentage: '94%'
    },
    rating: {
      score: 4.3,
      count: 456,
      distribution: [
        { star: 5, count: 300 },
        { star: 4, count: 100 },
        { star: 3, count: 30 },
        { star: 2, count: 16 },
        { star: 1, count: 10 }
      ]
    },
    badges: [
      { icon: 'shield', title: '1 Year', subtitle: 'Brand Warranty' },
      { icon: 'clock', title: '15 Days', subtitle: 'Replacement' }
    ],
    variations: [
      {
        name: 'Color',
        type: 'color',
        options: [
          { label: 'Matte Black', value: 'black', meta: '#1A1A1A' },
          { label: 'Silver', value: 'silver', meta: '#C0C0C0' }
        ]
      },
      {
        name: 'Version',
        type: 'pill',
        options: [
          { label: 'Standard', value: 'std' },
          { label: 'Pro (Spatial Audio)', value: 'pro' }
        ]
      }
    ],
    description: 'Immerse yourself in pure sound with SonicPro. Advanced ANC blocks out the world, while high-res drivers deliver studio-quality audio. With up to 40 hours of battery life, the music never stops.',
    specifications: [
      { key: 'Bluetooth', value: 'v5.3' },
      { key: 'Driver Size', value: '40mm Neodymium' },
      { key: 'Battery Life', value: '40 Hours (ANC Off)' },
      { key: 'Charging', value: 'Type-C Fast Charge (10min = 4hrs)' },
      { key: 'Water Resistance', value: 'IPX4' },
      { key: 'Weight', value: '250g' }
    ],
    delivery: { fee: 0, estimatedDays: 'Wed, 21 May' },
    inStock: true
  },
  
  // 3. Grocery / FMCG (No variations, no specs)
  'grocery-789': {
    id: 'grocery-789',
    category: 'Groceries',
    title: 'Organic Honey (Raw & Unfiltered)',
    subtitle: '500g Glass Jar',
    price: 350,
    images: [
      'https://images.unsplash.com/photo-1587049352847-81a56d773c1c?w=800&q=80'
    ],
    store: {
      id: 'store-nat',
      name: 'Nature Farms',
      handle: '@naturefarms',
      avatar: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop',
      verified: false,
      rating: 4.9,
      reviews: '430',
      positivePercentage: '100%'
    },
    description: '100% raw, unfiltered honey directly sourced from local apiaries. Contains natural pollen and enzymes. Perfect for sweetening tea, baking, or spreading on toast.',
    delivery: { fee: 20, freeAbove: 500, estimatedDays: 'Tomorrow' },
    inStock: true
  },
  
  // 4. Out of Stock Product
  'shoes-001': {
    id: 'shoes-001',
    category: 'Footwear',
    title: 'Limited Edition Runner X',
    price: 5999,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'
    ],
    store: {
      id: 'store-snk',
      name: 'SneakerHead India',
      handle: '@sneakerhead',
      avatar: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=100&h=100&fit=crop',
      verified: true,
      rating: 4.6,
      reviews: '2.1K',
      positivePercentage: '92%'
    },
    description: 'Highly coveted runner with responsive foam technology.',
    variations: [
      {
        name: 'Size (UK)',
        type: 'pill',
        options: [
          { label: '7', value: '7' },
          { label: '8', value: '8' },
          { label: '9', value: '9' }
        ]
      }
    ],
    inStock: false
  },
  
  // 5. Digital / Service (No delivery section)
  'service-999': {
    id: 'service-999',
    category: 'Services',
    title: 'Personalized Fitness Plan (1 Month)',
    subtitle: 'Diet + Workout + Weekly Calls',
    price: 1999,
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
    ],
    store: {
      id: 'store-fit',
      name: 'Coach Vikram',
      handle: '@coachvikram',
      avatar: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop',
      verified: true,
      rating: 5.0,
      reviews: '128',
      positivePercentage: '100%'
    },
    badges: [
      { icon: 'zap', title: 'Instant', subtitle: 'Access' }
    ],
    description: 'Get a 100% tailored workout and nutrition plan designed specifically for your goals, lifestyle, and dietary preferences.',
    specifications: [
      { key: 'Format', value: 'PDF + App Access' },
      { key: 'Consultation', value: '1x 30min Weekly Call' },
      { key: 'Duration', value: '4 Weeks' }
    ],
    inStock: true
  }
};
