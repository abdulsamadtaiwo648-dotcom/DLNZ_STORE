import { Product, Order } from './types';

export const products: Product[] = [
  {
    id: 'dlnz-prod-01',
    sku: 'DL-HD01-BLK',
    name: 'DLNZ CORE HOODIE / 01',
    price: 125000,
    category: 'Clothes',
    subcategory: 'Hoodies',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1556821840-4a88f72c0e8d?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    description: 'Heavyweight 450gsm organic cotton hoodie. Architectural oversized fit, custom drop shoulder silhouette, and finished with tonal high-density print graphics on center back.',
    material: '100% ORGANIC COTTON',
    colors: ['Obsidian', 'Charcoal'],
    details: ['450gsm heavyweight loopsback knit', 'Architectural drop shoulder pattern', 'Ribbed side panelling', 'Hand-distressed edges'],
    featured: true,
    limited: false
  },
  {
    id: 'dlnz-prod-02',
    sku: 'DL-CG02-BLK',
    name: 'OBSIDIAN CARGO SYSTEMS',
    price: 185000,
    category: 'Clothes',
    subcategory: 'Pants',
    image: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80',
    stock: 8,
    description: 'Technical utility cargos engineered for movement. Built with modular pockets, adjustable cinch straps at the knee, and a quick-release magnetic cobra belt.',
    material: 'NYLON TOUGH-RIP',
    colors: ['Black', 'Sage'],
    details: ['Water-resistant Ripstop fabrication', 'Genuine Fidlock magnetic buckle systems', 'Dual side modular dimensional pockets', 'Ergonomic knee articulation contours'],
    featured: true,
    limited: true
  },
  {
    id: 'dlnz-prod-03',
    sku: 'DL-PK03-GRA',
    name: 'HEAVY SHELL TECH PARKA',
    price: 310000,
    category: 'Clothes',
    subcategory: 'Jackets',
    image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    stock: 5,
    description: 'Ultimate multi-layered brutalist weather defense system. Interactive modular storm hood, fully taped seams, waterproof zippers, and integrated sling carrying system.',
    material: '3-LAYER GORE-SYSTEM',
    colors: ['Slate Gray', 'Obsidian'],
    details: ['Fully taped waterproof seams', 'YKK Aquaguard water-tight zips', 'Modular chest pockets', 'Removable interior harness sling'],
    featured: true,
    limited: true
  },
  {
    id: 'dlnz-prod-04',
    sku: 'DL-AC04-SLT',
    name: 'METROPOLIS SHOULDER PACK',
    price: 95000,
    category: 'Bags',
    subcategory: 'Bags',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=800&q=80',
    stock: 12,
    description: 'Compact asymmetrical technical sling bag with custom steel hardware. Multi-compartment interior layout designed to securely house micro-devices and everyday essentials.',
    material: '1050D BALLISTIC NYLON',
    colors: ['Obsidian', 'Olive Drab'],
    details: ['High-density ballistic nylon', 'Military-spec steel carabiners', 'Water-resistant interior lining', 'Quick-adjust tactical strap'],
    featured: false,
    limited: false
  },
  {
    id: 'dlnz-prod-05',
    sku: 'DL-BN05-BLK',
    name: 'BRUTALIST BEANIE / OBSIDIAN',
    price: 42000,
    category: 'Accessories & Jewelry',
    subcategory: 'Headwear',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d435350?auto=format&fit=crop&w=800&q=80',
    hoverImage: 'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?auto=format&fit=crop&w=800&q=80',
    stock: 25,
    description: 'Double-layered thick rib-knit wool-blend beanie with structural brutalist fit and a clean debossed metal brand plate.',
    material: 'MERINO WOOL-BLEND',
    colors: ['Black', 'Alabaster'],
    details: ['Ultra-fine Merino wool blend comfort', '4-notch crown darts detailing', 'Precision engineered industrial branding patch', 'Dual-density premium insulation loops'],
    featured: false,
    limited: false
  }
];

export const orders: Order[] = [
  {
    id: 'DLNZ-9921',
    customerName: 'Alexander V.',
    customerEmail: 'alex.v@example.com',
    date: 'Oct 12, 2023',
    amount: 2440.00,
    status: 'Processing'
  },
  {
    id: 'DLNZ-9920',
    customerName: 'M. Nakajima',
    customerEmail: 'nakajima@tokyo.jp',
    date: 'Oct 11, 2023',
    amount: 890.00,
    status: 'Shipped',
    tracking: 'UPS: 1Z992A...'
  },
  {
    id: 'DLNZ-9919',
    customerName: 'Julian Thorne',
    customerEmail: 'j.thorne@style.com',
    date: 'Oct 11, 2023',
    amount: 1250.00,
    status: 'Hold'
  }
];
