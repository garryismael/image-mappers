import { BASE_API_URL } from "@/constants";

export interface BoundsResult {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const IMAGE_WIDTH = 1920;
export const IMAGE_HEIGHT = 1200;
export const MAX_SCALE = 4;
export const MIN_SCALE = 1;

export const calculateBounds = (
  scale: number,
  containerWidth: number,
  containerHeight: number
): BoundsResult => {
  const scaledWidth = IMAGE_WIDTH * scale;
  const scaledHeight = IMAGE_HEIGHT * scale;

  // Si l'image est plus petite que le conteneur dans une dimension, on centre et on bloque le mouvement
  if (scaledWidth <= containerWidth && scaledHeight <= containerHeight) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  // Si l'image est plus petite en largeur mais plus grande en hauteur
  if (scaledWidth <= containerWidth) {
    const maxTranslateY = (scaledHeight - containerHeight) / 2;
    return { minX: 0, maxX: 0, minY: -maxTranslateY, maxY: maxTranslateY };
  }

  // Si l'image est plus petite en hauteur mais plus grande en largeur
  if (scaledHeight <= containerHeight) {
    const maxTranslateX = (scaledWidth - containerWidth) / 2;
    return { minX: -maxTranslateX, maxX: maxTranslateX, minY: 0, maxY: 0 };
  }

  // Si l'image est plus grande dans les deux dimensions
  const maxTranslateX = (scaledWidth - containerWidth) / 2;
  const maxTranslateY = (scaledHeight - containerHeight) / 2;

  return {
    minX: -maxTranslateX,
    maxX: maxTranslateX,
    minY: -maxTranslateY,
    maxY: maxTranslateY,
  };
};

export function getMediaUrl(path: string): string {
  return `${BASE_API_URL}/${path}`;
}
