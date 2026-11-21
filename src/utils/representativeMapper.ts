/**
 * Accurate Representative Image Matcher for USTP Cafeteria Menus
 * 
 * Strict Rule: Before assigning an image, check:
 * Menu Name → Menu Description → Image.
 * These three must be consistent.
 * 
 * Examples:
 * - Chicken Skin Rice Meal → crispy chicken skin served with plain rice.
 * - Chicken Skin Sulit Combo → chicken skin with rice and add-on such as lumpia or ham.
 * - Pork Chop Rice Meal → pan-fried pork chop with plain rice.
 * - Sweet-Style Pinoy Spaghetti → Filipino-style sweet spaghetti with red meat sauce.
 * - Cheese Stick → crispy cheese sticks.
 * - Warm Cheese Bread → warm bread containing/made with cheese.
 * - Spanish Bread + Chocoroll → Spanish bread and a chocolate roll.
 * - Classic Ensaymada with Butter & Sugar → Filipino ensaymada with butter and sugar.
 */

export const REPRESENTATIVE_IMAGES = {
  chicken_skin_rice: '/assets/representative/chicken_skin_rice.jpg',
  chicken_skin_combo: '/assets/representative/chicken_skin_combo.jpg',
  pork_chop_rice: '/assets/representative/pork_chop_rice.jpg',
  pinoy_sweet_spaghetti: '/assets/representative/pinoy_sweet_spaghetti.jpg',
  crispy_cheese_sticks: '/assets/representative/crispy_cheese_sticks.jpg',
  warm_cheese_bread: '/assets/representative/warm_cheese_bread.jpg',
  spanish_choco_bread: '/assets/representative/spanish_choco_bread.jpg',
  classic_ensaymada: '/assets/representative/classic_ensaymada.jpg',
  flavored_wings_rice: '/assets/representative/flavored_wings_rice.jpg',
  java_rice_siomai: '/assets/representative/java_rice_siomai.jpg',
  filipino_sisig_rice: '/assets/representative/filipino_sisig_rice.jpg',
  steamed_dumplings_dimsum: '/assets/representative/steamed_dumplings_dimsum.jpg',
  pinoy_streetfood_skewers: '/assets/representative/pinoy_streetfood_skewers.jpg',
  iced_gulaman_cooler: '/assets/representative/iced_gulaman_cooler.jpg',
  fresh_fruits_bar: '/assets/representative/fresh_fruits_bar.jpg',
  crispy_burger_fries: '/assets/representative/crispy_burger_fries.jpg',
} as const;

export function getAccurateRepresentativeImage(
  name: string,
  description = '',
  category = ''
): string {
  const text = `${name} ${description} ${category}`.toLowerCase();

  // 1. Chicken Skin Variants
  if (text.includes('chicken skin')) {
    if (text.includes('combo') || text.includes('lumpia') || text.includes('ham') || text.includes('sulit')) {
      return REPRESENTATIVE_IMAGES.chicken_skin_combo;
    }
    return REPRESENTATIVE_IMAGES.chicken_skin_rice;
  }

  // 2. Pork Chop Meals
  if (text.includes('pork chop') || text.includes('porkchop')) {
    return REPRESENTATIVE_IMAGES.pork_chop_rice;
  }

  // 3. Cheese Sticks / Cheese Rolls
  if (text.includes('cheese stick') || text.includes('cheesestick') || text.includes('cheese roll') && text.includes('stick')) {
    return REPRESENTATIVE_IMAGES.crispy_cheese_sticks;
  }

  // 4. Spaghetti & Pasta
  if (text.includes('spaghetti') || text.includes('pasta') || text.includes('sweet-style')) {
    return REPRESENTATIVE_IMAGES.pinoy_sweet_spaghetti;
  }

  // 5. Bread & Pastries
  if (text.includes('ensaymada') || text.includes('butter & sugar') || text.includes('cinnamon roll') || text.includes('german cross')) {
    return REPRESENTATIVE_IMAGES.classic_ensaymada;
  }
  if (text.includes('spanish bread') || text.includes('choco') || text.includes('crinkle') || text.includes('butterscotch')) {
    return REPRESENTATIVE_IMAGES.spanish_choco_bread;
  }
  if (text.includes('cheese bread') || text.includes('warm cheese') || text.includes('coco bun') || text.includes('pie') || text.includes('bread') || text.includes('pastry')) {
    return REPRESENTATIVE_IMAGES.warm_cheese_bread;
  }

  // 6. Sisig
  if (text.includes('sisig') || text.includes('sizzling')) {
    return REPRESENTATIVE_IMAGES.filipino_sisig_rice;
  }

  // 7. Java Rice & Siomai
  if (text.includes('java rice') || (text.includes('siomai') && text.includes('rice'))) {
    return REPRESENTATIVE_IMAGES.java_rice_siomai;
  }

  // 8. Dumplings & Dimsum
  if (text.includes('dumpling') || text.includes('siomai') || text.includes('dimsum') || text.includes('gyoza') || text.includes('sharks fin')) {
    return REPRESENTATIVE_IMAGES.steamed_dumplings_dimsum;
  }

  // 9. Street Food Skewers
  if (text.includes('isaw') || text.includes('kwek') || text.includes('fishball') || text.includes('tempura') || text.includes('proben') || text.includes('skewer') || text.includes('kikiam') || category === 'Street Food') {
    return REPRESENTATIVE_IMAGES.pinoy_streetfood_skewers;
  }

  // 10. Burgers, Fries & Sandwiches
  if (text.includes('burger') || text.includes('fries') || text.includes('sandwich') || text.includes('hotdog')) {
    return REPRESENTATIVE_IMAGES.crispy_burger_fries;
  }

  // 11. Fresh Fruits
  if (text.includes('fruit') || text.includes('watermelon') || text.includes('pineapple') || text.includes('mango') || text.includes('melon') || text.includes('banana') || text.includes('papaya') || category === 'Fruits') {
    return REPRESENTATIVE_IMAGES.fresh_fruits_bar;
  }

  // 12. Drinks, Coolers, Gulaman, Shakes, Ice Cream
  if (text.includes('drink') || text.includes('cooler') || text.includes('gulaman') || text.includes('shake') || text.includes('juice') || text.includes('ice cream') || text.includes('sundae') || text.includes('tea') || category === 'Drinks' || category === 'Desserts') {
    return REPRESENTATIVE_IMAGES.iced_gulaman_cooler;
  }

  // 13. Rice Meals general (Wings, Chicken pastil, Pork adobo, etc.)
  if (category === 'Rice Meals' || text.includes('rice') || text.includes('chicken') || text.includes('pork') || text.includes('beef') || text.includes('pastil')) {
    return REPRESENTATIVE_IMAGES.flavored_wings_rice;
  }

  // Default fallback
  return REPRESENTATIVE_IMAGES.flavored_wings_rice;
}
