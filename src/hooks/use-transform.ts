import { MAX_SCALE, MIN_SCALE } from "@/utils";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type WheelEvent,
} from "react";

export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}

export const useTransform = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Fonction pour calculer les limites SANS JAMAIS montrer de bords blancs
  const calculateImageBounds = useCallback(
    (scale: number, containerWidth: number, containerHeight: number) => {
      // Dimensions de l'image mise à l'échelle
      const scaledImageWidth = 1920 * scale;
      const scaledImageHeight = 1080 * scale;

      let minX = 0;
      let maxX = 0;
      let minY = 0;
      let maxY = 0;

      // Calcul des limites horizontales - EMPÊCHER les bords blancs
      if (scaledImageWidth > containerWidth) {
        // L'image déborde : on peut la déplacer mais en gardant le conteneur rempli
        const maxMovement = (scaledImageWidth - containerWidth) / (2 * scale);
        minX = -maxMovement; // Le plus à gauche sans montrer le bord droit de l'image
        maxX = maxMovement; // Le plus à droite sans montrer le bord gauche de l'image
      } else {
        // L'image est plus petite : la centrer (pas de déplacement possible)
        minX = maxX = 0;
      }

      // Calcul des limites verticales - EMPÊCHER les bords blancs
      if (scaledImageHeight > containerHeight) {
        // L'image déborde : on peut la déplacer mais en gardant le conteneur rempli
        const maxMovement = (scaledImageHeight - containerHeight) / (2 * scale);
        minY = -maxMovement; // Le plus en haut sans montrer le bord bas de l'image
        maxY = maxMovement; // Le plus en bas sans montrer le bord haut de l'image
      } else {
        // L'image est plus petite : la centrer (pas de déplacement possible)
        minY = maxY = 0;
      }

      return { minX, maxX, minY, maxY };
    },
    []
  );

  // Reset position when scale changes to prevent being out of bounds
  const resetPositionIfNeeded = useCallback(
    (
      newScale: number,
      currentTranslateX: number,
      currentTranslateY: number
    ) => {
      if (!containerRef.current)
        return { translateX: currentTranslateX, translateY: currentTranslateY };

      const containerRect = containerRef.current.getBoundingClientRect();
      const bounds = calculateImageBounds(
        newScale,
        containerRect.width,
        containerRect.height
      );

      const clampedX = Math.max(
        bounds.minX,
        Math.min(bounds.maxX, currentTranslateX)
      );
      const clampedY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY, currentTranslateY)
      );

      return { translateX: clampedX, translateY: clampedY };
    },
    [calculateImageBounds]
  );

  // Initialize position to center the image properly
  const initializePosition = useCallback(() => {
    if (!containerRef.current) return;

    setTransform((prev) => ({
      ...prev,
      translateX: 0, // Commencer au centre
      translateY: 0,
    }));
  }, []);

  // Initialize position on mount and when container size changes
  useEffect(() => {
    initializePosition();
  }, [initializePosition]);

  // Calculer le zoom minimum pour éviter les bords blancs
  const getMinimumScale = useCallback(() => {
    if (!containerRef.current) return MIN_SCALE;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerAspectRatio = containerRect.width / containerRect.height;
    const imageAspectRatio = 1920 / 1080; // Image 16:9

    // Le zoom minimum doit assurer que l'image couvre entièrement le conteneur
    if (imageAspectRatio > containerAspectRatio) {
      // Image plus large - la hauteur détermine le zoom minimum
      return containerRect.height / 1080;
    } else {
      // Image plus haute - la largeur détermine le zoom minimum
      return containerRect.width / 1920;
    }
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const minScale = Math.max(MIN_SCALE, getMinimumScale()); // Utiliser le zoom minimum calculé
      const newScale = Math.max(
        minScale,
        Math.min(MAX_SCALE, transform.scale + delta)
      );

      if (newScale === transform.scale) return;

      // Calculate zoom centered on mouse position
      const scaleRatio = newScale / transform.scale;
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;

      const newTranslateX =
        transform.translateX +
        ((centerX - mouseX) * (scaleRatio - 1)) / transform.scale;
      const newTranslateY =
        transform.translateY +
        ((centerY - mouseY) * (scaleRatio - 1)) / transform.scale;

      // Apply bounds and reset if needed
      const position = resetPositionIfNeeded(
        newScale,
        newTranslateX,
        newTranslateY
      );

      setTransform({
        scale: newScale,
        translateX: position.translateX,
        translateY: position.translateY,
      });
    },
    [transform, resetPositionIfNeeded, getMinimumScale]
  );

  // Start dragging
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragOffset({ x: transform.translateX, y: transform.translateY });

      e.preventDefault();
    },
    [transform.translateX, transform.translateY]
  );

  // Handle dragging
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newTranslateX = dragOffset.x + deltaX;
      const newTranslateY = dragOffset.y + deltaY;

      // Get current bounds - these MUST be enforced strictly
      const containerRect = containerRef.current.getBoundingClientRect();
      const bounds = calculateImageBounds(
        transform.scale,
        containerRect.width,
        containerRect.height
      );

      // ABSOLUTE enforcement - clamp within bounds to NEVER show white space
      const clampedX = Math.max(
        bounds.minX,
        Math.min(bounds.maxX, newTranslateX)
      );
      const clampedY = Math.max(
        bounds.minY,
        Math.min(bounds.maxY, newTranslateY)
      );

      setTransform({
        ...transform,
        translateX: clampedX,
        translateY: clampedY,
      });
    },
    [isDragging, dragStart, dragOffset, transform, calculateImageBounds]
  );

  // Stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      // Force recalculation of bounds on resize and clamp position
      const position = resetPositionIfNeeded(
        transform.scale,
        transform.translateX,
        transform.translateY
      );

      setTransform((prev) => ({
        ...prev,
        translateX: position.translateX,
        translateY: position.translateY,
      }));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [
    transform.scale,
    transform.translateX,
    transform.translateY,
    resetPositionIfNeeded,
  ]);

  // Determine cursor to display
  const getCursor = useCallback(() => {
    if (isDragging) return "cursor-grabbing";

    if (!containerRef.current) return "cursor-default";

    const containerRect = containerRef.current.getBoundingClientRect();
    const bounds = calculateImageBounds(
      transform.scale,
      containerRect.width,
      containerRect.height
    );

    // Show grab cursor only if movement is possible
    const canMoveX = Math.abs(bounds.maxX - bounds.minX) > 0;
    const canMoveY = Math.abs(bounds.maxY - bounds.minY) > 0;

    return canMoveX || canMoveY ? "cursor-grab" : "cursor-default";
  }, [isDragging, transform.scale, calculateImageBounds]);

  return {
    containerRef,
    transform,
    isDragging,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getCursor,
  };
};
