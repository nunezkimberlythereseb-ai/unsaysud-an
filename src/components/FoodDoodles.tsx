import React from 'react';

interface DoodleProps {
  className?: string;
  size?: number;
}

/**
 * Hand-drawn playful vector food line doodles for warm, subtle background accents.
 * Designed with soft warm orange strokes to decorate hero areas and margins cleanly.
 */

// 1. Rice Bowl with Steam
export const RiceBowlDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Steam curls */}
    <path d="M24 16C22 12 26 8 24 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M32 18C30 13 34 9 32 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M40 16C38 12 42 8 40 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Rice mound */}
    <path d="M14 30C14 22 22 18 32 18C42 18 50 22 50 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Bowl body */}
    <path d="M12 30C12 46 20 54 32 54C44 54 52 46 52 30H12Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Bowl base */}
    <path d="M22 54V58H42V54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Chopsticks resting */}
    <line x1="16" y1="26" x2="48" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 2. Crispy Fried Chicken Drumstick
export const ChickenDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Crispy meat */}
    <path
      d="M22 42C16 36 15 25 21 19C27 13 38 14 44 20C50 26 50 37 42 43C36 47 28 47 22 42Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Crispy texture notches */}
    <path d="M28 24C30 24 31 26 33 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M35 32C37 32 39 34 40 33" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M25 34C27 35 28 37 30 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Bone handle */}
    <line x1="22" y1="42" x2="14" y2="50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <circle cx="12" cy="52" r="3" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="16" cy="54" r="3" stroke="currentColor" strokeWidth="2.5" />
  </svg>
);

// 3. Burger / Sandwich Doodle
export const BurgerDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Top bun */}
    <path d="M12 28C12 18 20 12 32 12C44 12 52 18 52 28H12Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Sesame seeds */}
    <ellipse cx="24" cy="20" rx="1.5" ry="1" fill="currentColor" />
    <ellipse cx="32" cy="17" rx="1.5" ry="1" fill="currentColor" />
    <ellipse cx="40" cy="21" rx="1.5" ry="1" fill="currentColor" />
    {/* Lettuce wave */}
    <path d="M10 33C13 31 16 35 19 33C22 31 25 35 28 33C31 31 34 35 37 33C40 31 43 35 46 33C49 31 52 35 54 33" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Patty */}
    <rect x="12" y="36" width="40" height="7" rx="3.5" stroke="currentColor" strokeWidth="2.5" />
    {/* Bottom bun */}
    <path d="M14 47C14 53 22 55 32 55C42 55 50 53 50 47H14Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

// 4. Fries in Box
export const FriesDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Individual fries */}
    <rect x="22" y="10" width="4.5" height="24" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="28" y="6" width="4.5" height="28" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="35" y="12" width="4.5" height="22" rx="1.5" stroke="currentColor" strokeWidth="2" />
    <rect x="17" y="15" width="4" height="19" rx="1.5" stroke="currentColor" strokeWidth="2" transform="rotate(-6 17 15)" />
    <rect x="41" y="14" width="4" height="20" rx="1.5" stroke="currentColor" strokeWidth="2" transform="rotate(8 41 14)" />
    {/* Fries box carton */}
    <path d="M14 34L18 56H46L50 34C44 38 38 32 32 35C26 32 20 38 14 34Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Smile on box */}
    <path d="M28 46C30 48 34 48 36 46" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5. Dumpling / Dimsum Doodle
export const DumplingDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Dumpling crescent body */}
    <path d="M10 40C12 24 22 16 32 16C42 16 52 24 54 40C40 45 24 45 10 40Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Pleats / folds */}
    <path d="M22 22C23 28 24 33 23 37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 18V38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M42 22C41 28 40 33 41 37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Tiny steam */}
    <path d="M28 10C27 7 30 5 29 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M35 11C34 8 37 6 36 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 6. Milk Tea / Juice Cup with Straw
export const DrinkDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Slanted straw */}
    <line x1="38" y1="4" x2="30" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Cup lid */}
    <ellipse cx="32" cy="20" rx="18" ry="4" stroke="currentColor" strokeWidth="2.5" />
    {/* Cup body */}
    <path d="M16 22L20 54C20 56 24 58 32 58C40 58 44 56 44 54L48 22" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Liquid line */}
    <path d="M19 32C24 34 32 30 38 33C41 34 44 32 46 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* Boba pearls */}
    <circle cx="26" cy="48" r="2.5" fill="currentColor" />
    <circle cx="33" cy="50" r="2.5" fill="currentColor" />
    <circle cx="38" cy="46" r="2.5" fill="currentColor" />
    <circle cx="29" cy="43" r="2" fill="currentColor" />
  </svg>
);

// 7. Street Food Skewer (Fishballs / Kikiam)
export const SkewerDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Wooden bamboo stick */}
    <line x1="12" y1="56" x2="52" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* 3 Street food balls */}
    <circle cx="24" cy="43" r="7" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="34" cy="32" r="7" stroke="currentColor" strokeWidth="2.5" />
    <circle cx="44" cy="21" r="7" stroke="currentColor" strokeWidth="2.5" />
    {/* Grill marks */}
    <line x1="22" y1="41" x2="26" y2="45" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="32" y1="30" x2="36" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="42" y1="19" x2="46" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 8. Spoon & Fork Crossed
export const UtensilsDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Spoon */}
    <path d="M16 16C12 20 14 26 20 28L46 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="17" cy="19" rx="5" ry="7" transform="rotate(-40 17 19)" stroke="currentColor" strokeWidth="2.5" />
    {/* Fork */}
    <path d="M48 16L22 54" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M42 20C44 24 48 24 50 20" stroke="currentColor" strokeWidth="2" />
    <line x1="42" y1="15" x2="44" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="46" y1="13" x2="47" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="15" x2="50" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 9. Fresh Bread / Croissant
export const BreadDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M12 36C10 26 18 18 32 18C46 18 54 26 52 36C50 44 42 48 32 48C22 48 14 44 12 36Z"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Baker's cuts */}
    <path d="M22 28C24 33 26 36 27 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M31 26C32 32 33 36 33 41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 28C40 33 39 36 38 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 10. Cafeteria Food Tray
export const TrayDoodle: React.FC<DoodleProps> = ({ className = "text-orange-400/30", size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Outer tray rim */}
    <rect x="8" y="16" width="48" height="34" rx="4" stroke="currentColor" strokeWidth="2.5" />
    {/* Tray compartments */}
    <rect x="13" y="21" width="18" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="35" y="21" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="35" y="34" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// 11. Subtle Floating Food Doodles Cluster for Background Canvas
export const FloatingFoodBackground: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`pointer-events-none select-none overflow-hidden absolute inset-0 z-0 opacity-40 transition-opacity duration-500 ${className}`}>
      {/* Top Left Area */}
      <div className="absolute -top-4 -left-4 text-orange-400/25 rotate-12">
        <RiceBowlDoodle size={72} />
      </div>
      <div className="absolute top-28 left-6 text-amber-500/20 -rotate-12 hidden lg:block">
        <DumplingDoodle size={56} />
      </div>
      <div className="absolute top-80 -left-6 text-orange-400/20 rotate-45 hidden md:block">
        <SkewerDoodle size={64} />
      </div>

      {/* Top Right Area */}
      <div className="absolute top-2 right-4 text-orange-400/25 -rotate-12">
        <DrinkDoodle size={68} />
      </div>
      <div className="absolute top-36 right-8 text-amber-500/20 rotate-15 hidden lg:block">
        <ChickenDoodle size={60} />
      </div>
      <div className="absolute top-96 right-2 text-orange-400/20 -rotate-45 hidden md:block">
        <FriesDoodle size={58} />
      </div>

      {/* Mid Left & Right Spans */}
      <div className="absolute top-[650px] -left-3 text-orange-400/20 rotate-6 hidden xl:block">
        <BurgerDoodle size={64} />
      </div>
      <div className="absolute top-[750px] -right-3 text-amber-500/20 -rotate-12 hidden xl:block">
        <BreadDoodle size={62} />
      </div>
      <div className="absolute top-[1200px] left-4 text-orange-400/20 rotate-25 hidden xl:block">
        <TrayDoodle size={60} />
      </div>
      <div className="absolute top-[1350px] right-6 text-orange-400/20 -rotate-15 hidden xl:block">
        <UtensilsDoodle size={58} />
      </div>
    </div>
  );
};
