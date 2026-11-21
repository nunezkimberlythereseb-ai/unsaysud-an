import { DishItem, StallCredential, TranslationDictionary, Language, AddonOption } from '../types';

export const translations: Record<Language, TranslationDictionary> = {
  bisaya: {
    budgetPrompt: "Pila imong budget karon?",
    budgetSub: "Sulit Matcher para sa mga estudyante",
    searchPlaceholder: "Pangita pagkaon o stall...",
    surpriseBtn: "Surprise Me!",
    allZone: "Tanan (All)",
    outsideZone: "Outside Stalls (1-9)",
    insideZone: "Inside Stalls (10-15)",
    allPill: "🍽️ Tanan",
    ricePill: "🍚 May Kan-on",
    drinksPill: "🥤 Ilmnon & Shakes",
    snacksPill: "🍢 Merienda & Street Food",
    fruitsPill: "🍉 Prutas",
    bakeryPill: "🥐 Pan & Bakery",
    campusLoc: "University Cafeteria",
    liveOpen: "Abli Karon",
    combosFound: "ka sud-an / pagkaon pasok sa budget",
    emptyMatch: "Walay nakit-an nga pagkaon sa ₱{b} sa ani nga filter. Sulayi pagsaka ang budget!",
    changeLabel: "Sobra / Bugas:",
    exactChange: "Sakto ra ang budget!",
    orderLocate: "Order / Tan-aw",
    saveTray: "Ibutang sa Tray",
    trayHeading: "Akong Tray (Saved Meals)",
    trayEmpty: "Haw-ang pa imong tray! Pindota ang Save to Tray sa mga pagkaon nga ganahan nimo.",
    trayCost: "Total Gasto sa Tray:",
    clearTray: "Haw-asan",
    copyTray: "Kopyaha ang Listahan",
    rouletteTitle: "Unsay Sud-an Karon?",
    rouletteSub: "Nangita og lami nga pasok sa imong budget...",
    soldOutTag: "Hurot Na (Sold Out)",
    availableTag: "Available",
    toastCopied: "Nakopya na ang checklist sa clipboard!",
    toastTrayAdded: "Naapil na sa imong tray!",
    merchantPortal: "Cafeteria Merchant Portal",
    studentMode: "Bantay Estudyante",
    logoutMerchant: "Logout & Lock"
  },
  tagalog: {
    budgetPrompt: "Magkano ang budget mo ngayon?",
    budgetSub: "Sulit Matcher para sa mga mag-aaral",
    searchPlaceholder: "Maghanap ng pagkain o stall...",
    surpriseBtn: "Sorpresahin Ako!",
    allZone: "Lahat (All)",
    outsideZone: "Outside Stalls (1-9)",
    insideZone: "Inside Stalls (10-15)",
    allPill: "🍽️ Lahat",
    ricePill: "🍚 May Kanin",
    drinksPill: "🥤 Inumin & Shakes",
    snacksPill: "🍢 Meryenda & Street Food",
    fruitsPill: "🍉 Prutas",
    bakeryPill: "🥐 Tinapay & Bakery",
    campusLoc: "University Cafeteria",
    liveOpen: "Bukas Ngayon",
    combosFound: "na pagkain pasok sa budget",
    emptyMatch: "Walang tugmang pagkain sa ₱{b} gamit ang filter na ito. Subukang taasan ang budget!",
    changeLabel: "Sukli / Natira:",
    exactChange: "Eksaktong-eksakto ang pera!",
    orderLocate: "Order / Silipin",
    saveTray: "Ilagay sa Tray",
    trayHeading: "Aking Tray (Listahan ng Kakainin)",
    trayEmpty: "Walang laman ang tray! Pindutin ang Ilagay sa Tray sa mga napiling pagkain.",
    trayCost: "Kabuuang Halaga sa Tray:",
    clearTray: "Alisin Lahat",
    copyTray: "Kopyahin ang Listahan",
    rouletteTitle: "Anong Ulam Ngayon?",
    rouletteSub: "Naghahanap ng swak sa iyong budget...",
    soldOutTag: "Ubos Na (Sold Out)",
    availableTag: "Available",
    toastCopied: "Nakopya na ang listahan sa clipboard!",
    toastTrayAdded: "Nailagay na sa iyong tray!",
    merchantPortal: "Cafeteria Merchant Portal",
    studentMode: "Student Mode",
    logoutMerchant: "Logout & Lock"
  },
  english: {
    budgetPrompt: "What is your budget today?",
    budgetSub: "Smart campus meal matcher for hungry students",
    searchPlaceholder: "Search dishes, stalls, snacks...",
    surpriseBtn: "Surprise Me!",
    allZone: "All Stalls",
    outsideZone: "Outside Stalls (1-9)",
    insideZone: "Inside Stalls (10-15)",
    allPill: "🍽️ All Items",
    ricePill: "🍚 Rice Meals",
    drinksPill: "🥤 Drinks & Shakes",
    snacksPill: "🍢 Snacks & Street Food",
    fruitsPill: "🍉 Fresh Fruits",
    bakeryPill: "🥐 Bakery & Sweets",
    campusLoc: "University Cafeteria",
    liveOpen: "Open Now",
    combosFound: "meals matched your budget",
    emptyMatch: "No meals found under ₱{b} with this filter. Try increasing your budget!",
    changeLabel: "Remaining Change:",
    exactChange: "Exact budget match!",
    orderLocate: "Order / Customize",
    saveTray: "Save to Tray",
    trayHeading: "My Tray (Saved Orders)",
    trayEmpty: "Your tray is currently empty! Click 'Save to Tray' on meals you plan to purchase.",
    trayCost: "Total Tray Cost:",
    clearTray: "Clear",
    copyTray: "Copy Checklist",
    rouletteTitle: "What To Eat Today?",
    rouletteSub: "Spinning for a delicious meal within your budget...",
    soldOutTag: "Sold Out",
    availableTag: "Available",
    toastCopied: "Order checklist copied to clipboard!",
    toastTrayAdded: "Added to your tray!",
    merchantPortal: "Cafeteria Merchant Portal",
    studentMode: "Student Mode",
    logoutMerchant: "Logout & Lock"
  }
};

export const stallCredentials: StallCredential[] = [
  { stallNo: "Stall 1", officialName: "Swirly Bits", name: "Stall 1 — Swirly Bits", zone: "outside" },
  { stallNo: "Stall 2", officialName: "Java Rice", name: "Stall 2 — Java Rice", zone: "outside" },
  { stallNo: "Stall 3", officialName: "Bread Stall", name: "Stall 3 — Bread Stall", zone: "outside" },
  { stallNo: "Stall 4", officialName: "Pinoy Food Toppings", name: "Stall 4 — Pinoy Food Toppings", zone: "outside" },
  { stallNo: "Stall 5", officialName: "4J Food Stall", name: "Stall 5 — 4J Food Stall", zone: "outside" },
  { stallNo: "Stall 6", officialName: "R&M Refreshment Stall", name: "Stall 6 — R&M Refreshment Stall", zone: "outside" },
  { stallNo: "Stall 7", officialName: "Judah Food 7 & Drinks", name: "Stall 7 — Judah Food 7 & Drinks", zone: "outside" },
  { stallNo: "Stall 8A", officialName: "StreetFood Stall", name: "Stall 8A — StreetFood Stall", zone: "outside" },
  { stallNo: "Stall 8B", officialName: "Juice Bar & Popcorn", name: "Stall 8B — Juice Bar & Popcorn", zone: "outside" },
  { stallNo: "Stall 9", officialName: "Fresh Fruit Bar", name: "Stall 9 — Fresh Fruit Bar", zone: "outside" },
  { stallNo: "Stall 10", officialName: "Master Dumpling", name: "Stall 10 — Master Dumpling", zone: "inside" },
  { stallNo: "Stall 11", officialName: "Deeyang by: Pops Dessert", name: "Stall 11 — Deeyang by: Pops Dessert", zone: "inside" },
  { stallNo: "Stall 12", officialName: "Gulaman District", name: "Stall 12 — Gulaman District", zone: "inside" },
  { stallNo: "Stall 13", officialName: "Val's FoodHub", name: "Stall 13 — Val's FoodHub", zone: "inside" },
  { stallNo: "Stall 14", officialName: "Shamir Food Houz", name: "Stall 14 — Shamir Food Houz", zone: "inside" },
  { stallNo: "Stall 15", officialName: "France Bistro", name: "Stall 15 — France Bistro", zone: "inside" }
];

export const initialStallNotices: Record<string, string> = {};

// Complete official cafeteria menu database
export const initialMenuDatabase: DishItem[] = [
  {
    "id": 101,
    "name": "Flavored Wings + Rice + Free Small Drink",
    "items": "Crispy coated chicken wings (Garlic Parmesan / Sweet Chili), 1 cup Rice, Free juice",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 1 — Swirly Bits",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice",
      "drinks"
    ],
    "available": true,
    "cal": "580 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/uploads/dishes/stall_stall_1_swirly_bits_item_101_1791161176075.jpg?v=1791161176075",
    "ownerUploadedImage": "/uploads/dishes/stall_stall_1_swirly_bits_item_101_1791161176075.jpg?v=1791161176075",
    "imageId": "img_stall_1___swirly_bits_item_101_1791161176075",
    "storageId": "stall_stall_1_swirly_bits_item_101_1791161176075.jpg",
    "isOwnerImageProtected": true
  },
  {
    "id": 102,
    "name": "Ice Cream (Small Cone)",
    "items": "Smooth creamy soft-serve in crispy wafer cone",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 1 — Swirly Bits",
    "zone": "outside",
    "category": "Desserts",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/uploads/dishes/stall_stall_1_swirly_bits_item_102_1791161187130.jpg?v=1791161187130",
    "ownerUploadedImage": "/uploads/dishes/stall_stall_1_swirly_bits_item_102_1791161187130.jpg?v=1791161187130",
    "imageId": "img_stall_1___swirly_bits_item_102_1791161187130",
    "storageId": "stall_stall_1_swirly_bits_item_102_1791161187130.jpg",
    "isOwnerImageProtected": true
  },
  {
    "id": 103,
    "name": "Ice Cream (Big Cone)",
    "items": "Double swirl scoop in waffle cone",
    "price": 30,
    "rating": 4.7,
    "stall": "Stall 1 — Swirly Bits",
    "zone": "outside",
    "category": "Desserts",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "240 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/uploads/dishes/stall_stall_1_swirly_bits_item_103_1791161243999.jpg?v=1791161243999",
    "ownerUploadedImage": "/uploads/dishes/stall_stall_1_swirly_bits_item_103_1791161243999.jpg?v=1791161243999",
    "imageId": "img_stall_1___swirly_bits_item_103_1791161243999",
    "storageId": "stall_stall_1_swirly_bits_item_103_1791161243999.jpg",
    "isOwnerImageProtected": true
  },
  {
    "id": 104,
    "name": "Ice Cream Cup with Toppings",
    "items": "Sundae cup with crushed oreo, sprinkles, or choco drizzle (+₱5 each extra topping)",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 1 — Swirly Bits",
    "zone": "outside",
    "category": "Desserts",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "310 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/uploads/dishes/stall_stall_1_swirly_bits_item_104_1791161254074.jpg?v=1791161254074",
    "ownerUploadedImage": "/uploads/dishes/stall_stall_1_swirly_bits_item_104_1791161254074.jpg?v=1791161254074",
    "imageId": "img_stall_1___swirly_bits_item_104_1791161254074",
    "storageId": "stall_stall_1_swirly_bits_item_104_1791161254074.jpg",
    "isOwnerImageProtected": true
  },
  {
    "id": 201,
    "name": "Java Rice with Rolled Pork Siomai",
    "items": "Special aromatic yellow java rice with 4 pcs steamed pork siomai, chili garlic & calamansi",
    "price": 40,
    "rating": 4.8,
    "stall": "Stall 2 — Java Rice",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/java_rice_siomai.jpg",
    "imageUrl": "/assets/representative/java_rice_siomai.jpg"
  },
  {
    "id": 301,
    "name": "Warm Cheese Bread",
    "items": "Warm soft bakery roll topped with creamy melted cheese and rich butter",
    "price": 10,
    "rating": 4.8,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "160 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/warm_cheese_bread.jpg",
    "imageUrl": "/assets/representative/warm_cheese_bread.jpg"
  },
  {
    "id": 302,
    "name": "Spanish Bread + Chocoroll",
    "items": "Warm buttery Spanish bread roll alongside a soft chocolate roll pastry",
    "price": 15,
    "rating": 4.8,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "230 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/spanish_choco_bread.jpg",
    "imageUrl": "/assets/representative/spanish_choco_bread.jpg"
  },
  {
    "id": 303,
    "name": "Classic Ensaymada with Butter & Sugar",
    "items": "Classic Filipino ensaymada brushed with rich butter and sprinkled with sugar",
    "price": 10,
    "rating": 4.9,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 304,
    "name": "Sweet Heart",
    "items": "Sweet heart-shaped baked campus pastry",
    "price": 8,
    "rating": 4.6,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "130 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 305,
    "name": "Pie",
    "items": "Flaky golden baked snack pie with sweet fruit filling",
    "price": 12,
    "rating": 4.5,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/warm_cheese_bread.jpg",
    "imageUrl": "/assets/representative/warm_cheese_bread.jpg"
  },
  {
    "id": 306,
    "name": "Butterscotch",
    "items": "Rich chewy caramelized brown sugar butter bar",
    "price": 10,
    "rating": 4.7,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "150 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/spanish_choco_bread.jpg",
    "imageUrl": "/assets/representative/spanish_choco_bread.jpg"
  },
  {
    "id": 307,
    "name": "Choco Crinkles",
    "items": "Fudgy rich chocolate cookie dusted with confectioners sugar",
    "price": 12,
    "rating": 4.8,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "160 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/spanish_choco_bread.jpg",
    "imageUrl": "/assets/representative/spanish_choco_bread.jpg"
  },
  {
    "id": 308,
    "name": "Cinnamon Roll",
    "items": "Soft spiral dough roll laced with sweet fragrant cinnamon glaze",
    "price": 8,
    "rating": 4.6,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 309,
    "name": "Coco Buns",
    "items": "Sweet bread bun stuffed with sweetened grated coconut (pan de coco)",
    "price": 10,
    "rating": 4.5,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "170 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/warm_cheese_bread.jpg",
    "imageUrl": "/assets/representative/warm_cheese_bread.jpg"
  },
  {
    "id": 310,
    "name": "German Cross",
    "items": "Crispy-edged bakery pastry with custard center",
    "price": 7,
    "rating": 4.4,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery"
    ],
    "available": true,
    "cal": "120 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 311,
    "name": "Spanish Bread",
    "items": "Warm buttery bread roll rolled in breadcrumbs and brown sugar butter filling",
    "price": 7,
    "rating": 4.7,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "130 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/spanish_choco_bread.jpg",
    "imageUrl": "/assets/representative/spanish_choco_bread.jpg"
  },
  {
    "id": 312,
    "name": "Ensaymada",
    "items": "Classic individual ensaymada brushed with butter and sprinkled with sugar",
    "price": 6,
    "rating": 4.6,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 313,
    "name": "Ham & Cheese Roll",
    "items": "Savory soft baked bread rolled with sliced ham and cheddar cheese",
    "price": 15,
    "rating": 4.8,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "210 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/warm_cheese_bread.jpg",
    "imageUrl": "/assets/representative/warm_cheese_bread.jpg"
  },
  {
    "id": 314,
    "name": "Cheese Roll",
    "items": "Golden soft bread roll with melted sweet cheese filling",
    "price": 12,
    "rating": 4.6,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/warm_cheese_bread.jpg",
    "imageUrl": "/assets/representative/warm_cheese_bread.jpg"
  },
  {
    "id": 315,
    "name": "Cheese Streusel",
    "items": "Sweet pastry bun crowned with crumbly cheese and sugar topping",
    "price": 6,
    "rating": 4.5,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery"
    ],
    "available": true,
    "cal": "115 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/warm_cheese_bread.jpg",
    "imageUrl": "/assets/representative/warm_cheese_bread.jpg"
  },
  {
    "id": 316,
    "name": "Bagumbayan (4 pcs)",
    "items": "Pack of 4 traditional crusty sweet bakery bread buns",
    "price": 12,
    "rating": 4.6,
    "stall": "Stall 3 — Bread Stall",
    "zone": "outside",
    "category": "Bread & Pastries",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "220 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/spanish_choco_bread.jpg",
    "imageUrl": "/assets/representative/spanish_choco_bread.jpg"
  },
  {
    "id": 401,
    "name": "Pork Adobo Rice Toppings",
    "items": "Savory simmered pork adobo topped generously over hot rice",
    "price": 50,
    "rating": 4.7,
    "stall": "Stall 4 — Pinoy Food Toppings",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "540 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 402,
    "name": "Pork Menudo Rice Toppings",
    "items": "Tender pork & liver with carrots, potatoes, hot rice plate",
    "price": 50,
    "rating": 4.7,
    "stall": "Stall 4 — Pinoy Food Toppings",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "530 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 403,
    "name": "Bicol Express Rice Toppings",
    "items": "Spicy pork cooked in rich coconut milk and chili peppers over rice",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 4 — Pinoy Food Toppings",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "560 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 501,
    "name": "Chicken Pastel with Egg",
    "items": "Fragrant chicken pastel served with sunny-side fried egg & steamed rice",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "550 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 502,
    "name": "Chicken Pastil without Egg",
    "items": "Shredded spiced chicken kagikit over steaming fragrant rice",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "460 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 503,
    "name": "Chicken Mushroom with Egg",
    "items": "Sauteed chicken in creamy mushroom sauce with fried egg and rice",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "580 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 504,
    "name": "Chicken Mushroom without Egg",
    "items": "Tender sauteed chicken strips in savory creamy mushroom gravy over rice",
    "price": 45,
    "rating": 4.7,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "500 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 505,
    "name": "Binignit",
    "items": "Warm, sweet Visayan coconut milk dessert stew with taro, sago, and bananas",
    "price": 20,
    "rating": 4.8,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Desserts",
    "tags": [
      "snacks",
      "fruits"
    ],
    "available": true,
    "cal": "260 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 506,
    "name": "Pepsi",
    "items": "Chilled cold Pepsi cola drink",
    "price": 18,
    "rating": 4.6,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "150 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 507,
    "name": "Mountain Dew",
    "items": "Citrus cold Mountain Dew soda",
    "price": 18,
    "rating": 4.7,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "170 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 508,
    "name": "Minute Maid",
    "items": "Refreshing chilled orange juice drink",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 509,
    "name": "Yakult",
    "items": "Probiotic fermented milk drink for good digestion",
    "price": 12,
    "rating": 4.8,
    "stall": "Stall 5 — 4J Food Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "50 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 601,
    "name": "Waffle Cheese",
    "items": "Freshly pressed warm golden waffle stuffed with melted cheese",
    "price": 10,
    "rating": 4.6,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Desserts",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "160 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 602,
    "name": "Pancit with Soup",
    "items": "Hot savory stir-fried noodles paired with steaming flavorful broth",
    "price": 25,
    "rating": 4.7,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "320 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_sweet_spaghetti.jpg",
    "imageUrl": "/assets/representative/pinoy_sweet_spaghetti.jpg"
  },
  {
    "id": 603,
    "name": "Coffee Shake",
    "items": "Blended iced coffee shake with rich milk and cream",
    "price": 30,
    "rating": 4.8,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "240 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "12 oz",
        "price": 30
      },
      {
        "label": "16 oz",
        "price": 40
      }
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 604,
    "name": "Mango Shake",
    "items": "Sweet ripe Philippine mango blended with crushed ice and condensed milk",
    "price": 35,
    "rating": 4.9,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "260 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "12 oz",
        "price": 35
      },
      {
        "label": "16 oz",
        "price": 45
      }
    ],
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 605,
    "name": "Buko Shake",
    "items": "Fresh shredded young coconut meat blended ice-cold with milk",
    "price": 30,
    "rating": 4.8,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "230 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "330 mL",
        "price": 30
      },
      {
        "label": "500 mL",
        "price": 40
      }
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 606,
    "name": "Pepsi",
    "items": "Chilled cold Pepsi cola",
    "price": 18,
    "rating": 4.5,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "150 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 607,
    "name": "Mountain Dew",
    "items": "Cold sparkling citrus Mountain Dew",
    "price": 18,
    "rating": 4.6,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "170 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 608,
    "name": "Minute Maid",
    "items": "Ice-cold Minute Maid fruit juice",
    "price": 15,
    "rating": 4.5,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 609,
    "name": "Yakult",
    "items": "Cold cultured milk bottle",
    "price": 12,
    "rating": 4.7,
    "stall": "Stall 6 — R&M Refreshment Stall",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "50 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 701,
    "name": "Koi-Koi",
    "items": "Crispy fried seasoned red hotdog / sausage skewer",
    "price": 17,
    "rating": 4.5,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "190 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 702,
    "name": "Corndog",
    "items": "Golden cornmeal-battered hotdog on a stick with ketchup & mayo",
    "price": 10,
    "rating": 4.6,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 703,
    "name": "Koi-Koi with Corndog",
    "items": "Combo plate of 1 crispy Koi-Koi skewer and 1 Golden Corndog",
    "price": 27,
    "rating": 4.7,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "370 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 704,
    "name": "Koi-Koi with Rice",
    "items": "Crispy savory Koi-Koi served with 1 cup of hot steamed rice",
    "price": 35,
    "rating": 4.7,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "410 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 705,
    "name": "Koi-Koi with Rice and Corndog",
    "items": "Super value meal with Koi-Koi, Golden Corndog, and steamed rice",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "550 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 706,
    "name": "Chicken Teriyaki",
    "items": "Tender glazed chicken cutlets in sweet savory teriyaki sauce with rice",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 707,
    "name": "Chicken Katsu",
    "items": "Crispy panko-breaded Japanese-style chicken cutlet with tonkatsu sauce & rice",
    "price": 48,
    "rating": 4.9,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "540 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 708,
    "name": "Katsu Bun",
    "items": "Crispy chicken katsu patty tucked inside a soft toasted bakery bun with sauce",
    "price": 35,
    "rating": 4.7,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "380 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 709,
    "name": "Penne Arrabbiata",
    "items": "Penne pasta tossed in zesty garlic, tomato, and chili arrabbiata sauce",
    "price": 39,
    "rating": 4.7,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "390 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 710,
    "name": "Pepsi",
    "items": "Ice-cold Pepsi drink",
    "price": 18,
    "rating": 4.5,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "150 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 711,
    "name": "Mountain Dew",
    "items": "Cold Mountain Dew soda",
    "price": 18,
    "rating": 4.6,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "170 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 712,
    "name": "Minute Maid",
    "items": "Chilled Minute Maid juice",
    "price": 15,
    "rating": 4.5,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 713,
    "name": "Yakult",
    "items": "Cold bottle of Yakult probiotic milk",
    "price": 12,
    "rating": 4.7,
    "stall": "Stall 7 — Judah Food 7 & Drinks",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "50 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 801,
    "name": "Squid Roll (4 pcs)",
    "items": "4 pcs crispy deep-fried squid rolls with sweet-spicy dipping sauce",
    "price": 20,
    "rating": 4.6,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "220 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 802,
    "name": "Hash Brown (1 pc)",
    "items": "Golden crunchy fried potato hash brown patty",
    "price": 35,
    "rating": 4.7,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 803,
    "name": "Fish Tofu (3 pcs)",
    "items": "3 pcs tender fried fish tofu cubes with spicy manong sauce",
    "price": 37,
    "rating": 4.7,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "210 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 804,
    "name": "Crab Sticks (3 pcs)",
    "items": "3 pcs savory fried imitation crab sticks with dipping sauce",
    "price": 37,
    "rating": 4.6,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "190 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 805,
    "name": "Homemade Fishball (5 pcs)",
    "items": "5 pcs special homemade street fishballs with sweet chili vinegar",
    "price": 12,
    "rating": 4.7,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "160 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 806,
    "name": "Fishball (5 pcs)",
    "items": "5 pcs classic fried street fishballs skewered with manong sauce",
    "price": 20,
    "rating": 4.6,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "170 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 807,
    "name": "Squid Ball (4 pcs)",
    "items": "4 pcs savory fried squid balls with special brown sauce",
    "price": 18,
    "rating": 4.7,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "190 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 808,
    "name": "Fish Flat (5 pcs)",
    "items": "5 pcs crispy fried fish flat crackers with spicy dip",
    "price": 15,
    "rating": 4.5,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "150 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 809,
    "name": "Kikiam Balls (5 pcs)",
    "items": "5 pcs bite-sized spiced kikiam balls fried golden",
    "price": 20,
    "rating": 4.6,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "210 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 810,
    "name": "Dynamite (1 pc)",
    "items": "Crispy spring roll stuffed with green finger chili and melted cheese",
    "price": 15,
    "rating": 4.9,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/crispy_cheese_sticks.jpg",
    "imageUrl": "/assets/representative/crispy_cheese_sticks.jpg"
  },
  {
    "id": 811,
    "name": "Cheese Sticks (3 pcs)",
    "items": "3 pcs crispy fried spring rolls with melted cheddar cheese",
    "price": 25,
    "rating": 4.7,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/crispy_cheese_sticks.jpg",
    "imageUrl": "/assets/representative/crispy_cheese_sticks.jpg"
  },
  {
    "id": 812,
    "name": "Kikiam (3 pcs)",
    "items": "3 pcs golden fried street kikiam sticks with spicy manong sauce",
    "price": 25,
    "rating": 4.6,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "200 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 813,
    "name": "Tempura (3 pcs)",
    "items": "3 pcs classic street tempura sticks with sweet chili vinegar",
    "price": 25,
    "rating": 4.8,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "210 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 814,
    "name": "Cheese Stick Rolls (4 pcs)",
    "items": "Crunchy fried spring rolls with melted cheese center",
    "price": 10,
    "rating": 4.6,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/crispy_cheese_sticks.jpg",
    "imageUrl": "/assets/representative/crispy_cheese_sticks.jpg"
  },
  {
    "id": 815,
    "name": "Kikiam & Fishball Platter",
    "items": "Combination of savory kikiam slices and golden street fishballs",
    "price": 15,
    "rating": 4.5,
    "stall": "Stall 8A — StreetFood Stall",
    "zone": "outside",
    "category": "Street Food",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "220 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 821,
    "name": "Iced Coffee",
    "items": "Fresh brewed campus iced coffee to keep you energized for class",
    "price": 40,
    "rating": 4.8,
    "stall": "Stall 8B — Juice Bar & Popcorn",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 822,
    "name": "Melon",
    "items": "Fresh sweet melon cooler with shredded cantaloupe and ice",
    "price": 10,
    "rating": 4.7,
    "stall": "Stall 8B — Juice Bar & Popcorn",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "90 kcal",
    "clicks": 0,
    "priceOptions": [
      10,
      15,
      30
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 823,
    "name": "Lemonade",
    "items": "Chilled freshly squeezed sweet lemonade drink",
    "price": 10,
    "rating": 4.8,
    "stall": "Stall 8B — Juice Bar & Popcorn",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "85 kcal",
    "clicks": 0,
    "priceOptions": [
      10,
      15,
      30
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 824,
    "name": "Green Apple",
    "items": "Tangy and sweet ice-cold green apple fruit drink",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 8B — Juice Bar & Popcorn",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "95 kcal",
    "clicks": 0,
    "priceOptions": [
      15,
      30
    ],
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 825,
    "name": "Popcorn",
    "items": "Warm freshly popped popcorn with butter or cheese seasoning",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 8B — Juice Bar & Popcorn",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "priceOptions": [
      15,
      20
    ],
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 826,
    "name": "Fresh Cucumber Lemonade",
    "items": "Chilled fresh cucumber & lemon juice cooler with chia seeds",
    "price": 20,
    "rating": 4.8,
    "stall": "Stall 8B — Juice Bar & Popcorn",
    "zone": "outside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "90 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 901,
    "name": "Watermelon",
    "items": "Cold, hydrating sweet red watermelon wedges in clean cup",
    "price": 25,
    "rating": 4.8,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits"
    ],
    "available": true,
    "cal": "75 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 902,
    "name": "Apple",
    "items": "Crisp sweet fresh sliced apple cup",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits"
    ],
    "available": true,
    "cal": "80 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 903,
    "name": "Mango",
    "items": "Ripe sweet yellow mango cheek slices",
    "price": 25,
    "rating": 4.9,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits"
    ],
    "available": true,
    "cal": "120 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 904,
    "name": "Guava",
    "items": "Crisp fresh bayabas (guava) cuts with salt dip",
    "price": 20,
    "rating": 4.6,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits"
    ],
    "available": true,
    "cal": "60 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 905,
    "name": "Pineapple",
    "items": "Sweet & tangy Bukidnon golden pineapple slices",
    "price": 20,
    "rating": 4.7,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits"
    ],
    "available": true,
    "cal": "80 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 906,
    "name": "Papaya",
    "items": "Sweet soft orange ripe papaya wedges with calamansi",
    "price": 20,
    "rating": 4.5,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits"
    ],
    "available": true,
    "cal": "70 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 907,
    "name": "Banana",
    "items": "1 whole fresh sweet energy banana",
    "price": 5,
    "rating": 4.7,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits",
      "snacks"
    ],
    "available": true,
    "cal": "90 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 908,
    "name": "Empanada",
    "items": "Golden fried savory pastry stuffed with meat and vegetables",
    "price": 15,
    "rating": 4.7,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "220 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 909,
    "name": "Green Mango with Spicy Bagoong",
    "items": "Crunchy sour green mango wedges with savory shrimp paste",
    "price": 25,
    "rating": 5,
    "stall": "Stall 9 — Fresh Fruit Bar",
    "zone": "outside",
    "category": "Fruits",
    "tags": [
      "fruits",
      "snacks"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 1011,
    "name": "Pork Dumpling",
    "items": "Steamed juicy pork dumplings served with savory chili garlic soy dip",
    "price": 25,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Dumplings",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "220 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "3 pcs",
        "price": 25
      },
      {
        "label": "4 pcs",
        "price": 34
      }
    ],
    "representativeImage": "/assets/representative/steamed_dumplings_dimsum.jpg",
    "imageUrl": "/assets/representative/steamed_dumplings_dimsum.jpg"
  },
  {
    "id": 1012,
    "name": "Beef Dumpling",
    "items": "Steamed seasoned beef dumplings with aromatics and soy dip",
    "price": 25,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Dumplings",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "230 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "3 pcs",
        "price": 25
      },
      {
        "label": "4 pcs",
        "price": 34
      }
    ],
    "representativeImage": "/assets/representative/steamed_dumplings_dimsum.jpg",
    "imageUrl": "/assets/representative/steamed_dumplings_dimsum.jpg"
  },
  {
    "id": 1013,
    "name": "Pork Gyoza",
    "items": "Pan-seared crispy Japanese gyoza with minced pork filling",
    "price": 25,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Dumplings",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "240 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "3 pcs",
        "price": 25
      },
      {
        "label": "4 pcs",
        "price": 34
      }
    ],
    "representativeImage": "/assets/representative/steamed_dumplings_dimsum.jpg",
    "imageUrl": "/assets/representative/steamed_dumplings_dimsum.jpg"
  },
  {
    "id": 1014,
    "name": "With Rice + 3 pcs Dumpling",
    "items": "Hot steamed rice paired with 3 pieces of savory dumplings and chili garlic dip",
    "price": 43,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "430 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/steamed_dumplings_dimsum.jpg",
    "imageUrl": "/assets/representative/steamed_dumplings_dimsum.jpg"
  },
  {
    "id": 1015,
    "name": "With Rice + 4 pcs Dumpling",
    "items": "Steamed rice served with 4 pieces of juicy dumplings and chili garlic dip",
    "price": 50,
    "rating": 4.9,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/steamed_dumplings_dimsum.jpg",
    "imageUrl": "/assets/representative/steamed_dumplings_dimsum.jpg"
  },
  {
    "id": 1016,
    "name": "Shawarma",
    "items": "Warm pita wrap loaded with seasoned beef, cabbage, and garlic yogurt sauce",
    "price": 40,
    "rating": 4.7,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "360 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 1017,
    "name": "Ham & Cheese Clubhouse Sandwich / Ham & Egg",
    "items": "Toasted sliced sandwich with sliced ham, cheese, and egg spread",
    "price": 30,
    "rating": 4.6,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "310 kcal",
    "clicks": 0,
    "priceOptions": [
      30,
      35,
      38
    ],
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1018,
    "name": "Steamed Pork with Rice",
    "items": "Tender steamed marinated pork viand served over a bed of warm rice",
    "price": 55,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "520 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1019,
    "name": "Stuffed Shrimp Rice",
    "items": "Crispy fried stuffed shrimp delicacy served with dipping sauce and rice",
    "price": 50,
    "rating": 4.9,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "480 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1020,
    "name": "Coffee Float",
    "items": "Chilled brewed coffee topped with vanilla ice cream and sweet drizzle",
    "price": 39,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "220 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1021,
    "name": "Coke Float",
    "items": "Cold sparkling Coca-Cola topped with a scoop of vanilla ice cream",
    "price": 39,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "210 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1022,
    "name": "Coke 8 oz",
    "items": "Cold 8 oz bottle of Coca-Cola",
    "price": 20,
    "rating": 4.6,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "100 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1023,
    "name": "Vitamilk",
    "items": "Rich creamy soymilk drink in bottle",
    "price": 38,
    "rating": 4.8,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "210 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1024,
    "name": "Juicy Lemon",
    "items": "Chilled zesty lemon juice drink",
    "price": 18,
    "rating": 4.6,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1025,
    "name": "Minute Maid",
    "items": "Cold Minute Maid orange juice",
    "price": 15,
    "rating": 4.5,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1026,
    "name": "Coke Can Regular",
    "items": "Full regular sized aluminum can of Coca-Cola",
    "price": 42,
    "rating": 4.7,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1027,
    "name": "Can Mini",
    "items": "Compact mini aluminum can soda",
    "price": 30,
    "rating": 4.5,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "90 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1028,
    "name": "Yakult",
    "items": "Cold gut-health probiotic milk bottle",
    "price": 15,
    "rating": 4.7,
    "stall": "Stall 10 — Master Dumpling",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "50 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1101,
    "name": "Pad Kra Pao Value Meal",
    "items": "Thai basil stir-fry pork/chicken meal combo with rice, crispy egg, and iced drink",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "580 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1102,
    "name": "Pad Kra Pao with Rice",
    "items": "Authentic Thai holy basil minced meat sauteed with chili and garlic over rice",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1103,
    "name": "Pad Kra Pao with Egg",
    "items": "Thai holy basil stir-fry served with crispy-edged sunny side fried egg",
    "price": 50,
    "rating": 4.9,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "530 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1104,
    "name": "Pad Kra Pao Solo",
    "items": "Solo portion of fragrant spiced Thai basil minced meat viand",
    "price": 40,
    "rating": 4.7,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Other",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "320 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1105,
    "name": "Steamed Rice (Cebu Style) Value Meal",
    "items": "Famous Cebu-style savory pork & shrimp sauce topped over steaming rice + drink",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "560 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1106,
    "name": "Cebu Style with Rice",
    "items": "Cebu-style dimsum meat toppings in rich thick gravy over warm rice",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "480 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1107,
    "name": "Cebu Style with Egg",
    "items": "Cebu-style dimsum steamed viand topped with fresh fried egg",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "520 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1108,
    "name": "Cebu Style Solo",
    "items": "A la carte solo portion of savory Cebu-style dimsum gravy viand",
    "price": 40,
    "rating": 4.7,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Other",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "310 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1109,
    "name": "Pinoy Pancake",
    "items": "Traditional golden Filipino street pancake with margarine and sugar",
    "price": 10,
    "rating": 4.6,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 1110,
    "name": "Japanese Pancake",
    "items": "Thick fluffy Japanese-style soufflé pancake with sweet syrup",
    "price": 35,
    "rating": 4.8,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "260 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 1111,
    "name": "Mac & Cheese with Garlic Bread",
    "items": "Creamy baked macaroni in rich cheddar cheese sauce served with toasted garlic bread",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "460 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_sweet_spaghetti.jpg",
    "imageUrl": "/assets/representative/pinoy_sweet_spaghetti.jpg"
  },
  {
    "id": 1112,
    "name": "Churros (5 pcs)",
    "items": "5 pcs golden fried Spanish churros dusted with cinnamon sugar and chocolate dip",
    "price": 35,
    "rating": 4.9,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "290 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 1113,
    "name": "Macaroni Salad",
    "items": "Sweet and creamy chilled Filipino macaroni salad with raisins and cheese",
    "price": 25,
    "rating": 4.6,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "220 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 1114,
    "name": "Macaroons",
    "items": "Soft chewy coconut macaroons baked to golden perfection",
    "price": 25,
    "rating": 4.7,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "210 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 1115,
    "name": "Coke 8 oz",
    "items": "Cold 8 oz bottle of Coke",
    "price": 20,
    "rating": 4.5,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "100 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1116,
    "name": "Mountain Dew 8 oz",
    "items": "Cold 8 oz bottle of Mountain Dew",
    "price": 20,
    "rating": 4.6,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "115 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1117,
    "name": "Juicy Lemon 8 oz",
    "items": "Chilled 8 oz zesty citrus lemon cooler",
    "price": 18,
    "rating": 4.6,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "100 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1118,
    "name": "Minute Maid (Can)",
    "items": "Canned Minute Maid fruit juice",
    "price": 35,
    "rating": 4.7,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1119,
    "name": "Minute Maid",
    "items": "Chilled Minute Maid juice cup",
    "price": 15,
    "rating": 4.5,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1120,
    "name": "Yakult",
    "items": "Cold probiotic Yakult bottle",
    "price": 12,
    "rating": 4.8,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "50 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1121,
    "name": "Delight",
    "items": "Cultured probiotic dairy drink",
    "price": 15,
    "rating": 4.7,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "65 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1122,
    "name": "Yogurt",
    "items": "Creamy chilled fruit yogurt cup",
    "price": 35,
    "rating": 4.8,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "130 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1123,
    "name": "Crispy Chicken Skin (Solo Pack)",
    "items": "Crunchy golden fried chicken skin seasoned with vinegar & chili powder",
    "price": 30,
    "rating": 4.9,
    "stall": "Stall 11 — Deeyang by: Pops Dessert",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "350 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/chicken_skin_rice.jpg",
    "imageUrl": "/assets/representative/chicken_skin_rice.jpg"
  },
  {
    "id": 1201,
    "name": "Chaofan",
    "items": "Savory Chinese wok-fried rice with bits of meat, eggs, and spring onions",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1202,
    "name": "Beefloaf with Rice",
    "items": "Pan-fried savory beefloaf slices served over 1 cup warm steamed rice",
    "price": 45,
    "rating": 4.7,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "460 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1203,
    "name": "Beefloaf",
    "items": "Solo portion of pan-seared seasoned beefloaf",
    "price": 7,
    "rating": 4.5,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Other",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1204,
    "name": "Chicken Ham",
    "items": "Savory pan-fried chicken ham slice",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Other",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "130 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1205,
    "name": "Chicken Neck",
    "items": "Crispy deep-fried seasoned chicken neck street snack",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Other",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1206,
    "name": "Sweet & Sour Chicken",
    "items": "Crispy chicken chunks glazed in tangy sweet-and-sour sauce with pineapple and peppers",
    "price": 60,
    "rating": 4.9,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "540 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1207,
    "name": "Chicken Shawarma",
    "items": "Spiced chicken slices wrapped in soft pita bread with garlic sauce and fresh veggies",
    "price": 70,
    "rating": 4.8,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "480 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 1208,
    "name": "Chicken Lollipop with Rice",
    "items": "Frenched chicken wing lollipop fried crisp with dipping sauce and rice",
    "price": 55,
    "rating": 4.8,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "520 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1209,
    "name": "Chicken Skin with Rice",
    "items": "Heaping portion of super crunchy fried chicken skin paired with steaming rice",
    "price": 60,
    "rating": 4.9,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "610 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/chicken_skin_rice.jpg",
    "imageUrl": "/assets/representative/chicken_skin_rice.jpg"
  },
  {
    "id": 1210,
    "name": "Chicken Soupack with Rice",
    "items": "Hearty seasoned chicken stew soup packed with flavor and warm rice",
    "price": 70,
    "rating": 4.8,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "540 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1211,
    "name": "Chicken Strips with Rice",
    "items": "Golden breaded tender chicken breast strips with homemade gravy and rice",
    "price": 60,
    "rating": 4.8,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "510 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1212,
    "name": "Gulaman District Drinks",
    "items": "Signature ice-cold thirst quenchers. Select your size and favorite flavor before adding!",
    "price": 10,
    "rating": 4.9,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "120 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "Small",
        "price": 10
      },
      {
        "label": "Medium",
        "price": 15
      },
      {
        "label": "Large",
        "price": 20
      },
      {
        "label": "Extra Large",
        "price": 40
      }
    ],
    "flavorOptions": [
      "Blue Lemonade",
      "Lemon",
      "Cucumber",
      "Chocolate"
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1213,
    "name": "Lumpiang Shanghai (4 pcs) + Rice",
    "items": "Crispy pork spring rolls with sweet chili sauce & hot rice",
    "price": 45,
    "rating": 4.8,
    "stall": "Stall 12 — Gulaman District",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1301,
    "name": "Chicken Sisig",
    "items": "Sizzling minced savory chicken tossed with onions, chili, and calamansi over rice",
    "price": 50,
    "rating": 4.9,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "510 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/filipino_sisig_rice.jpg",
    "imageUrl": "/assets/representative/filipino_sisig_rice.jpg"
  },
  {
    "id": 1302,
    "name": "Hotdog with Egg",
    "items": "Tender red hotdog served with sunny-side fried egg and 1 cup rice",
    "price": 55,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1303,
    "name": "Burger Steak",
    "items": "Juicy beef patty smothered in rich mushroom pepper gravy with rice",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "520 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1304,
    "name": "Hotdog",
    "items": "Classic fried red hotdog viand with rice",
    "price": 40,
    "rating": 4.6,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Other",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "410 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1305,
    "name": "Pork Sisig",
    "items": "Crispy seasoned chopped pork viand with onions, spices, and steamed rice",
    "price": 50,
    "rating": 4.9,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "550 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/filipino_sisig_rice.jpg",
    "imageUrl": "/assets/representative/filipino_sisig_rice.jpg"
  },
  {
    "id": 1306,
    "name": "Adobong Chicken Liver and Egg",
    "items": "Savory simmered adobo chicken liver paired with fried egg and rice",
    "price": 55,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "480 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1307,
    "name": "Corned Beef",
    "items": "Sauteed savory corned beef with onions and garlic over warm rice",
    "price": 50,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "460 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/filipino_sisig_rice.jpg",
    "imageUrl": "/assets/representative/filipino_sisig_rice.jpg"
  },
  {
    "id": 1308,
    "name": "Sardines with Egg",
    "items": "Rich spiced sardines in tomato sauce sauteed with egg over rice",
    "price": 40,
    "rating": 4.6,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "420 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1309,
    "name": "Embutido",
    "items": "Steamed and pan-seared Filipino meatloaf roll served with rice",
    "price": 50,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "470 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1310,
    "name": "Luncheon Meat with Egg",
    "items": "Crispy pan-fried luncheon meat slices with sunny-side fried egg and rice",
    "price": 55,
    "rating": 4.8,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "530 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/filipino_sisig_rice.jpg",
    "imageUrl": "/assets/representative/filipino_sisig_rice.jpg"
  },
  {
    "id": 1311,
    "name": "Hotdog in a Bun with Cheese",
    "items": "Toasted hotdog sandwich bun with melted cheese sauce and ketchup",
    "price": 40,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "320 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 1312,
    "name": "Hotdog in a Bun",
    "items": "Classic hotdog sandwich in soft toasted bun with mayo & ketchup",
    "price": 30,
    "rating": 4.6,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "280 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_streetfood_skewers.jpg",
    "imageUrl": "/assets/representative/pinoy_streetfood_skewers.jpg"
  },
  {
    "id": 1313,
    "name": "Pancit Canton in a Bun",
    "items": "Carb-loaded student favorite! Savory Pancit Canton stuffed in warm bakery bun",
    "price": 38,
    "rating": 4.8,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "390 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_sweet_spaghetti.jpg",
    "imageUrl": "/assets/representative/pinoy_sweet_spaghetti.jpg"
  },
  {
    "id": 1314,
    "name": "Pancit Canton",
    "items": "Plate of hot savory stir-fried instant noodles with calamansi and spices",
    "price": 28,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "310 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_sweet_spaghetti.jpg",
    "imageUrl": "/assets/representative/pinoy_sweet_spaghetti.jpg"
  },
  {
    "id": 1315,
    "name": "Sweet Orange Juice",
    "items": "Chilled fresh sweet citrus orange cooler in cup",
    "price": 10,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "110 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "Small",
        "price": 10
      },
      {
        "label": "Medium",
        "price": 15
      },
      {
        "label": "Large",
        "price": 25
      }
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1316,
    "name": "Fruit Salad",
    "items": "Chilled sweet fruit cocktail salad with condensed milk and cream",
    "price": 20,
    "rating": 4.9,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "snacks",
      "fruits"
    ],
    "available": true,
    "cal": "240 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "Small",
        "price": 20
      },
      {
        "label": "Medium",
        "price": 30
      },
      {
        "label": "Large",
        "price": 50
      }
    ],
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 1317,
    "name": "Mini Glazed Donuts (Box of 4)",
    "items": "Fresh mini donuts dusted with cinnamon sugar, chocolate & cheese",
    "price": 35,
    "rating": 4.9,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "320 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 1318,
    "name": "Mini Glazed Donuts (Box of 6 Sharing)",
    "items": "6 pieces of assorted mini specialty glazed donuts",
    "price": 50,
    "rating": 4.9,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "480 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 1319,
    "name": "Crispy Chicken Fillet Burger",
    "items": "Breaded chicken fillet topped with creamy mayo and lettuce",
    "price": 40,
    "rating": 4.7,
    "stall": "Stall 13 — Val's FoodHub",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "390 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1401,
    "name": "Chicken Skin Rice Meal",
    "items": "1 cup plain rice + crispy seasoned chicken skin",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 14 — Shamir Food Houz",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "480 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/chicken_skin_rice.jpg",
    "imageUrl": "/assets/representative/chicken_skin_rice.jpg"
  },
  {
    "id": 1402,
    "name": "Chicken Skin Sulit Combo",
    "items": "1 cup plain rice + crispy chicken skin + choice of 1 add-on (2 pcs Lumpia or 1 pc Ham)",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 14 — Shamir Food Houz",
    "zone": "inside",
    "category": "Rice Meals",
    "flavorOptions": [
      "Option A: + 2 pcs Lumpia",
      "Option B: + 1 pc Ham"
    ],
    "tags": [
      "rice",
      "snacks"
    ],
    "available": true,
    "cal": "560 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/chicken_skin_combo.jpg",
    "imageUrl": "/assets/representative/chicken_skin_combo.jpg"
  },
  {
    "id": 1403,
    "name": "Pork Chop Rice Meal",
    "items": "1 cup plain rice + 1 pan-fried pork chop",
    "price": 60,
    "rating": 4.8,
    "stall": "Stall 14 — Shamir Food Houz",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "520 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1404,
    "name": "Sweet-Style Pinoy Spaghetti",
    "items": "1 solo serving pasta with savory red meat sauce",
    "price": 28,
    "rating": 4.7,
    "stall": "Stall 14 — Shamir Food Houz",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "310 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pinoy_sweet_spaghetti.jpg",
    "imageUrl": "/assets/representative/pinoy_sweet_spaghetti.jpg"
  },
  {
    "id": 1405,
    "name": "Cheese Stick",
    "items": "Crispy deep-fried spring roll wrapper filled with savory melted cheese",
    "price": 20,
    "rating": 4.6,
    "stall": "Stall 14 — Shamir Food Houz",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "180 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/crispy_cheese_sticks.jpg",
    "imageUrl": "/assets/representative/crispy_cheese_sticks.jpg"
  },
  {
    "id": 1501,
    "name": "Macdow Fillet Rice Topping",
    "items": "Crispy breaded chicken fillet served over warm steaming rice",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "À la Carte",
        "price": 50
      },
      {
        "label": "With Soft Drink",
        "price": 65
      }
    ],
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1502,
    "name": "Jolly Longganisa Rice Topping",
    "items": "Sweet savory Filipino pork sausage links over hot rice",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "520 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "À la Carte",
        "price": 50
      },
      {
        "label": "With Soft Drink",
        "price": 65
      }
    ],
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1503,
    "name": "Dimsum Siomai Rice Topping",
    "items": "Steamed seasoned dimsum siomai dumplings with chili garlic dip over rice",
    "price": 50,
    "rating": 4.7,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "470 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "À la Carte",
        "price": 50
      },
      {
        "label": "With Soft Drink",
        "price": 65
      }
    ],
    "representativeImage": "/assets/representative/java_rice_siomai.jpg",
    "imageUrl": "/assets/representative/java_rice_siomai.jpg"
  },
  {
    "id": 1504,
    "name": "Chorizo de Cebu Rice Topping",
    "items": "Spiced sweet-cured Cebuano chorizo sausage browned and served with rice",
    "price": 50,
    "rating": 4.9,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "540 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "À la Carte",
        "price": 50
      },
      {
        "label": "With Soft Drink",
        "price": 65
      }
    ],
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1505,
    "name": "Spam Rice Topping",
    "items": "Golden pan-fried classic Spam luncheon meat slices served over rice",
    "price": 50,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "510 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "À la Carte",
        "price": 50
      },
      {
        "label": "With Soft Drink",
        "price": 65
      }
    ],
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1506,
    "name": "Beefloaf Rice Topping",
    "items": "Seasoned pan-seared beefloaf slices served over warm steamed rice",
    "price": 50,
    "rating": 4.7,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "480 kcal",
    "clicks": 0,
    "sizeOptions": [
      {
        "label": "À la Carte",
        "price": 50
      },
      {
        "label": "With Soft Drink",
        "price": 65
      }
    ],
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1507,
    "name": "Homemade Longganisa Rice Topping",
    "items": "Special artisanal garlic homemade longganisa links with rice",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "530 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1508,
    "name": "Premium Tocino Rice Topping",
    "items": "Sweet-cured tender pork tocino caramelized to perfection with rice",
    "price": 55,
    "rating": 4.9,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "550 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/pork_chop_rice.jpg",
    "imageUrl": "/assets/representative/pork_chop_rice.jpg"
  },
  {
    "id": 1509,
    "name": "Chicken Cheese Rice Topping",
    "items": "Tender chicken cutlet topped with rich creamy melted cheese sauce over rice",
    "price": 55,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Rice Meals",
    "tags": [
      "rice"
    ],
    "available": true,
    "cal": "560 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1510,
    "name": "Macdow Chicken Burger",
    "items": "Crispy chicken burger in toasted bun with special house dressing",
    "price": 40,
    "rating": 4.7,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "380 kcal",
    "clicks": 0,
    "priceOptions": [
      40,
      55
    ],
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1511,
    "name": "Beef Burger",
    "items": "Grilled beef patty in soft burger bun with dressing and lettuce",
    "price": 25,
    "rating": 4.6,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks",
      "bakery"
    ],
    "available": true,
    "cal": "310 kcal",
    "clicks": 0,
    "priceOptions": [
      25,
      40
    ],
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1512,
    "name": "Dimsum Special",
    "items": "Steamed assorted dimsum dumplings with garlic chili dipping sauce",
    "price": 30,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Dumplings",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "240 kcal",
    "clicks": 0,
    "priceOptions": [
      30,
      35,
      45,
      50
    ],
    "representativeImage": "/assets/representative/flavored_wings_rice.jpg",
    "imageUrl": "/assets/representative/flavored_wings_rice.jpg"
  },
  {
    "id": 1513,
    "name": "Siopao",
    "items": "Steamed soft fluffy siopao bun filled with savory meat and special sauce",
    "price": 25,
    "rating": 4.7,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "280 kcal",
    "clicks": 0,
    "priceOptions": [
      25,
      40
    ],
    "representativeImage": "/assets/representative/steamed_dumplings_dimsum.jpg",
    "imageUrl": "/assets/representative/steamed_dumplings_dimsum.jpg"
  },
  {
    "id": 1514,
    "name": "AlaJcow Donut",
    "items": "Sweet glazed specialty ring donut with toppings",
    "price": 20,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Desserts",
    "tags": [
      "bakery",
      "snacks"
    ],
    "available": true,
    "cal": "250 kcal",
    "clicks": 0,
    "priceOptions": [
      20,
      35
    ],
    "representativeImage": "/assets/representative/classic_ensaymada.jpg",
    "imageUrl": "/assets/representative/classic_ensaymada.jpg"
  },
  {
    "id": 1515,
    "name": "Crispy Fries",
    "items": "Golden deep-fried potato french fries served hot with salt or cheese flavor",
    "price": 40,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "340 kcal",
    "clicks": 0,
    "priceOptions": [
      40,
      55
    ],
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1516,
    "name": "Combo Burger Patty with Fries",
    "items": "Seasoned burger patty served alongside a portion of hot crispy fries",
    "price": 55,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "490 kcal",
    "clicks": 0,
    "priceOptions": [
      55,
      70
    ],
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1517,
    "name": "Combo Mcdow Chicken Fillet with Fries",
    "items": "Crispy breaded chicken fillet served together with crispy french fries",
    "price": 60,
    "rating": 4.9,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Snacks",
    "tags": [
      "snacks"
    ],
    "available": true,
    "cal": "530 kcal",
    "clicks": 0,
    "priceOptions": [
      60,
      75
    ],
    "representativeImage": "/assets/representative/crispy_burger_fries.jpg",
    "imageUrl": "/assets/representative/crispy_burger_fries.jpg"
  },
  {
    "id": 1518,
    "name": "Fruit Soda",
    "items": "Fizzy sparkling soda infused with refreshing natural fruit syrups",
    "price": 25,
    "rating": 4.7,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks",
      "fruits"
    ],
    "available": true,
    "cal": "130 kcal",
    "clicks": 0,
    "priceOptions": [
      25,
      30,
      40
    ],
    "representativeImage": "/assets/representative/fresh_fruits_bar.jpg",
    "imageUrl": "/assets/representative/fresh_fruits_bar.jpg"
  },
  {
    "id": 1519,
    "name": "Iced Coffee",
    "items": "Chilled cold brewed coffee with cream and sweetener",
    "price": 25,
    "rating": 4.8,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "150 kcal",
    "clicks": 0,
    "priceOptions": [
      25,
      35,
      45
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1520,
    "name": "Soft Drinks",
    "items": "Cold canned / bottled soft drinks",
    "price": 15,
    "rating": 4.6,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "140 kcal",
    "clicks": 0,
    "priceOptions": [
      15,
      25,
      30
    ],
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  },
  {
    "id": 1521,
    "name": "Glass-Bottled Water",
    "items": "Premium chilled purified mineral drinking water in glass bottle",
    "price": 45,
    "rating": 4.7,
    "stall": "Stall 15 — France Bistro",
    "zone": "inside",
    "category": "Drinks",
    "tags": [
      "drinks"
    ],
    "available": true,
    "cal": "0 kcal",
    "clicks": 0,
    "representativeImage": "/assets/representative/iced_gulaman_cooler.jpg",
    "imageUrl": "/assets/representative/iced_gulaman_cooler.jpg"
  }
];

export function getAddonsForDish(item: DishItem): AddonOption[] {
  if (item.stall.toLowerCase().includes("deeyang")) {
    return [
      { name: "Plain Rice", price: 15, icon: "🍚" },
      { name: "Garlic Rice", price: 20, icon: "🍚" },
      { name: "Egg", price: 15, icon: "🍳" }
    ];
  } else if (item.category === 'Rice Meals') {
    return [
      { name: "Extra Cup of Steamed Rice", price: 15, icon: "🍚" },
      { name: "Sunny-Side Fried Egg (Itlog)", price: 15, icon: "🍳" },
      { name: "Cold Gulaman Cooler (12oz)", price: 15, icon: "🥤" },
      { name: "Spicy Garlic Crunch Chili Oil", price: 5, icon: "🌶️" }
    ];
  } else if (item.category === 'Fruits') {
    return [
      { name: "Extra Spicy Bagoong Dip", price: 5, icon: "🦐" },
      { name: "Rock Salt & Chili Powder", price: 3, icon: "🧂" }
    ];
  } else if (item.stall.toLowerCase().includes("swirly") || item.stall.toLowerCase().includes("ice cream") || item.name.toLowerCase().includes("ice cream")) {
    return [
      { name: "Crushed Oreo Topping", price: 5, icon: "🍪" },
      { name: "Rainbow Sprinkles", price: 5, icon: "✨" },
      { name: "Choco Hot Fudge Swirl", price: 5, icon: "🍫" }
    ];
  } else {
    return [
      { name: "Cold Bottled Mineral Water", price: 15, icon: "💧" },
      { name: "Extra Cheese Drizzle / Sauce", price: 5, icon: "🧀" }
    ];
  }
}
