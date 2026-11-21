import { DishItem } from '../types';
import { getAccurateRepresentativeImage } from './representativeMapper';

export interface DishImageDisplayInfo {
  url: string | undefined;
  isRepresentative: boolean;
  isOwnerUploaded: boolean;
  badgeLabel: string | null;
}

/**
 * Universal Image Priority Resolver:
 * 1. If an owner-uploaded image exists → ALWAYS DISPLAY IT WITH ABSOLUTE TOP PRIORITY.
 *    Owner images are protected user data and must never be replaced, reset, or overwritten.
 * 2. If NO owner image exists → display the accurate representative image matching the dish name & description.
 * 3. Keep ownerUploadedImage and representativeImage strictly separate.
 */
export function getDishDisplayImage(dish: DishItem | null | undefined): DishImageDisplayInfo {
  if (!dish) {
    return {
      url: undefined,
      isRepresentative: false,
      isOwnerUploaded: false,
      badgeLabel: null
    };
  }

  // 1. Owner-uploaded image has absolute top priority
  if (dish.ownerUploadedImage && dish.ownerUploadedImage.trim() !== '') {
    return {
      url: dish.ownerUploadedImage,
      isRepresentative: false,
      isOwnerUploaded: true,
      badgeLabel: 'Official Stall Photo'
    };
  }

  // 2. Check if imageUrl is an owner-uploaded image (custom upload in /uploads/ or base64)
  if (
    dish.imageUrl &&
    (dish.imageUrl.startsWith('/uploads/') ||
      dish.imageUrl.startsWith('data:image/') ||
      (dish.imageUrl.startsWith('http') && !dish.imageUrl.includes('representative')))
  ) {
    return {
      url: dish.imageUrl,
      isRepresentative: false,
      isOwnerUploaded: true,
      badgeLabel: 'Official Stall Photo'
    };
  }

  // 3. If no owner image exists, find accurate representative image matching Menu Name → Description
  const repFromItem = dish.representativeImage && dish.representativeImage.trim() !== '' 
    ? dish.representativeImage 
    : undefined;

  const accurateRep = getAccurateRepresentativeImage(
    dish.name,
    dish.items || '',
    dish.category || ''
  );

  const finalRepUrl = repFromItem || accurateRep;

  return {
    url: finalRepUrl,
    isRepresentative: true,
    isOwnerUploaded: false,
    badgeLabel: 'Representative Demo'
  };
}
