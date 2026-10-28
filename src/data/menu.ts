/**
 * Crave Nation demo menu — all data transcribed from the supplied printed menu
 * image (public/images/menu.jpg).
 *
 * IMPORTANT PROTOTYPE NOTES
 * - Prices are the existing prices printed on the supplied menu. They are used
 *   here as SAMPLE demo data, not as a live source of truth.
 * - Calories are UNVERIFIED estimates for the demo, clearly labelled in the UI.
 * - Ingredients are editable sample content until the restaurant confirms recipes.
 * - Reviews/avatars are clearly-labelled fictional prototype content ("Demo Customer").
 *
 * Tap regions are normalised coordinates on the menu IMAGE (u: 0..1 left→right,
 * v: 0..1 top→bottom), not phone-screen pixels. At runtime they are hit-tested
 * against the AR-tracked menu plane, and a `?calibrate=1` debug overlay shows
 * every region over the live feed so they can be fine-tuned on a printed menu.
 */

export interface MenuRegion {
  /** left edge of the tap region, 0..1 across the menu image width */
  x: number;
  /** top edge of the tap region, 0..1 down the menu image height */
  y: number;
  w: number;
  h: number;
}

export type DishCategory = 'Chicken Snacks' | 'Veg Snacks' | 'Wraps' | 'Mojitoes';

export interface DemoReview {
  text: string;
  name: string;
  stars: number;
}

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  /** price label exactly as printed on the supplied menu */
  priceLabel: string;
  /** tap region on the tracked menu image */
  region: MenuRegion;
  /** crop of the supplied photography used for the AR visual */
  crop?: {
    /** source image, defaults to the chicken nuggets photo */
    image: 'nuggets' | 'menu' | 'wrap';
    x: number;
    y: number;
    w: number;
    h: number;
  };
  /** unverified sample estimate, kcal per printed serving */
  caloriesEstimate: number;
  /** unverified sample macro estimate shown on the calorie sign */
  calories: { kcal: number; carbs: number; fat: number };
  /** red "No 🚫 palm oil" card (sample claim until the restaurant confirms) */
  noPalmOil?: boolean;
  /** short one-line description for the yellow card */
  shortDesc: string;
  /** purple thought-bubble tagline */
  tagline: string;
  /** the blue card, top-left */
  serves: string;
  /** always-on "Must try!" badge with the bear (all demo dishes) */
  mustTry?: boolean;
  /** editable sample ingredients until recipes are confirmed */
  ingredients: { icon: string; label: string }[];
  reviews: DemoReview[];
  /** demonstration rating value — never presented as a real rating */
  demoRating: number;
  mascotLine: string;
  featured?: boolean;
}

export const MENU_IMAGE_ASPECT = {
  /** menu.jpg is 679 x 1020 px (supplied file) */
  width: 679,
  height: 1020,
};

/** Helper: equal-spaced 4-column cell in a section of the menu. */
const col = (i: number, x0: number, x1: number, cells: number): number =>
  x0 + ((x1 - x0) * i) / cells;

const chickenCell = (i: number): MenuRegion => {
  const x0 = 0.024;
  const x1 = 0.622;
  const w = (x1 - x0) / 4;
  return { x: col(i, x0, x1, 4), y: 0.238, w, h: 0.152 };
};

const vegCell = (i: number): MenuRegion => {
  // The veg rows sit above the promo box, so the row is kept narrower to avoid
  // overlapping the wrap column on the right of the printed menu.
  const x0 = 0.024;
  const x1 = 0.74;
  const w = (x1 - x0) / 4;
  return { x: col(i, x0, x1, 4), y: 0.618, w, h: 0.155 };
};

export const DISHES: Dish[] = [
  {
    id: 'chicken-nuggets',
    name: 'Chicken Nuggets',
    category: 'Chicken Snacks',
    priceLabel: 'Regular ₹140 · Large ₹250',
    region: chickenCell(3),
    crop: { image: 'nuggets', x: 0.085, y: 0.16, w: 0.44, h: 0.64 },
    caloriesEstimate: 280,
    calories: { kcal: 450, carbs: 45, fat: 22 },
    noPalmOil: true,
    shortDesc: 'Tenderly cooked chicken',
    tagline: 'crispy and delicious',
    serves: 'Serves 2',
    mustTry: true,
    ingredients: [
      { icon: '🍗', label: 'Chicken breast (sample)' },
      { icon: '🍞', label: 'Crispy breadcrumbs (sample)' },
      { icon: '🌶️', label: 'House spices (sample)' },
    ],
    reviews: [
      { text: 'Super crispy and perfectly seasoned!', name: 'Demo Customer A', stars: 5 },
      { text: 'Loved the fries and the dips. Great snack!', name: 'Demo Customer B', stars: 4 },
      { text: 'Definitely coming back for another plate!', name: 'Demo Customer C', stars: 5 },
    ],
    demoRating: 5,
    mascotLine: 'Crispy power, activate!',
    featured: true,
  },
  {
    id: 'chicken-strips',
    name: 'Chicken Strips',
    category: 'Chicken Snacks',
    priceLabel: '3 pcs ₹140 · 6 pcs ₹250',
    region: chickenCell(0),
    crop: { image: 'menu', x: 0.036, y: 0.252, w: 0.185, h: 0.085 },
    caloriesEstimate: 260,
    calories: { kcal: 320, carbs: 30, fat: 14 },
    noPalmOil: true,
    shortDesc: 'Juicy strips, golden crust',
    tagline: 'juicy and crunchy',
    serves: 'Serves 2',
    mustTry: true,
    ingredients: [
      { icon: '🍗', label: 'Chicken strips (sample)' },
      { icon: '🥛', label: 'Buttermilk marinade (sample)' },
      { icon: '🧄', label: 'Garlic seasoning (sample)' },
    ],
    reviews: [
      { text: 'Super crispy and perfectly seasoned!', name: 'Demo Customer A', stars: 5 },
      { text: 'Loved the fries and the dips. Great snack!', name: 'Demo Customer B', stars: 4 },
      { text: 'Definitely coming back for another plate!', name: 'Demo Customer C', stars: 5 },
    ],
    demoRating: 4.5,
    mascotLine: 'Strip squad reporting!',
  },
  {
    id: 'chicken-popcorn',
    name: 'Chicken Popcorn',
    category: 'Chicken Snacks',
    priceLabel: 'Regular ₹140 · Large ₹250',
    region: chickenCell(1),
    crop: { image: 'menu', x: 0.272, y: 0.252, w: 0.185, h: 0.085 },
    caloriesEstimate: 240,
    calories: { kcal: 290, carbs: 28, fat: 15 },
    noPalmOil: true,
    shortDesc: 'Bite-sized crispy chicken',
    tagline: 'pop-ably delicious',
    serves: 'Serves 1',
    mustTry: true,
    ingredients: [
      { icon: '🍗', label: 'Diced chicken (sample)' },
      { icon: '🌶️', label: 'Peri spice mix (sample)' },
      { icon: '🍅', label: 'Dip of choice (sample)' },
    ],
    reviews: [
      { text: 'Super crispy and perfectly seasoned!', name: 'Demo Customer A', stars: 5 },
      { text: 'Definitely coming back for another plate!', name: 'Demo Customer C', stars: 5 },
    ],
    demoRating: 5,
    mascotLine: 'Pop pop pop! Snack o’clock!',
  },
  {
    id: 'french-fries',
    name: 'French Fries',
    category: 'Veg Snacks',
    priceLabel: 'Regular ₹100 · Large ₹150',
    region: vegCell(0),
    crop: { image: 'menu', x: 0.04, y: 0.634, w: 0.17, h: 0.058 },
    caloriesEstimate: 200,
    calories: { kcal: 310, carbs: 48, fat: 11 },
    noPalmOil: true,
    shortDesc: 'Classic salted golden fries',
    tagline: 'golden and crispy',
    serves: 'Serves 1',
    mustTry: true,
    ingredients: [
      { icon: '🥔', label: 'Crisp fries (sample)' },
      { icon: '🧂', label: 'Classic salt (sample)' },
      { icon: '🍅', label: 'Ketchup dip (sample)' },
    ],
    reviews: [
      { text: 'Loved the fries and the dips. Great snack!', name: 'Demo Customer B', stars: 4 },
      { text: 'Definitely coming back for another plate!', name: 'Demo Customer C', stars: 5 },
    ],
    demoRating: 4.5,
    mascotLine: 'Fry-yay! Let’s celebrate!',
  },
  {
    id: 'veg-nuggets',
    name: 'Veg Nuggets',
    category: 'Veg Snacks',
    priceLabel: '8 pcs ₹100 · 12 pcs ₹150',
    region: vegCell(2),
    crop: { image: 'menu', x: 0.47, y: 0.634, w: 0.17, h: 0.058 },
    caloriesEstimate: 190,
    calories: { kcal: 250, carbs: 36, fat: 9 },
    noPalmOil: true,
    shortDesc: 'Veggie-packed crispy bites',
    tagline: 'crunchy veggie bites',
    serves: 'Serves 1',
    mustTry: true,
    ingredients: [
      { icon: '🥬', label: 'Veggie mix (sample)' },
      { icon: '🍞', label: 'Crumb coating (sample)' },
      { icon: '🧀', label: 'Creamy centre (sample)' },
    ],
    reviews: [
      { text: 'Super crispy and perfectly seasoned!', name: 'Demo Customer A', stars: 5 },
      { text: 'Loved the fries and the dips. Great snack!', name: 'Demo Customer B', stars: 4 },
    ],
    demoRating: 4,
    mascotLine: 'Green team, crunch crew!',
  },
  {
    id: 'chicken-wrap',
    name: 'Chicken Wrap',
    category: 'Wraps',
    priceLabel: '₹130 (as printed)',
    region: { x: 0.644, y: 0.222, w: 0.34, h: 0.062 },
    crop: { image: 'wrap', x: 0.05, y: 0.16, w: 0.62, h: 0.68 },
    caloriesEstimate: 310,
    calories: { kcal: 380, carbs: 42, fat: 16 },
    shortDesc: 'Grilled chicken, soft tortilla',
    tagline: 'wrapped with love',
    serves: 'Serves 1',
    mustTry: true,
    ingredients: [
      { icon: '🌯', label: 'Soft tortilla (sample)' },
      { icon: '🍗', label: 'Grilled chicken (sample)' },
      { icon: '🥬', label: 'Fresh salad (sample)' },
    ],
    reviews: [
      { text: 'Definitely coming back for another plate!', name: 'Demo Customer C', stars: 5 },
      { text: 'Super crispy and perfectly seasoned!', name: 'Demo Customer A', stars: 5 },
    ],
    demoRating: 4.5,
    mascotLine: 'Roll with it!',
  },
  {
    id: 'mango-spicy-mojito',
    name: 'Mango Spicy Mojito',
    category: 'Mojitoes',
    priceLabel: '₹69 (as printed)',
    region: { x: 0.028, y: 0.872, w: 0.225, h: 0.125 },
    crop: { image: 'menu', x: 0.05, y: 0.862, w: 0.17, h: 0.07 },
    caloriesEstimate: 120,
    calories: { kcal: 120, carbs: 30, fat: 0 },
    shortDesc: 'Mango pulp, mint, fizzy soda',
    tagline: 'sweet with a zing',
    serves: 'Serves 1',
    mustTry: false,
    ingredients: [
      { icon: '🥭', label: 'Mango syrup (sample)' },
      { icon: '🌱', label: 'Fresh mint (sample)' },
      { icon: '🍋', label: 'Zesty soda (sample)' },
    ],
    reviews: [
      { text: 'Loved the fries and the dips. Great snack!', name: 'Demo Customer B', stars: 4 },
      { text: 'Definitely coming back for another plate!', name: 'Demo Customer C', stars: 5 },
    ],
    demoRating: 5,
    mascotLine: 'Fizz up your day!',
  },
];

/** Full price list transcribed from the supplied printed menu (sample data). */
export const PRICE_LIST: { category: DishCategory; items: { name: string; price: string }[] }[] = [
  {
    category: 'Chicken Snacks',
    items: [
      { name: 'Chicken Strips', price: '3 pcs ₹140 / 6 pcs ₹250' },
      { name: 'Chicken Popcorn', price: 'Regular ₹140 / Large ₹250' },
      { name: 'Chicken Wings', price: '4 pcs ₹140 / 8 pcs ₹250' },
      { name: 'Chicken Nuggets', price: 'Regular ₹140 / Large ₹250' },
      { name: 'Chicken Legs', price: '2 pcs ₹160 / 4 pcs ₹280' },
      { name: 'Chicken Fingers', price: '4 pcs ₹140 / 8 pcs ₹250' },
      { name: 'Chicken Cheese Balls', price: 'Regular ₹130 / Large ₹220' },
      { name: 'Chicken Loaded Fries', price: '500 ML ₹160 / 750 ML ₹220' },
      { name: 'Chilli Garlic Poper', price: 'Regular ₹140 / Large ₹250' },
      { name: 'Potato Bites', price: 'Regular ₹130 / Large ₹220' },
    ],
  },
  {
    category: 'Veg Snacks',
    items: [
      { name: 'French Fries', price: 'Regular ₹100 / Large ₹150' },
      { name: 'Peri Peri French Fries', price: 'Regular ₹110 / Large ₹160' },
      { name: 'Veg Nuggets', price: '8 pcs ₹100 / 12 pcs ₹150' },
      { name: 'Veg Finger', price: '6 pcs ₹100 / 10 pcs ₹150' },
      { name: 'Veg Cheese Balls', price: 'Regular ₹100 / Large ₹150' },
      { name: 'Potato Bites', price: 'Regular ₹130 / Large ₹180' },
      { name: 'Chilli Garlic Poper', price: 'Regular ₹140 / Large ₹250' },
    ],
  },
  {
    category: 'Wraps',
    items: [
      { name: 'Chicken Wrap', price: '₹130' },
      { name: 'Chicken Balls Loaded Wrap', price: '₹170' },
      { name: 'Egg Wrap', price: '₹120' },
      { name: 'Chicken Popcorn Wrap', price: '₹130' },
      { name: 'Paneer Wrap', price: '₹130' },
      { name: 'Veg Loaded Wrap', price: '₹170' },
      { name: 'Veg Wrap', price: '₹110' },
    ],
  },
  {
    category: 'Mojitoes',
    items: [
      { name: 'Mango Spicy Mojitoes', price: '₹69' },
      { name: 'Lime Mint Mojitoes', price: '₹69' },
      { name: 'Ginger Lemon Curacao Mojitoes', price: '₹69' },
      { name: 'Blue Curacao Mojitoes', price: '₹69' },
    ],
  },
];

export const dishById = (id: string | null) => DISHES.find((d) => d.id === id) ?? null;

export const IMAGE_PATHS = {
  menu: '/images/menu.jpg',
  cafeNight: '/images/cafe-night.jpg',
  cafeDay: '/images/cafe-day.jpg',
  nuggets: '/images/nuggets-fries-dips.jpg',
  wrap: '/images/chicken-wrap.jpg',
  target: '/targets/menu.mind',
};
