// Master jewellery data

export type ProductVariant = {
  id: string; // e.g. 'v1', crypto.randomUUID() or Date.now()-based
  size?: string; // e.g. ring size '14', bangle size '2.4'
  metal?: string; // e.g. 'Gold', 'Silver'
  purity?: string; // e.g. '22K', '916'
  weight?: string; // e.g. '12g'
  stone?: string; // e.g. 'Ruby', 'None'
  sku?: string;
  priceDelta: number; // added to/subtracted from base product price for this variant
  stock: number; // stock quantity for this specific variant
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  images?: string[];
  description: string;
  tag?: 'new' | 'bestseller' | 'sale' | 'soldout';
  material: string;
  weight?: string;
  purity?: string;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  // Inventory & catalogue upgrade fields (all optional so the bundled demo
  // catalogue below — which predates these — still type-checks without
  // being updated). Callers should default sensibly, e.g. `?? 0` / `?? 5`.
  stockQuantity?: number;
  lowStockThreshold?: number;
  altTexts?: string[];
  variants?: ProductVariant[];
  seoTitle?: string;
  seoDescription?: string;
  makingCharge?: number;
  useDynamicPricing?: boolean;
  sku?: string;
  barcode?: string;
  status?: 'draft' | 'published';
  featured?: boolean;
  trending?: boolean;
  deletedAt?: string;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  image: string;
  count: number;
};

export type Review = {
  id: string;
  name: string;
  city: string;
  avatar: string;
  rating: number;
  text: string;
  product?: string;
  productId?: string;
  title?: string;
  photo?: string;
  helpful?: number;
  reported?: boolean;
  date: string;
  verified: boolean;
};

export const categories: Category[] = [
  { slug: 'gold', name: 'Gold Jewellery', description: '916 Hallmarked Gold', image: '/images/gallery/necklace-1.jpg', count: 124 },
  { slug: 'silver', name: 'Silver Jewellery', description: '92.5% Pure Silver', image: '/images/gallery/necklace-2.jpg', count: 98 },
  { slug: 'diamond', name: 'Diamond', description: 'Certified Diamonds', image: '/images/gallery/ring-5.jpg', count: 56 },
  { slug: 'gems', name: 'Precious Gems', description: 'Ruby, Emerald, Sapphire', image: '/images/gallery/ring-2.jpg', count: 42 },
  { slug: 'rudraksh', name: 'Rudraksh', description: '1 to 21 Mukhi Certified', image: '/images/gallery/rudraksh-1.jpg', count: 38 },
  { slug: 'necklaces', name: 'Necklaces', description: 'Statement & Daily Wear', image: '/images/gallery/necklace-4.jpg', count: 87 },
  { slug: 'earrings', name: 'Earrings', description: 'Jhumkas, Studs, Chandbalis', image: '/images/gallery/earrings-4.jpg', count: 112 },
  { slug: 'rings', name: 'Rings', description: 'Engagement & Cocktail', image: '/images/gallery/ring-1.jpg', count: 64 },
  { slug: 'bangles', name: 'Bangles', description: 'Traditional & Modern', image: '/images/gallery/bracelet-3.jpg', count: 78 },
  { slug: 'bracelets', name: 'Bracelets', description: 'Chain & Charm', image: '/images/gallery/bracelet-1.jpg', count: 45 },
  { slug: 'pendants', name: 'Pendants', description: 'Religious & Designer', image: '/images/gallery/necklace-6.jpg', count: 52 },
  { slug: 'bridal', name: 'Bridal Sets', description: 'Complete Bridal', image: '/images/gallery/necklace-8.jpg', count: 28 },
];

export const products: Product[] = [
  { id: 'p001', name: 'Diamond Floral Necklace', slug: 'diamond-floral-necklace', category: 'necklaces', price: 49999, oldPrice: 69999, image: '/images/gallery/necklace-1.jpg', description: 'A breathtaking masterpiece featuring ethically-sourced diamonds set in 18K gold, this floral necklace captures the beauty of nature with extraordinary precision. Each petal is hand-set by master artisans.', tag: 'new', material: '18K Gold + Diamond', weight: '24g', purity: '750', inStock: true, rating: 4.8, reviewCount: 42 },
  { id: 'p002', name: 'Gold Temple Necklace', slug: 'gold-temple-necklace', category: 'necklaces', price: 64999, oldPrice: 89999, image: '/images/gallery/necklace-2.jpg', description: 'Inspired by the grandeur of ancient South Indian temples, this 22K gold necklace features intricate hand-engraved motifs passed down through generations of master craftsmen.', tag: 'bestseller', material: '22K Gold', weight: '32g', purity: '916', inStock: true, rating: 4.9, reviewCount: 67 },
  { id: 'p003', name: 'Pearl & Gold Necklace', slug: 'pearl-gold-necklace', category: 'necklaces', price: 29999, oldPrice: 39999, image: '/images/gallery/necklace-3.jpg', description: 'South Sea pearls of exceptional lustre are cradled in 18K gold in this timeless piece. A celebration of femininity and grace, perfect for weddings and milestone occasions.', tag: 'sale', material: '18K Gold + Pearl', weight: '14g', purity: '750', inStock: true, rating: 4.7, reviewCount: 38 },
  { id: 'p004', name: 'Kundan Bridal Necklace', slug: 'kundan-bridal-necklace', category: 'bridal', price: 54999, oldPrice: 74999, image: '/images/gallery/necklace-4.jpg', description: 'The crown jewel of our bridal collection. This Kundan masterpiece is set with uncut precious stones in traditional meenakari goldwork — your most cherished heirloom.', tag: 'bestseller', material: 'Kundan + Gold', weight: '38g', inStock: true, rating: 4.9, reviewCount: 89 },
  { id: 'p005', name: 'Ruby Gold Necklace', slug: 'ruby-gold-necklace', category: 'gems', price: 59999, oldPrice: 79999, image: '/images/gallery/necklace-5.jpg', description: 'Burmese rubies of deep pigeon-blood red glow brilliantly against hand-hammered 22K gold. A rare treasure for the woman who appreciates the finest gems.', tag: 'new', material: '22K Gold + Ruby', weight: '28g', purity: '916', inStock: true, rating: 4.8, reviewCount: 24 },
  { id: 'p006', name: 'Polki Diamond Necklace', slug: 'polki-diamond-necklace', category: 'diamond', price: 89999, oldPrice: 119999, image: '/images/gallery/necklace-6.jpg', description: 'Polki diamonds in their raw, uncut glory are mounted in royal gold setting. Inspired by Mughal jewellery heritage, this necklace is wearable history.', tag: 'bestseller', material: 'Polki + Gold', weight: '42g', purity: '916', inStock: true, rating: 5.0, reviewCount: 31 },
  { id: 'p101', name: 'Gold Jhumka Earrings', slug: 'gold-jhumka-earrings', category: 'earrings', price: 24999, oldPrice: 32999, image: '/images/gallery/earrings-1.jpg', description: "Our iconic gold jhumkas are treasured across generations. Freshwater pearls dangle from 22K gold bells finished with exquisite filigree — India's most beloved earring form.", tag: 'new', material: '22K Gold + Pearl', weight: '12g', purity: '916', inStock: true, rating: 4.8, reviewCount: 56 },
  { id: 'p102', name: 'Diamond Stud Earrings', slug: 'diamond-stud-earrings', category: 'earrings', price: 19999, oldPrice: 26999, image: '/images/gallery/earrings-2.jpg', description: 'Round brilliant-cut diamonds of VS clarity catch every light. Set in 18K gold with secure four-prong settings, these timeless studs will be worn every single day.', tag: 'bestseller', material: '18K Gold + Diamond', weight: '4g', purity: '750', inStock: true, rating: 4.9, reviewCount: 124 },
  { id: 'p103', name: 'Hoop Earrings', slug: 'hoop-earrings', category: 'earrings', price: 14999, oldPrice: 19999, image: '/images/gallery/earrings-3.jpg', description: 'Fluid, modern, and effortlessly chic. These 18K gold hoop earrings with a brushed finish transition seamlessly from office meetings to evening events.', tag: 'sale', material: '18K Gold', weight: '6g', purity: '750', inStock: true, rating: 4.6, reviewCount: 42 },
  { id: 'p104', name: 'Kundan Chandbali Earrings', slug: 'kundan-chandbali-earrings', category: 'earrings', price: 22999, oldPrice: 29999, image: '/images/gallery/earrings-4.jpg', description: 'Traditional Kundan stones in rich colours are set into crescent-shaped Chandbali hoops. The most photographed earrings at Indian weddings — for good reason.', tag: 'new', material: 'Kundan + Gold', weight: '14g', inStock: true, rating: 4.8, reviewCount: 38 },
  { id: 'p105', name: 'Pearl Drop Earrings', slug: 'pearl-drop-earrings', category: 'earrings', price: 18999, oldPrice: 24999, image: '/images/gallery/earrings-5.jpg', description: 'Baroque freshwater pearls suspended from 18K gold drops create an ethereal, romantic look. Versatile enough for bridal and corporate occasions alike.', tag: 'bestseller', material: '18K Gold + Pearl', weight: '8g', purity: '750', inStock: true, rating: 4.7, reviewCount: 51 },
  { id: 'p201', name: 'Solitaire Diamond Ring', slug: 'solitaire-diamond-ring', category: 'rings', price: 39999, oldPrice: 54999, image: '/images/gallery/ring-1.jpg', description: 'A perfectly proportioned round brilliant diamond — 0.5 ct, F colour, VVS2 clarity — in a slender 18K gold cathedral solitaire. The ultimate symbol of forever.', tag: 'bestseller', material: '18K Gold + Diamond', weight: '4g', purity: '750', inStock: true, rating: 5.0, reviewCount: 88 },
  { id: 'p202', name: 'Emerald Cocktail Ring', slug: 'emerald-cocktail-ring', category: 'gems', price: 28999, oldPrice: 38999, image: '/images/gallery/ring-2.jpg', description: 'A vivid emerald from Zambia, surrounded by a pavé halo of white diamonds, set in 18K gold. Worn on the hand, this cocktail ring commands a room.', tag: 'new', material: '18K Gold + Emerald', weight: '5g', purity: '750', inStock: true, rating: 4.8, reviewCount: 22 },
  { id: 'p301', name: 'Silver Oxidised Necklace', slug: 'silver-oxidised-necklace', category: 'silver', price: 4999, oldPrice: 7999, image: '/images/gallery/necklace-7.jpg', description: 'Oxidised 92.5 sterling silver in intricate tribal motifs creates this statement necklace. BIS hallmarked, tarnish-resistant coated, artisan handmade.', tag: 'sale', material: '92.5 Silver', weight: '22g', purity: '925', inStock: true, rating: 4.6, reviewCount: 67 },
  { id: 'p302', name: 'Silver Jhumka', slug: 'silver-jhumka', category: 'silver', price: 2999, oldPrice: 4499, image: '/images/gallery/earrings-6.jpg', description: 'Traditional Indian jhumka design reimagined in 92.5 sterling silver with oxidised finish. Lightweight for all-day wear, bold enough to make a statement.', tag: 'new', material: '92.5 Silver', weight: '8g', purity: '925', inStock: true, rating: 4.7, reviewCount: 45 },
  { id: 'p303', name: 'Silver Pendant Set', slug: 'silver-pendant-set', category: 'silver', price: 3499, oldPrice: 4999, image: '/images/gallery/necklace-8.jpg', description: 'A coordinated 92.5 silver pendant and chain set featuring hand-carved lotus motif. BIS hallmarked and sealed with anti-tarnish coating.', tag: 'bestseller', material: '92.5 Silver', weight: '6g', purity: '925', inStock: true, rating: 4.5, reviewCount: 33 },
  { id: 'p401', name: '5 Mukhi Rudraksh Mala', slug: '5-mukhi-rudraksh-mala', category: 'rudraksh', price: 1999, oldPrice: 2999, image: '/images/gallery/lifestyle-1.jpg', description: 'Certified Grade-A 5 Mukhi Rudraksh beads strung in sacred thread from the high-altitude forests of Nepal. Each bead is individually energised and authenticated.', tag: 'bestseller', material: 'Rudraksh (Nepal)', inStock: true, rating: 4.9, reviewCount: 156 },
  { id: 'p402', name: '1 Mukhi Rudraksh Pendant', slug: '1-mukhi-rudraksh-pendant', category: 'rudraksh', price: 8999, oldPrice: 12999, image: '/images/gallery/lifestyle-2.jpg', description: 'An extraordinarily rare 1 Mukhi Rudraksh representing Lord Shiva himself, set in a sterling silver pendant. Comes with original certificate of authenticity.', tag: 'new', material: 'Rudraksh + Silver', inStock: true, rating: 5.0, reviewCount: 29 },
  { id: 'p403', name: '7 Mukhi Rudraksh Bracelet', slug: '7-mukhi-rudraksh-bracelet', category: 'rudraksh', price: 3499, oldPrice: 4999, image: '/images/gallery/bracelet-7.jpg', description: 'Seven 7 Mukhi Rudraksh beads — associated with Goddess Mahalakshmi and prosperity — elegantly strung for daily wear. Sourced directly from Nepal.', tag: 'sale', material: 'Rudraksh', inStock: true, rating: 4.8, reviewCount: 78 },
  { id: 'p501', name: 'Gold Kada Bangle', slug: 'gold-kada-bangle', category: 'bangles', price: 44999, oldPrice: 59999, image: '/images/gallery/bracelet-1.jpg', description: 'A bold 22K gold kada with a hand-engraved chevron pattern, worn solo or stacked. Weight: 35g approx. Hallmarked, certified, and built to last lifetimes.', tag: 'bestseller', material: '22K Gold', weight: '22g', purity: '916', inStock: true, rating: 4.9, reviewCount: 41 },
  { id: 'p502', name: 'Diamond Tennis Bracelet', slug: 'diamond-tennis-bracelet', category: 'bracelets', price: 79999, oldPrice: 99999, image: '/images/gallery/bracelet-2.jpg', description: 'Seventy-two round brilliant diamonds cascade along this 18K white gold bracelet. Flexible box-chain links ensure a perfect fit and comfortable all-day wear.', tag: 'new', material: '18K White Gold + Diamond', weight: '12g', purity: '750', inStock: true, rating: 4.9, reviewCount: 27 },
  { id: 'p601', name: 'Om Gold Pendant', slug: 'om-gold-pendant', category: 'pendants', price: 7999, oldPrice: 10999, image: '/images/gallery/lifestyle-3.jpg', description: 'The sacred Om symbol cast in 22K gold, worn close to the heart. Hand-finished surface, available in matte or polished finish. A meaningful daily companion.', tag: 'bestseller', material: '22K Gold', weight: '4g', purity: '916', inStock: true, rating: 4.8, reviewCount: 92 },
  { id: 'p602', name: 'Ganesha Diamond Pendant', slug: 'ganesha-diamond-pendant', category: 'pendants', price: 15999, oldPrice: 21999, image: '/images/gallery/ring-3.jpg', description: 'Lord Ganesha, the remover of obstacles, rendered in exquisite 18K gold micro-detail with diamond accents. The most auspicious gift for every milestone.', tag: 'new', material: '18K Gold + Diamond', weight: '5g', purity: '750', inStock: true, rating: 4.9, reviewCount: 48 },
];

export const reviews: Review[] = [
  { id: 'r1', name: 'Priya Sharma', city: 'Mumbai', avatar: '/images/model.jpg', rating: 5, date: '2024-11-15', verified: true, product: 'Diamond Floral Necklace', text: 'I wore this necklace at my daughter\'s wedding and received more compliments than the bride! The craftsmanship is extraordinary — it looks even more beautiful in person. Worth every rupee.' },
  { id: 'r2', name: 'Anjali Mehta', city: 'Delhi', avatar: '/images/model.jpg', rating: 5, date: '2024-12-02', verified: true, product: 'Gold Temple Necklace', text: 'Three generations of my family shop only at Om Gauri Putra. The quality never wavers. This temple necklace is exactly what heirloom jewellery should feel like — heavy, impeccable, timeless.' },
  { id: 'r3', name: 'Sunita Reddy', city: 'Hyderabad', avatar: '/images/model.jpg', rating: 5, date: '2024-10-20', verified: true, product: 'Kundan Bridal Necklace', text: 'My bridal set was custom-designed here. The team was patient, professional and the final piece brought me to tears. Every bride deserves jewellery this special.' },
  { id: 'r4', name: 'Kavitha Nair', city: 'Chennai', avatar: '/images/model.jpg', rating: 5, date: '2024-09-18', verified: true, product: 'Gold Jhumka Earrings', text: 'I have bought jhumkas from many shops but these are in a different league. The weight is perfect, the sound when they move is music, and the 22K gold colour is stunning.' },
  { id: 'r5', name: 'Meera Patel', city: 'Ahmedabad', avatar: '/images/model.jpg', rating: 5, date: '2024-11-30', verified: true, product: 'Solitaire Diamond Ring', text: 'My husband proposed with this ring and I said yes before he finished the sentence. The diamond is breathtaking. Every time I look at it I fall in love again.' },
  { id: 'r6', name: 'Rekha Iyer', city: 'Bangalore', avatar: '/images/model.jpg', rating: 4, date: '2024-08-14', verified: true, product: 'Silver Pendant Set', text: 'Beautiful silver work at a very fair price. The anti-tarnish coating is excellent — I have worn it daily for three months without any dulling. Great value for money.' },
  { id: 'r7', name: 'Fatima Shaikh', city: 'Pune', avatar: '/images/model.jpg', rating: 5, date: '2024-12-10', verified: true, product: 'Diamond Tennis Bracelet', text: 'I treated myself to this bracelet for my 40th birthday and it is the most beautiful thing I own. The diamonds are exceptional and the clasp is very secure. Pure luxury.' },
  { id: 'r8', name: 'Deepa Krishnan', city: 'Kochi', avatar: '/images/model.jpg', rating: 5, date: '2024-07-22', verified: true, product: '1 Mukhi Rudraksh Pendant', text: 'The Rudraksh pendant came with a certificate of authenticity and a beautiful explanation of its significance. I can feel the positive energy. Highly recommend to anyone seeking both beauty and spirituality.' },
  { id: 'r9', name: 'Rashmi Gupta', city: 'Kolkata', avatar: '/images/model.jpg', rating: 5, date: '2024-10-05', verified: true, product: 'Polki Diamond Necklace', text: 'I was nervous ordering a piece this expensive online but the experience was flawless. Packaging was exquisite, the necklace arrived exactly as shown, and customer care was exceptional.' },
];

export const instagramImages = [
  '/images/gallery/lifestyle-1.jpg',
  '/images/gallery/necklace-7.jpg',
  '/images/gallery/lifestyle-2.jpg',
  '/images/gallery/earrings-2.jpg',
  '/images/gallery/lifestyle-3.jpg',
  '/images/gallery/rudraksh-1.jpg',
];

export const heroSlides = [
  { eyebrow: 'Timeless Elegance', title: 'Crafted to Make You', titleEm: 'Unforgettable', desc: 'Discover heirloom jewellery handcrafted by master artisans — for every milestone, every memory, every you.', cta: 'Explore Collections', href: '/collections', image: '/images/hero.jpg' },
  { eyebrow: 'Bridal Collection', title: 'Heritage', titleEm: 'In Gold', desc: 'Handcrafted bridal masterpieces — celebrating every sacred moment.', cta: 'Explore', href: '/collections?type=bridal', image: '/images/gallery/lifestyle-1.jpg' },
  { eyebrow: 'Sacred Rudraksh', title: 'Wear the Divine,', titleEm: 'Every Day', desc: 'Certified, energised Rudraksh from the high forests of Nepal — for protection, prosperity, and inner peace.', cta: 'Shop Rudraksh', href: '/collections?type=rudraksh', image: '/images/luxury-bg.jpg' },
];
