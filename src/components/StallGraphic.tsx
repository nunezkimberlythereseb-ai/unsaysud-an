import React from 'react';

export type StallId =
  | 'stall_1'   // Swirly Bits
  | 'stall_2'   // Java Rice
  | 'stall_3'   // Bread Stall
  | 'stall_4'   // Pinoy Food Toppings
  | 'stall_5'   // 4J Food Stall
  | 'stall_6'   // R&M Refreshment Stall
  | 'stall_7'   // Judah Food 7 & Drinks
  | 'stall_8a'  // StreetFood Stall
  | 'stall_8b'  // Juice Bar & Popcorn
  | 'stall_9'   // Fresh Fruit Bar
  | 'stall_10'  // Master Dumpling
  | 'stall_11'  // Deeyang by: Pops Dessert
  | 'stall_12'  // Gulaman District
  | 'stall_13'  // Val's FoodHub
  | 'stall_14'  // Shamir Food Houz
  | 'stall_15'; // France Bistro

/**
 * Resolves a stall name string into the standard StallId
 */
export function getStallId(stallName: string): StallId {
  const s = stallName.toLowerCase();
  
  if (s.includes('swirly') || s.includes('stall 1 ') || s.startsWith('stall 1—') || s.startsWith('stall 1 -')) return 'stall_1';
  if (s.includes('java rice') || s.includes('stall 2')) return 'stall_2';
  if (s.includes('bread') || s.includes('bakery') || s.includes('stall 3')) return 'stall_3';
  if (s.includes('pinoy') || s.includes('stall 4')) return 'stall_4';
  if (s.includes('4j') || s.includes('pastil') || s.includes('stall 5')) return 'stall_5';
  if (s.includes('r&m') || s.includes('refreshment') || s.includes('stall 6')) return 'stall_6';
  if (s.includes('judah') || s.includes('stall 7')) return 'stall_7';
  if (s.includes('8a') || (s.includes('streetfood') && !s.includes('8b'))) return 'stall_8a';
  if (s.includes('8b') || s.includes('popcorn') || (s.includes('juice bar') && !s.includes('fruit bar'))) return 'stall_8b';
  if (s.includes('fruit bar') || s.includes('stall 9')) return 'stall_9';
  if (s.includes('master dumpling') || s.includes('dumpling') || s.includes('stall 10')) return 'stall_10';
  if (s.includes('deeyang') || s.includes('pops dessert') || s.includes('stall 11')) return 'stall_11';
  if (s.includes('gulaman') || s.includes('district') || s.includes('stall 12')) return 'stall_12';
  if (s.includes('val') || s.includes('foodhub') || s.includes('stall 13')) return 'stall_13';
  if (s.includes('shamir') || s.includes('stall 14')) return 'stall_14';
  if (s.includes('france') || s.includes('bistro') || s.includes('stall 15')) return 'stall_15';

  return 'stall_14'; // Generic cafeteria food booth fallback
}

export interface StallGraphicProps {
  stallName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withBackground?: boolean;
}

export const StallGraphic: React.FC<StallGraphicProps> = ({
  stallName,
  size = 'md',
  className = '',
  withBackground = true
}) => {
  const stallId = getStallId(stallName);

  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12 sm:w-14 sm:h-14',
    lg: 'w-16 h-16 sm:w-20 sm:h-20',
    xl: 'w-24 h-24 sm:w-28 sm:h-28'
  };

  const bgStyles: Record<StallId, { bg: string; border: string; accent: string }> = {
    stall_1:  { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-600' },
    stall_2:  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-600' },
    stall_3:  { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700' },
    stall_4:  { bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-700' },
    stall_5:  { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-700' },
    stall_6:  { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-600' },
    stall_7:  { bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'text-indigo-600' },
    stall_8a: { bg: 'bg-amber-50', border: 'border-amber-300', accent: 'text-amber-700' },
    stall_8b: { bg: 'bg-yellow-50', border: 'border-yellow-200', accent: 'text-yellow-700' },
    stall_9:  { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-600' },
    stall_10: { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'text-orange-700' },
    stall_11: { bg: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-600' },
    stall_12: { bg: 'bg-teal-50', border: 'border-teal-200', accent: 'text-teal-600' },
    stall_13: { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-800' },
    stall_14: { bg: 'bg-stone-50', border: 'border-stone-200', accent: 'text-stone-700' },
    stall_15: { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700' }
  };

  const currentTheme = bgStyles[stallId] || bgStyles.stall_14;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 transition-transform ${
        withBackground
          ? `rounded-2xl border ${currentTheme.bg} ${currentTheme.border} p-1.5 shadow-2xs`
          : ''
      } ${sizeMap[size]} ${className}`}
      title={stallName}
    >
      <div className="w-full h-full flex items-center justify-center">
        {renderStallIllustration(stallId)}
      </div>
    </div>
  );
};

/**
 * Clean, cute, modern digital vector illustrations for each stall
 * Standardized 64x64 viewBox with vibrant flat/semi-flat styling
 */
function renderStallIllustration(id: StallId) {
  switch (id) {
    // Stall 1 — Swirly Bits: Swirly soft-serve cone, waffle crisp & sprinkles
    case 'stall_1':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Soft background glow */}
          <circle cx="32" cy="32" r="28" fill="#FFE4E6" fillOpacity="0.6" />
          {/* Waffle cone */}
          <polygon points="22,34 42,34 32,58" fill="#FBBF24" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
          {/* Cone crosshatch lines */}
          <line x1="26" y1="39" x2="38" y2="39" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="29" y1="46" x2="35" y2="46" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
          {/* Ice cream swirl bottom */}
          <path d="M18,34 C18,30 24,30 32,30 C40,30 46,30 46,34 C46,37 40,38 32,38 C24,38 18,37 18,34 Z" fill="#FDA4AF" stroke="#E11D48" strokeWidth="2" />
          {/* Middle swirl */}
          <path d="M21,30 C21,24 26,24 32,24 C38,24 43,24 43,30 C43,32 38,33 32,33 C26,33 21,32 21,30 Z" fill="#FFF1F2" stroke="#E11D48" strokeWidth="2" />
          {/* Top swirl peak */}
          <path d="M25,24 C25,18 29,15 32,12 C35,16 39,18 39,24 C39,26 35,27 32,27 C29,27 25,26 25,24 Z" fill="#FB7185" stroke="#E11D48" strokeWidth="2" />
          {/* Sprinkle accents */}
          <circle cx="28" cy="22" r="1.5" fill="#3B82F6" />
          <circle cx="35" cy="20" r="1.5" fill="#F59E0B" />
          <circle cx="31" cy="28" r="1.5" fill="#10B981" />
        </svg>
      );

    // Stall 2 — Java Rice: Plate of yellow java rice with rolled siomai & chili dip
    case 'stall_2':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Background circle */}
          <circle cx="32" cy="32" r="28" fill="#FEF3C7" fillOpacity="0.6" />
          {/* Plate */}
          <ellipse cx="32" cy="42" rx="26" ry="11" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="2" />
          <ellipse cx="32" cy="41" rx="22" ry="8" fill="#F3F4F6" />
          {/* Java rice mound (vibrant yellow-orange) */}
          <path d="M16,40 C16,28 23,22 32,22 C41,22 48,28 48,40 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
          {/* Garlic bits & seasoning texture on rice */}
          <circle cx="28" cy="29" r="1.2" fill="#B45309" />
          <circle cx="34" cy="27" r="1.2" fill="#B45309" />
          <circle cx="38" cy="33" r="1.2" fill="#B45309" />
          <circle cx="24" cy="35" r="1.2" fill="#B45309" />
          {/* Dumpling / Siomai on side */}
          <path d="M38,36 C38,31 43,30 46,30 C49,30 53,31 53,36 C53,39 50,42 46,42 C41,42 38,39 38,36 Z" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.8" />
          <circle cx="46" cy="33" r="1.2" fill="#DC2626" />
          {/* Chili garlic drop */}
          <circle cx="18" cy="40" r="3" fill="#DC2626" stroke="#991B1B" strokeWidth="1.2" />
        </svg>
      );

    // Stall 3 — Bread Stall: Warm bread loaf, croissant/ensaymada & pastry
    case 'stall_3':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FFEDD5" fillOpacity="0.6" />
          {/* Loaf of bread */}
          <path d="M12,40 C12,30 18,24 32,24 C46,24 52,30 52,40 C52,47 46,48 32,48 C18,48 12,47 12,40 Z" fill="#FDBA74" stroke="#C2410C" strokeWidth="2" />
          {/* Score cuts on loaf */}
          <path d="M22,27 C24,31 25,37 25,41" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          <path d="M32,26 C33,31 33,37 33,42" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          <path d="M42,27 C40,31 39,37 39,41" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          {/* Ensaymada swirl on top left */}
          <ellipse cx="22" cy="22" rx="7" ry="5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="22" cy="22" r="2" fill="#FACC15" />
          {/* Butter pat */}
          <rect x="36" y="18" width="6" height="4" rx="1.5" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />
        </svg>
      );

    // Stall 4 — Pinoy Food Toppings: Savory meat toppings over rice bowl with fried egg
    case 'stall_4':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FEE2E2" fillOpacity="0.6" />
          {/* Food Bowl */}
          <path d="M14,32 C14,46 22,54 32,54 C42,54 50,46 50,32 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
          {/* Bowl foot */}
          <rect x="25" y="54" width="14" height="3" rx="1" fill="#991B1B" />
          {/* Fluffy white rice bed */}
          <ellipse cx="32" cy="32" rx="18" ry="7" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1.5" />
          {/* Savory Filipino meat topping cubes */}
          <rect x="20" y="27" width="7" height="6" rx="1.5" fill="#92400E" stroke="#78350F" strokeWidth="1" />
          <rect x="26" y="29" width="6" height="5" rx="1.5" fill="#B45309" stroke="#78350F" strokeWidth="1" />
          {/* Sunny side up egg topping */}
          <ellipse cx="37" cy="28" rx="8" ry="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
          <circle cx="37" cy="28" r="3.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
          {/* Steam curls */}
          <path d="M28,18 C28,14 30,12 30,8" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
          <path d="M35,19 C35,15 37,13 37,9" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );

    // Stall 5 — 4J Food Stall: Chicken Pastil / Pastel comfort food wrapped leaf/bowl
    case 'stall_5':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#D1FAE5" fillOpacity="0.6" />
          {/* Banana leaf wrap base */}
          <ellipse cx="32" cy="42" rx="24" ry="10" fill="#10B981" stroke="#047857" strokeWidth="2" />
          {/* Rice mound */}
          <path d="M18,40 C18,30 24,24 32,24 C40,24 46,30 46,40 Z" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="2" />
          {/* Shredded chicken pastil topping (savory brown) */}
          <path d="M24,28 C26,25 38,25 40,28 C37,31 27,31 24,28 Z" fill="#92400E" stroke="#78350F" strokeWidth="1.5" />
          {/* Boiled egg slice */}
          <ellipse cx="32" cy="34" rx="6" ry="4.5" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
          <circle cx="32" cy="34" r="2.5" fill="#F59E0B" />
          {/* Leaf vein line */}
          <path d="M12,44 C22,41 42,41 52,44" stroke="#065F46" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    // Stall 6 — R&M Refreshment Stall: Frosty fruit shake cup with whipped swirl & straw
    case 'stall_6':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#F3E8FF" fillOpacity="0.6" />
          {/* Clear shake cup */}
          <polygon points="20,26 44,26 40,54 24,54" fill="#E9D5FF" stroke="#9333EA" strokeWidth="2" strokeLinejoin="round" />
          {/* Shake drink fill */}
          <polygon points="22,30 42,30 39,52 25,52" fill="#C084FC" />
          {/* Cup rim */}
          <rect x="18" y="24" width="28" height="4" rx="2" fill="#FFFFFF" stroke="#9333EA" strokeWidth="1.8" />
          {/* Whipped cream dome */}
          <path d="M22,24 C22,17 26,14 32,14 C38,14 42,17 42,24 Z" fill="#FAF5FF" stroke="#9333EA" strokeWidth="1.8" />
          {/* Striped straw */}
          <rect x="36" y="6" width="4" height="22" rx="1.5" transform="rotate(15 36 6)" fill="#F43F5E" stroke="#BE123C" strokeWidth="1.2" />
          {/* Cherry on top */}
          <circle cx="28" cy="14" r="3.5" fill="#E11D48" stroke="#9F1239" strokeWidth="1" />
          {/* Fruit slice garnish */}
          <circle cx="42" cy="24" r="3" fill="#FBBF24" />
        </svg>
      );

    // Stall 7 — Judah Food 7 & Drinks: Chicken Katsu / Teriyaki Rice Meal + Soda cup
    case 'stall_7':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#E0E7FF" fillOpacity="0.6" />
          {/* Bento box tray */}
          <rect x="10" y="26" width="34" height="26" rx="4" fill="#4338CA" stroke="#312E81" strokeWidth="2" />
          {/* Rice portion in bento */}
          <ellipse cx="20" cy="38" rx="7" ry="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <circle cx="20" cy="38" r="1.5" fill="#EF4444" />
          {/* Sliced chicken katsu with sauce */}
          <rect x="29" y="32" width="12" height="4" rx="1" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <rect x="29" y="38" width="12" height="4" rx="1" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          <rect x="29" y="44" width="12" height="4" rx="1" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          {/* Drink cup on the right */}
          <polygon points="46,24 56,24 54,48 48,48" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
          <line x1="51" y1="16" x2="51" y2="24" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // Stall 8A — StreetFood Stall: Street food skewers (fishballs, tempura, squid roll)
    case 'stall_8a':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FEF3C7" fillOpacity="0.6" />
          {/* Skewer stick 1 */}
          <line x1="16" y1="54" x2="30" y2="12" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
          {/* Skewer stick 2 */}
          <line x1="48" y1="54" x2="34" y2="12" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
          {/* Fishballs on stick 1 (golden spheres) */}
          <circle cx="27" cy="20" r="5.5" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="24" cy="30" r="5.5" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="20" cy="40" r="5.5" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          {/* Kikiam / Tempura on stick 2 (golden oblongs) */}
          <rect x="33" y="16" width="10" height="9" rx="3.5" transform="rotate(-15 38 20)" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />
          <rect x="36" y="27" width="10" height="9" rx="3.5" transform="rotate(-15 41 31)" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />
          {/* Sweet & spicy sauce dipping jar */}
          <rect x="26" y="44" width="12" height="12" rx="2" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
          <ellipse cx="32" cy="44" rx="6" ry="2" fill="#EF4444" />
        </svg>
      );

    // Stall 8B — Juice Bar & Popcorn: Red/white striped popcorn box & juice cup
    case 'stall_8b':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FEF9C3" fillOpacity="0.6" />
          {/* Popcorn box base */}
          <polygon points="14,32 34,32 31,56 17,56" fill="#DC2626" stroke="#991B1B" strokeWidth="2" strokeLinejoin="round" />
          {/* White stripes on box */}
          <polygon points="18,32 22,32 21,56 19,56" fill="#FFFFFF" />
          <polygon points="26,32 30,32 29,56 27,56" fill="#FFFFFF" />
          {/* Puffy popcorn top */}
          <circle cx="18" cy="28" r="4.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="24" cy="25" r="5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="30" cy="28" r="4.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
          {/* Fresh juice cup on right */}
          <polygon points="38,26 52,26 49,52 41,52" fill="#84CC16" stroke="#4D7C0F" strokeWidth="1.8" />
          <ellipse cx="45" cy="26" rx="7" ry="2" fill="#A3E635" />
          {/* Straw */}
          <line x1="45" y1="16" x2="45" y2="26" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
          {/* Lemon/Melon slice on cup */}
          <circle cx="51" cy="26" r="3" fill="#FACC15" />
        </svg>
      );

    // Stall 9 — Fresh Fruit Bar: Watermelon wedge, mango & pineapple slices
    case 'stall_9':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#DCFCE7" fillOpacity="0.6" />
          {/* Watermelon wedge */}
          <path d="M12,42 C12,42 22,54 38,50 L32,24 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
          {/* Green watermelon rind */}
          <path d="M12,42 C12,42 22,54 38,50" stroke="#15803D" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          {/* Watermelon seeds */}
          <circle cx="26" cy="38" r="1.2" fill="#18181B" />
          <circle cx="30" cy="42" r="1.2" fill="#18181B" />
          <circle cx="24" cy="44" r="1.2" fill="#18181B" />
          {/* Sweet ripe mango slice */}
          <path d="M30,22 C36,14 48,16 52,24 C54,30 48,36 38,34 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.8" />
          {/* Pineapple tropical leaf garnish */}
          <path d="M46,12 C48,8 52,6 54,6 C52,10 50,14 48,16" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // Stall 10 — Master Dumpling: Bamboo steamer with plump dumplings & soy sauce
    case 'stall_10':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FFEDD5" fillOpacity="0.6" />
          {/* Bamboo steamer basket base */}
          <ellipse cx="32" cy="44" rx="24" ry="9" fill="#D97706" stroke="#92400E" strokeWidth="2" />
          <rect x="8" y="34" width="48" height="10" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
          <ellipse cx="32" cy="34" rx="24" ry="9" fill="#FDE68A" stroke="#B45309" strokeWidth="1.5" />
          {/* Dumpling 1 (left) */}
          <path d="M16,33 C16,27 21,25 24,25 C28,25 31,27 30,33 Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
          {/* Dumpling 2 (center) */}
          <path d="M26,31 C26,24 32,22 36,22 C40,22 43,24 43,31 Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
          {/* Dumpling 3 (right) */}
          <path d="M36,34 C36,28 41,26 44,26 C48,26 50,28 49,34 Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
          {/* Steamer steam clouds */}
          <path d="M26,16 C26,12 28,10 28,6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
          <path d="M36,18 C36,14 38,12 38,8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );

    // Stall 11 — Deeyang by: Pops Dessert: Layered sweets, crinkles & dessert cup
    case 'stall_11':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FCE7F3" fillOpacity="0.6" />
          {/* Dessert sundae cup */}
          <path d="M20,28 C20,40 28,46 32,46 C36,46 44,40 44,28 Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="2" />
          {/* Glass stem & base */}
          <rect x="30" y="46" width="4" height="6" fill="#DB2777" />
          <ellipse cx="32" cy="53" rx="10" ry="3" fill="#F472B6" stroke="#BE185D" strokeWidth="1.5" />
          {/* Layered sweet fillings */}
          <ellipse cx="32" cy="28" rx="12" ry="4" fill="#F43F5E" />
          <ellipse cx="32" cy="34" rx="10" ry="3" fill="#FBBF24" />
          {/* Choco crinkle cookie on side */}
          <circle cx="48" cy="24" r="7" fill="#451A03" stroke="#290E02" strokeWidth="1.5" />
          <path d="M44,22 L47,25 M49,21 L51,26" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
          {/* Spoon with heart */}
          <line x1="22" y1="12" x2="30" y2="28" stroke="#9D174D" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );

    // Stall 12 — Gulaman District: Colorful layered red/green gulaman sago cooler
    case 'stall_12':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#CCFBF1" fillOpacity="0.6" />
          {/* Tall tumbler cooler glass */}
          <polygon points="22,18 42,18 38,54 26,54" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2" strokeLinejoin="round" />
          {/* Layered colorful gulaman jelly bottom (red) */}
          <polygon points="25,44 39,44 38,53 26,53" fill="#EF4444" />
          {/* Green jelly cubes in middle */}
          <rect x="26" y="34" width="5" height="5" rx="1" fill="#10B981" />
          <rect x="33" y="36" width="5" height="5" rx="1" fill="#10B981" />
          <rect x="29" y="40" width="4" height="4" rx="1" fill="#F59E0B" />
          {/* Floating sago pearls */}
          <circle cx="28" cy="48" r="1.5" fill="#475569" />
          <circle cx="32" cy="46" r="1.5" fill="#475569" />
          <circle cx="36" cy="49" r="1.5" fill="#475569" />
          {/* Ice cube & striped straw */}
          <rect x="28" y="22" width="6" height="6" rx="1.5" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1" />
          <line x1="36" y1="8" x2="33" y2="30" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    // Stall 13 — Val's FoodHub: Savory Filipino adobo / food bowl over rice
    case 'stall_13':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#FEF3C7" fillOpacity="0.6" />
          {/* Warm hearty stew pot/bowl */}
          <path d="M14,30 C14,46 22,52 32,52 C42,52 50,46 50,30 Z" fill="#D97706" stroke="#92400E" strokeWidth="2" />
          {/* Bowl handles */}
          <path d="M11,34 C9,34 9,40 12,40" stroke="#92400E" strokeWidth="2" fill="none" />
          <path d="M53,34 C55,34 55,40 52,40" stroke="#92400E" strokeWidth="2" fill="none" />
          {/* Rice & rich savory meat chunks */}
          <ellipse cx="32" cy="30" rx="18" ry="7" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1.5" />
          <path d="M22,28 C26,24 38,24 42,28 C39,33 25,33 22,28 Z" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          <circle cx="30" cy="27" r="1.5" fill="#FBBF24" />
          {/* Steam curls */}
          <path d="M28,16 C28,12 30,10 30,6" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
          <path d="M36,18 C36,14 38,12 38,8" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );

    // Stall 14 — Shamir Food Houz: Cozy canteen kiosk booth with roof canopy & food plate
    case 'stall_14':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#F5F5F4" fillOpacity="0.6" />
          {/* Kiosk counter */}
          <rect x="14" y="36" width="36" height="18" rx="2" fill="#E7E5E4" stroke="#78716C" strokeWidth="2" />
          {/* Canopy awning (striped orange & white) */}
          <polygon points="10,24 54,24 50,34 14,34" fill="#EA580C" stroke="#C2410C" strokeWidth="2" />
          <polygon points="20,24 26,24 24,34 18,34" fill="#FFFFFF" />
          <polygon points="32,24 38,24 36,34 30,34" fill="#FFFFFF" />
          <polygon points="44,24 50,24 48,34 42,34" fill="#FFFFFF" />
          {/* Food dish on counter */}
          <ellipse cx="32" cy="42" rx="8" ry="3" fill="#FFFFFF" stroke="#A8A29E" strokeWidth="1" />
          <ellipse cx="32" cy="41" rx="5" ry="1.8" fill="#F97316" />
          {/* Canteen menu sign */}
          <rect x="22" y="47" width="20" height="4" rx="1" fill="#F97316" />
        </svg>
      );

    // Stall 15 — France Bistro: Bistro burger, golden french fries in carton & dipping cup
    case 'stall_15':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="32" r="28" fill="#DBEAFE" fillOpacity="0.6" />
          {/* Burger bottom bun */}
          <ellipse cx="26" cy="48" rx="13" ry="5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.8" />
          {/* Burger beef patty */}
          <rect x="14" y="42" width="24" height="4.5" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
          {/* Burger cheese & lettuce */}
          <path d="M14,42 L24,44 L32,41 L38,43" stroke="#EAB308" strokeWidth="2" fill="none" />
          <path d="M13,41 C16,40 18,43 23,41 C27,43 32,40 37,41" stroke="#22C55E" strokeWidth="2" fill="none" />
          {/* Burger top bun dome */}
          <path d="M13,40 C13,28 20,25 26,25 C32,25 39,28 39,40 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.8" />
          {/* Sesame seeds on burger */}
          <circle cx="23" cy="31" r="0.9" fill="#FFFBEB" />
          <circle cx="29" cy="30" r="0.9" fill="#FFFBEB" />
          <circle cx="26" cy="35" r="0.9" fill="#FFFBEB" />
          {/* French fries carton on right */}
          <polygon points="41,36 53,36 50,54 44,54" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
          {/* Golden fries sticks */}
          <rect x="42" y="24" width="2.5" height="13" rx="1" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          <rect x="46" y="20" width="2.5" height="17" rx="1" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          <rect x="49" y="26" width="2.5" height="11" rx="1" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
        </svg>
      );

    default:
      return null;
  }
}
