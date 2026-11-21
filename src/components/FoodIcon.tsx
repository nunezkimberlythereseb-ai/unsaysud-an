import React from 'react';
import { DishItem } from '../types';
import { getDishDisplayImage } from '../utils/imageHelper';

export type FoodArchetype =
  | 'rice_chicken'
  | 'rice_siomai'
  | 'rice_stew'
  | 'rice_spicy'
  | 'rice_pastil'
  | 'rice_egg'
  | 'rice_beef'
  | 'rice_soup'
  | 'rice_general'
  | 'shake'
  | 'coffee_milk'
  | 'cooler_juice'
  | 'waffle'
  | 'skewer_street'
  | 'corndog'
  | 'fries_snack'
  | 'burger_sandwich'
  | 'fruit'
  | 'bakery_bread'
  | 'dessert_cake'
  | 'ice_cream';

/**
 * Determine the specific food archetype from dish properties
 */
export function getFoodArchetype(dish: {
  name: string;
  category?: string;
  tags?: string[];
  items?: string;
}): FoodArchetype {
  const tagsStr = Array.isArray(dish.tags) ? dish.tags.join(' ') : '';
  const text = `${dish.name || ''} ${dish.items || ''} ${tagsStr} ${dish.category || ''}`.toLowerCase();

  // Dumplings (Gyoza, Dimsum, Siomai)
  if ((text.includes('dumpling') || text.includes('gyoza') || dish.category === 'Dumplings') && !text.includes('rice')) {
    return 'rice_siomai';
  }

  // Ice Cream / Sundae
  if (text.includes('ice cream') || text.includes('sundae') || text.includes('cone') || text.includes('swirl') || text.includes('halo-halo')) {
    return 'ice_cream';
  }

  // Drinks & Shakes
  if (dish.category === 'Drinks' || text.includes('drink') || text.includes('shake') || text.includes('smoothie')) {
    if (text.includes('coffee') || text.includes('milo') || text.includes('milk') || text.includes('latte')) {
      return 'coffee_milk';
    }
    if (text.includes('shake') || text.includes('smoothie')) {
      return 'shake';
    }
    return 'cooler_juice';
  }

  // Fruits
  if (
    dish.category === 'Fruits' ||
    text.includes('fruit') ||
    text.includes('mango') ||
    text.includes('watermelon') ||
    text.includes('papaya') ||
    text.includes('pineapple') ||
    text.includes('banana') ||
    text.includes('apple') ||
    text.includes('guava')
  ) {
    return 'fruit';
  }

  // Bakery & Bread & Pastries
  if (
    dish.category === 'Bread & Pastries' ||
    text.includes('ensaymada') ||
    text.includes('pandesal') ||
    text.includes('bread') ||
    text.includes('croissant') ||
    text.includes('roll') ||
    text.includes('toast') ||
    text.includes('buns') ||
    text.includes('pie')
  ) {
    return 'bakery_bread';
  }
  if (
    dish.category === 'Desserts' ||
    text.includes('cake') ||
    text.includes('cupcake') ||
    text.includes('crinkle') ||
    text.includes('binignit') ||
    text.includes('flan') ||
    text.includes('dessert') ||
    text.includes('butterscotch') ||
    text.includes('bagumbayan')
  ) {
    return 'dessert_cake';
  }

  // Waffles
  if (text.includes('waffle')) {
    return 'waffle';
  }

  // Rice dishes
  if (dish.category === 'Rice Meals' || text.includes(' rice') || text.includes('rice ') || text.includes('chaofan')) {
    if (text.includes('pastil')) {
      return 'rice_pastil';
    }
    if (
      text.includes('wing') ||
      text.includes('drumstick') ||
      text.includes('chicken') ||
      text.includes('katsu') ||
      text.includes('teriyaki')
    ) {
      return 'rice_chicken';
    }
    if (
      text.includes('siomai') ||
      text.includes('dumpling') ||
      text.includes('dimsum') ||
      text.includes('cebu style') ||
      text.includes('shrimp')
    ) {
      return 'rice_siomai';
    }
    if (text.includes('pad kra pao') || text.includes('bicol express') || text.includes('spicy') || text.includes('curry')) {
      return 'rice_spicy';
    }
    if (text.includes('silog') || text.includes('egg') || text.includes('tapsilog') || text.includes('tocilog') || text.includes('talong')) {
      return 'rice_egg';
    }
    if (
      text.includes('adobo') ||
      text.includes('menudo') ||
      text.includes('humba') ||
      text.includes('caldereta') ||
      text.includes('mechado') ||
      text.includes('pastel') ||
      text.includes('mushroom')
    ) {
      return 'rice_stew';
    }
    if (text.includes('sinigang') || text.includes('tinola') || text.includes('soup') || text.includes('bulalo')) {
      return 'rice_soup';
    }
    if (
      text.includes('pares') ||
      text.includes('sisig') ||
      text.includes('beef') ||
      text.includes('steak') ||
      text.includes('beefloaf') ||
      text.includes('corned beef')
    ) {
      return 'rice_beef';
    }
    return 'rice_general';
  }

  // Skewers & Street Food
  if (text.includes('corndog') || text.includes('hotdog')) {
    return 'corndog';
  }
  if (
    text.includes('skewer') ||
    text.includes('bbq') ||
    text.includes('fishball') ||
    text.includes('kikiam') ||
    text.includes('tempura') ||
    text.includes('squid ball') ||
    text.includes('squidball') ||
    text.includes('koi-koi') ||
    text.includes('dumpling') ||
    text.includes('gyoza')
  ) {
    return 'skewer_street';
  }

  // Snacks & Fries / Burgers
  if (text.includes('burger') || text.includes('sandwich') || text.includes('bun') || text.includes('shawarma')) {
    return 'burger_sandwich';
  }
  if (
    text.includes('fries') ||
    text.includes('hash brown') ||
    text.includes('sticks') ||
    text.includes('dynamite') ||
    text.includes('squid roll') ||
    text.includes('crab stick') ||
    text.includes('popcorn') ||
    text.includes('pancit') ||
    text.includes('pasta') ||
    text.includes('penne')
  ) {
    return 'fries_snack';
  }

  // Rice dishes fallback
  if (text.includes('wing') || text.includes('chicken')) return 'rice_chicken';
  if (text.includes('siomai') || text.includes('dumpling')) return 'rice_siomai';
  if (text.includes('pastil')) return 'rice_pastil';
  if (text.includes('egg') || text.includes('silog')) return 'rice_egg';
  if (text.includes('stew') || text.includes('adobo')) return 'rice_stew';
  if (dish.category === 'Rice Meals' || dish.category === 'rice') return 'rice_general';

  return 'rice_general';
}

interface FoodIconProps {
  archetype?: FoodArchetype;
  dish?: {
    name: string;
    category?: string;
    tags?: string[];
    items?: string;
    imageUrl?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const FoodIcon: React.FC<FoodIconProps> = ({
  archetype,
  dish,
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = React.useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [dish?.imageUrl]);

  const resolvedArchetype = archetype || (dish ? getFoodArchetype(dish) : 'rice_general');

  // Palette styling based on food archetype
  const colorStyles: Record<FoodArchetype, { bg: string; border: string }> = {
    rice_chicken:    { bg: 'bg-amber-50/90', border: 'border-amber-200' },
    rice_siomai:     { bg: 'bg-orange-50/90', border: 'border-orange-200' },
    rice_stew:       { bg: 'bg-red-50/90', border: 'border-red-200' },
    rice_spicy:      { bg: 'bg-rose-50/90', border: 'border-rose-200' },
    rice_pastil:     { bg: 'bg-emerald-50/90', border: 'border-emerald-200' },
    rice_egg:        { bg: 'bg-yellow-50/90', border: 'border-yellow-200' },
    rice_beef:       { bg: 'bg-stone-50/90', border: 'border-stone-200' },
    rice_soup:       { bg: 'bg-teal-50/90', border: 'border-teal-200' },
    rice_general:    { bg: 'bg-orange-50/90', border: 'border-orange-200' },
    shake:           { bg: 'bg-purple-50/90', border: 'border-purple-200' },
    coffee_milk:     { bg: 'bg-amber-50/90', border: 'border-amber-200' },
    cooler_juice:    { bg: 'bg-cyan-50/90', border: 'border-cyan-200' },
    waffle:          { bg: 'bg-amber-50/90', border: 'border-amber-200' },
    skewer_street:   { bg: 'bg-amber-50/90', border: 'border-amber-200' },
    corndog:         { bg: 'bg-amber-50/90', border: 'border-amber-200' },
    fries_snack:     { bg: 'bg-yellow-50/90', border: 'border-yellow-200' },
    burger_sandwich: { bg: 'bg-blue-50/90', border: 'border-blue-200' },
    fruit:           { bg: 'bg-emerald-50/90', border: 'border-emerald-200' },
    bakery_bread:    { bg: 'bg-amber-50/90', border: 'border-amber-200' },
    dessert_cake:    { bg: 'bg-pink-50/90', border: 'border-pink-200' },
    ice_cream:       { bg: 'bg-rose-50/90', border: 'border-rose-200' }
  };

  const style = colorStyles[resolvedArchetype] || colorStyles.rice_general;

  // Sizing definitions
  const sizeClasses = {
    xs: 'w-8 h-8 rounded-lg p-1',
    sm: 'w-11 h-11 rounded-xl p-1.5',
    md: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-2 sm:p-2.5',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-3',
    xl: 'w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-4'
  };

  const displayImage = dish ? getDishDisplayImage(dish as DishItem) : null;
  const activeImageUrl = displayImage?.url || dish?.imageUrl;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 border transition-all duration-200 shadow-2xs overflow-hidden ${style.bg} ${style.border} ${sizeClasses[size]} ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center">
        {activeImageUrl && !imageError ? (
          <img
            src={activeImageUrl}
            alt={dish?.name || 'Dish'}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          renderFoodIllustration(resolvedArchetype)
        )}
      </div>
    </div>
  );
};

/**
 * Cute, colorful, semi-flat digital illustrations for individual food items
 * ViewBox 0 0 64 64, friendly school cafeteria aesthetic, clean shapes & vibrant colors
 */
function renderFoodIllustration(archetype: FoodArchetype) {
  switch (archetype) {
    // 1. Wings / Crispy Fried Chicken + Rice
    case 'rice_chicken':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Rice bed */}
          <ellipse cx="26" cy="46" rx="18" ry="7" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Crispy golden fried drumstick / wing */}
          <path
            d="M26,38 C22,34 22,26 28,20 C34,14 42,14 46,18 C50,22 50,30 44,36 C40,40 32,42 26,38 Z"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="2"
          />
          {/* Bone handle */}
          <line x1="44" y1="20" x2="52" y2="12" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="53" cy="11" r="2.5" fill="#E2E8F0" />
          {/* Crispy glaze spots */}
          <circle cx="32" cy="24" r="1.5" fill="#B45309" />
          <circle cx="36" cy="30" r="1.5" fill="#B45309" />
          {/* Parsley garnish dot */}
          <circle cx="20" cy="44" r="1.5" fill="#22C55E" />
        </svg>
      );

    // 2. Siomai / Steamed Dumpling + Rice
    case 'rice_siomai':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Plate */}
          <ellipse cx="32" cy="48" rx="24" ry="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Steamed Siomai 1 */}
          <path
            d="M18,44 C18,34 22,30 26,30 C30,30 34,34 34,44 Z"
            fill="#FEF08A"
            stroke="#EAB308"
            strokeWidth="1.8"
          />
          <circle cx="26" cy="33" r="1.8" fill="#EF4444" />
          {/* Steamed Siomai 2 (center) */}
          <path
            d="M28,42 C28,30 33,26 38,26 C43,26 48,30 48,42 Z"
            fill="#FEF08A"
            stroke="#EAB308"
            strokeWidth="1.8"
          />
          <circle cx="38" cy="29" r="1.8" fill="#EF4444" />
          {/* Chili garlic drop */}
          <circle cx="16" cy="46" r="3" fill="#DC2626" />
          {/* Steam curls */}
          <path d="M32,18 C32,14 34,12 34,8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );

    // 3. Savory Stew / Adobo / Menudo / Chicken Pastel
    case 'rice_stew':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Stew bowl */}
          <path d="M12,30 C12,46 20,52 32,52 C44,52 52,46 52,30 Z" fill="#DC2626" stroke="#B91C1C" strokeWidth="2" />
          <rect x="24" y="52" width="16" height="3" rx="1.5" fill="#991B1B" />
          {/* Rich savory sauce fill */}
          <ellipse cx="32" cy="30" rx="19" ry="7" fill="#9A3412" />
          {/* Tender meat chunks */}
          <rect x="22" y="26" width="7" height="6" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1" />
          <rect x="33" y="27" width="8" height="6" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="1" />
          {/* Carrot & potato slices */}
          <circle cx="30" cy="26" r="2.5" fill="#F97316" />
          <circle cx="26" cy="32" r="2.5" fill="#FDE047" />
          {/* Steam */}
          <path d="M28,18 C28,14 30,12 30,8" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );

    // 4. Spicy / Bicol Express / Curry
    case 'rice_spicy':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Rice mound */}
          <ellipse cx="32" cy="46" rx="22" ry="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Spicy coconut sauce */}
          <ellipse cx="32" cy="42" rx="16" ry="6" fill="#FB7185" />
          {/* Red chili pepper */}
          <path
            d="M36,16 C38,18 42,28 36,36 C32,40 26,40 24,36 C22,30 26,22 36,16 Z"
            fill="#E11D48"
            stroke="#BE123C"
            strokeWidth="1.8"
          />
          {/* Chili green stem */}
          <path d="M36,16 C38,12 44,10 46,10" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Flame sparkles */}
          <path d="M18,24 L20,28 L22,24 L20,20 Z" fill="#F59E0B" />
        </svg>
      );

    // 5. Pastil (Leaf wrapped rice & shredded savory chicken)
    case 'rice_pastil':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Banana leaf fold base */}
          <ellipse cx="32" cy="46" rx="24" ry="10" fill="#10B981" stroke="#059669" strokeWidth="2" />
          {/* Steamed white rice */}
          <path d="M18,42 C18,30 24,24 32,24 C40,24 46,30 46,42 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.8" />
          {/* Dark shredded chicken pastil mound */}
          <path d="M24,28 C26,24 38,24 40,28 C37,31 27,31 24,28 Z" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
          {/* Boiled egg slice */}
          <ellipse cx="32" cy="35" rx="6" ry="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          <circle cx="32" cy="35" r="2.2" fill="#F59E0B" />
        </svg>
      );

    // 6. Breakfast / Silog / Fried Egg + Rice
    case 'rice_egg':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Rice mound */}
          <ellipse cx="26" cy="46" rx="18" ry="7" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Sunny side up egg white */}
          <path
            d="M26,34 C20,34 18,26 24,20 C30,14 42,16 46,24 C48,32 40,38 34,38 C30,38 28,34 26,34 Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="2"
          />
          {/* Vibrant golden yolk */}
          <circle cx="34" cy="27" r="6" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="32" cy="25" r="1.5" fill="#FEF08A" />
        </svg>
      );

    // 7. Beef Pares / Sizzling Bistek
    case 'rice_beef':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Sizzling cast iron plate */}
          <ellipse cx="32" cy="44" rx="24" ry="10" fill="#292524" stroke="#1C1917" strokeWidth="2" />
          <line x1="56" y1="44" x2="62" y2="44" stroke="#78716C" strokeWidth="3" strokeLinecap="round" />
          {/* Fluffy rice */}
          <ellipse cx="24" cy="40" rx="12" ry="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
          {/* Savory braised beef slices with rich gravy */}
          <ellipse cx="38" cy="40" rx="10" ry="5" fill="#78350F" />
          <rect x="34" y="36" width="8" height="4" rx="1" fill="#451A03" />
          {/* Crispy garlic garnish */}
          <circle cx="24" cy="38" r="1.2" fill="#D97706" />
          <circle cx="26" cy="40" r="1.2" fill="#D97706" />
        </svg>
      );

    // 8. Soup / Sinigang / Pancit with soup
    case 'rice_soup':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Canteen soup bowl */}
          <path d="M12,28 C12,46 20,52 32,52 C44,52 52,46 52,28 Z" fill="#0D9488" stroke="#0F766E" strokeWidth="2" />
          {/* Soup broth */}
          <ellipse cx="32" cy="28" rx="19" ry="7" fill="#5EEAD4" />
          {/* Noodles / floating greens */}
          <path d="M22,27 C26,29 32,25 38,28" stroke="#115E59" strokeWidth="2" fill="none" />
          {/* Calamansi / lemon slice */}
          <circle cx="38" cy="27" r="3" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
          {/* Steam */}
          <path d="M30,16 C30,12 32,10 32,6" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );

    // 9. General Rice Meal / Asian Rice Bowl
    case 'rice_general':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Food bowl */}
          <path d="M14,30 C14,46 22,52 32,52 C42,52 50,46 50,30 Z" fill="#EA580C" stroke="#C2410C" strokeWidth="2" />
          <rect x="25" y="52" width="14" height="3" rx="1" fill="#9A3412" />
          {/* Fluffy steaming rice dome */}
          <ellipse cx="32" cy="30" rx="17" ry="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Chopsticks across */}
          <line x1="14" y1="22" x2="48" y2="34" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="20" x2="50" y2="32" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // 10. Fruit Shake / Smoothie
    case 'shake':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Shake cup */}
          <polygon points="20,24 44,24 40,54 24,54" fill="#C084FC" stroke="#9333EA" strokeWidth="2" strokeLinejoin="round" />
          {/* Whipped cream dome */}
          <path d="M22,24 C22,16 26,14 32,14 C38,14 42,16 42,24 Z" fill="#FAF5FF" stroke="#9333EA" strokeWidth="1.8" />
          {/* Striped straw */}
          <rect x="36" y="6" width="3.5" height="20" rx="1.5" transform="rotate(12 36 6)" fill="#F43F5E" stroke="#BE123C" strokeWidth="1" />
          {/* Cherry on top */}
          <circle cx="28" cy="14" r="3.5" fill="#E11D48" stroke="#9F1239" strokeWidth="1" />
        </svg>
      );

    // 11. Iced Coffee / Milocino
    case 'coffee_milk':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Coffee cup */}
          <polygon points="20,22 44,22 40,54 24,54" fill="#78350F" stroke="#451A03" strokeWidth="2" strokeLinejoin="round" />
          {/* Cream milk swirl on top */}
          <polygon points="21,24 43,24 42,32 22,32" fill="#FED7AA" />
          {/* Straw */}
          <line x1="36" y1="10" x2="33" y2="28" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
          {/* Ice cubes */}
          <rect x="25" y="35" width="5" height="5" rx="1" fill="#BAE6FD" opacity="0.8" />
          <rect x="32" y="38" width="5" height="5" rx="1" fill="#BAE6FD" opacity="0.8" />
        </svg>
      );

    // 12. Refreshing Cooler / Melon / Lemonade / Gulaman
    case 'cooler_juice':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Chilled cup */}
          <polygon points="20,20 44,20 40,54 24,54" fill="#67E8F9" stroke="#0891B2" strokeWidth="2" strokeLinejoin="round" />
          {/* Citrus / Lemon slice on rim */}
          <circle cx="22" cy="19" r="6" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="22" cy="19" r="3" fill="#FEF08A" />
          {/* Straw */}
          <line x1="36" y1="8" x2="33" y2="26" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
          {/* Bubbles */}
          <circle cx="28" cy="38" r="2" fill="#FFFFFF" opacity="0.7" />
          <circle cx="34" cy="44" r="2" fill="#FFFFFF" opacity="0.7" />
          <circle cx="30" cy="48" r="1.5" fill="#FFFFFF" opacity="0.7" />
        </svg>
      );

    // 13. Belgian Waffle
    case 'waffle':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Golden waffle body */}
          <rect x="12" y="12" width="40" height="40" rx="8" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
          {/* Pockets */}
          <rect x="18" y="18" width="9" height="9" rx="2" fill="#B45309" opacity="0.6" />
          <rect x="37" y="18" width="9" height="9" rx="2" fill="#B45309" opacity="0.6" />
          <rect x="18" y="37" width="9" height="9" rx="2" fill="#B45309" opacity="0.6" />
          <rect x="37" y="37" width="9" height="9" rx="2" fill="#B45309" opacity="0.6" />
          {/* Butter melting square in center */}
          <rect x="27" y="27" width="10" height="10" rx="2" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5" />
        </svg>
      );

    // 14. Skewers / Street Food (Fishball, tempura, squid roll)
    case 'skewer_street':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Bamboo stick */}
          <line x1="16" y1="52" x2="48" y2="12" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
          {/* Golden street food balls / nuggets on stick */}
          <circle cx="24" cy="42" r="6" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          <circle cx="32" cy="32" r="6" fill="#F59E0B" stroke="#B45309" strokeWidth="1.8" />
          <circle cx="40" cy="22" r="6" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          {/* Dip sauce splash */}
          <circle cx="48" cy="48" r="4" fill="#DC2626" />
        </svg>
      );

    // 15. Corndog
    case 'corndog':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Wooden stick */}
          <line x1="16" y1="54" x2="26" y2="40" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
          {/* Batter coated oblong body */}
          <rect
            x="20"
            y="12"
            width="18"
            height="34"
            rx="9"
            transform="rotate(35 29 29)"
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="2"
          />
          {/* Mustard drizzle */}
          <path d="M22,26 Q27,24 30,28 T38,30" stroke="#FEF08A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    // 16. French Fries / Hash Brown / Crispy Snacks
    case 'fries_snack':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Red carton holder */}
          <polygon points="18,30 46,30 42,54 22,54" fill="#DC2626" stroke="#B91C1C" strokeWidth="2" strokeLinejoin="round" />
          {/* Golden fries sticks */}
          <rect x="22" y="16" width="3.5" height="18" rx="1.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          <rect x="28" y="12" width="3.5" height="22" rx="1.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          <rect x="34" y="14" width="3.5" height="20" rx="1.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
          <rect x="39" y="18" width="3.5" height="16" rx="1.5" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
        </svg>
      );

    // 17. Burger / Sandwich
    case 'burger_sandwich':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Bottom bun */}
          <ellipse cx="32" cy="46" rx="18" ry="6" fill="#FBBF24" stroke="#D97706" strokeWidth="1.8" />
          {/* Beef patty */}
          <rect x="16" y="38" width="32" height="6" rx="2" fill="#78350F" stroke="#451A03" strokeWidth="1.2" />
          {/* Melted cheese */}
          <polygon points="16,38 48,38 42,42 36,39 28,43 22,39" fill="#FACC15" />
          {/* Lettuce */}
          <path d="M15,36 C18,34 22,38 27,35 C32,38 37,34 42,37 C46,34 49,36 49,36" stroke="#22C55E" strokeWidth="2" fill="none" />
          {/* Top bun dome */}
          <path d="M16,35 C16,21 24,18 32,18 C40,18 48,21 48,35 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.8" />
          {/* Sesame seeds */}
          <circle cx="28" cy="24" r="1" fill="#FFFFFF" />
          <circle cx="36" cy="24" r="1" fill="#FFFFFF" />
          <circle cx="32" cy="29" r="1" fill="#FFFFFF" />
        </svg>
      );

    // 18. Fresh Fruits (Watermelon & Mango)
    case 'fruit':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Watermelon slice */}
          <path d="M14,40 C14,40 24,52 40,48 L34,22 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
          {/* Green rind */}
          <path d="M14,40 C14,40 24,52 40,48" stroke="#15803D" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Seeds */}
          <circle cx="26" cy="38" r="1.2" fill="#18181B" />
          <circle cx="32" cy="40" r="1.2" fill="#18181B" />
          {/* Mango slice on right */}
          <path d="M34,20 C40,14 48,16 52,24 C54,30 48,36 40,32 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
        </svg>
      );

    // 19. Bakery / Warm Bread & Ensaymada
    case 'bakery_bread':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Golden bread loaf */}
          <path
            d="M14,42 C14,30 20,24 32,24 C44,24 50,30 50,42 C50,48 44,49 32,49 C20,49 14,48 14,42 Z"
            fill="#FDBA74"
            stroke="#C2410C"
            strokeWidth="2"
          />
          {/* Diagonal bakery slashes */}
          <line x1="24" y1="28" x2="26" y2="44" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          <line x1="32" y1="27" x2="33" y2="45" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="28" x2="39" y2="44" stroke="#9A3412" strokeWidth="2" strokeLinecap="round" />
          {/* Butter pat */}
          <rect x="28" y="20" width="8" height="5" rx="1.5" fill="#FEF08A" stroke="#EAB308" strokeWidth="1" />
        </svg>
      );

    // 20. Sweets & Desserts / Crinkles / Pastry
    case 'dessert_cake':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Cupcake / Sweet cup base */}
          <polygon points="20,32 44,32 40,52 24,52" fill="#F472B6" stroke="#DB2777" strokeWidth="2" strokeLinejoin="round" />
          {/* Swirled sweet frosting */}
          <path
            d="M18,32 C18,22 24,18 32,18 C40,18 46,22 46,32 Z"
            fill="#FDF2F8"
            stroke="#DB2777"
            strokeWidth="1.8"
          />
          {/* Choco crinkle cookie on top right */}
          <circle cx="44" cy="20" r="6" fill="#451A03" stroke="#290E02" strokeWidth="1.2" />
          <path d="M41,18 L43,21 M45,17 L47,21" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
          {/* Sprinkles */}
          <circle cx="28" cy="26" r="1.2" fill="#3B82F6" />
          <circle cx="34" cy="24" r="1.2" fill="#F59E0B" />
        </svg>
      );

    // 21. Ice Cream / Soft-serve
    case 'ice_cream':
      return (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          {/* Waffle cone */}
          <polygon points="22,34 42,34 32,56" fill="#FBBF24" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
          <line x1="26" y1="40" x2="38" y2="40" stroke="#B45309" strokeWidth="1.2" strokeLinecap="round" />
          {/* Ice cream swirls */}
          <path
            d="M18,34 C18,28 24,28 32,28 C40,28 46,28 46,34 Z"
            fill="#FDA4AF"
            stroke="#E11D48"
            strokeWidth="1.8"
          />
          <path
            d="M22,28 C22,20 26,18 32,14 C38,18 42,20 42,28 Z"
            fill="#FFF1F2"
            stroke="#E11D48"
            strokeWidth="1.8"
          />
          {/* Sprinkles */}
          <circle cx="28" cy="23" r="1.2" fill="#3B82F6" />
          <circle cx="35" cy="22" r="1.2" fill="#F59E0B" />
        </svg>
      );

    default:
      return null;
  }
}
