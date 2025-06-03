import React, { useRef, useState, useCallback, useEffect } from "react";

// Type pour les zones de la carte
interface MapArea {
  id: string;
  title: string;
  coords: number[];
  shape: string;
  fillColor: string;
  strokeColor: string;
  lineWidth: number;
}

interface InteractiveMapProps {
  imageSrc?: string;
  imageWidth?: number;
  imageHeight?: number;
  mapAreas?: MapArea[];
  onAreaClick?: (area: MapArea) => void;
  onAreaHover?: (area: MapArea) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  imageSrc,
  imageWidth = 2000,
  imageHeight = 2000,
  mapAreas = [],
  onAreaHover,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredArea, setHoveredArea] = useState<MapArea | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [animatingArea, setAnimatingArea] = useState<string | null>(null);

  // État pour le zoom et le pan
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // État pour le pinch/touch
  const [isPinching, setIsPinching] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // Dimensions du conteneur
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });

  // Fonction pour calculer la distance entre deux touches
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // Fonction pour calculer le centre entre deux touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Gestion du début du pinch
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      setLastTouchDistance(getTouchDistance(e.touches));
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, []);

  // Fonction pour limiter les déplacements et le zoom minimum
  const constrainTransform = useCallback(
    (x: number, y: number, scale: number) => {
      // Calcul du zoom minimum pour éviter les bords gris
      const minScaleX = containerSize.width / imageWidth;
      const minScaleY = containerSize.height / imageHeight;
      const minScale = Math.max(minScaleX, minScaleY, 0.1);

      // Limiter le zoom
      const constrainedScale = Math.max(minScale, Math.min(5, scale));

      const scaledWidth = imageWidth * constrainedScale;
      const scaledHeight = imageHeight * constrainedScale;

      // Limites pour empêcher les bords blancs
      const maxX = Math.max(0, (containerSize.width - scaledWidth) / 2);
      const minX = Math.min(0, containerSize.width - scaledWidth - maxX);
      const maxY = Math.max(0, (containerSize.height - scaledHeight) / 2);
      const minY = Math.min(0, containerSize.height - scaledHeight - maxY);

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
        scale: constrainedScale,
      };
    },
    [containerSize.width, containerSize.height, imageWidth, imageHeight]
  );

  // Gestion du pinch et du drag tactile
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 2 && isPinching) {
        const currentDistance = getTouchDistance(e.touches);
        const currentCenter = getTouchCenter(e.touches);

        if (lastTouchDistance > 0) {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;

          const scaleFactor = currentDistance / lastTouchDistance;
          const newScale = transform.scale * scaleFactor;

          // Zoom centré sur le pinch
          const centerX = currentCenter.x - rect.left;
          const centerY = currentCenter.y - rect.top;

          const scaleChange = newScale / transform.scale;
          const newX =
            transform.x - (centerX - transform.x) * (scaleChange - 1);
          const newY =
            transform.y - (centerY - transform.y) * (scaleChange - 1);

          const constrainedTransform = constrainTransform(newX, newY, newScale);
          setTransform(constrainedTransform);
        }

        setLastTouchDistance(currentDistance);
      } else if (e.touches.length === 1 && isDragging && !isPinching) {
        const deltaX = e.touches[0].clientX - lastMousePos.x;
        const deltaY = e.touches[0].clientY - lastMousePos.y;

        const newX = transform.x + deltaX;
        const newY = transform.y + deltaY;

        const constrainedTransform = constrainTransform(
          newX,
          newY,
          transform.scale
        );
        setTransform(constrainedTransform);

        setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    },
    [
      isPinching,
      isDragging,
      lastTouchDistance,
      transform.scale,
      transform.x,
      transform.y,
      constrainTransform,
      lastMousePos.x,
      lastMousePos.y,
    ]
  );

  // Gestion de la fin du pinch/touch
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
      setLastTouchDistance(0);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const newSize = {
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        };
        setContainerSize(newSize);

        // Recalculer la transformation pour maintenir les contraintes
        setTransform((prev) => constrainTransform(prev.x, prev.y, prev.scale));
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [constrainTransform]);

  // Fonction pour convertir les coordonnées en string de points
  const coordsToPoints = (coords: number[]): string => {
    const points: string[] = [];
    for (let i = 0; i < coords.length; i += 2) {
      points.push(`${coords[i]},${coords[i + 1]}`);
    }
    return points.join(" ");
  };

  // Fonction pour calculer la longueur du périmètre d'un polygone
  const getPolygonPerimeter = (coords: number[]): number => {
    let perimeter = 0;
    for (let i = 0; i < coords.length; i += 2) {
      const x1 = coords[i];
      const y1 = coords[i + 1];
      const x2 = coords[(i + 2) % coords.length];
      const y2 = coords[(i + 3) % coords.length];

      perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    return perimeter;
  };

  // Gestion du survol
  const handleAreaMouseEnter = useCallback(
    (area: MapArea, e: React.MouseEvent): void => {
      setHoveredArea(area);
      setAnimatingArea(area.id);

      // Définir la variable CSS pour l'animation
      const perimeter = getPolygonPerimeter(area.coords);
      if (svgRef.current) {
        svgRef.current.style.setProperty("--stroke-dashoffset", `${perimeter}`);
      }

      // Position du tooltip centrée au-dessus du curseur
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }

      if (onAreaHover) {
        onAreaHover(area);
      }
    },
    [onAreaHover]
  );

  const handleAreaMouseMove = useCallback((e: React.MouseEvent): void => {
    // Position du tooltip centrée au-dessus du curseur
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleAreaMouseLeave = useCallback((): void => {
    setHoveredArea(null);
    setAnimatingArea(null);
  }, []);

  // Gestion du zoom avec la molette
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = transform.scale * scaleFactor;

      // Calcul du zoom centré sur la souris
      const scaleChange = newScale / transform.scale;
      const newX = transform.x - (mouseX - transform.x) * (scaleChange - 1);
      const newY = transform.y - (mouseY - transform.y) * (scaleChange - 1);

      const constrainedTransform = constrainTransform(newX, newY, newScale);
      setTransform(constrainedTransform);
    },
    [transform.scale, transform.x, transform.y, constrainTransform]
  );

  // Gestion du début du drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Empêcher le drag si on clique sur une zone interactive
    const target = e.target as Element;
    if (target.tagName === "polygon") return;

    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  }, []);

  // Gestion du drag
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;

      const newX = transform.x + deltaX;
      const newY = transform.y + deltaY;

      const constrainedTransform = constrainTransform(
        newX,
        newY,
        transform.scale
      );
      setTransform(constrainedTransform);

      setLastMousePos({ x: e.clientX, y: e.clientY });
    },
    [
      isDragging,
      lastMousePos.x,
      lastMousePos.y,
      transform.x,
      transform.y,
      transform.scale,
      constrainTransform,
    ]
  );

  // Gestion de la fin du drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 relative overflow-hidden">
      {/* Tooltip centré au-dessus du curseur */}
      {hoveredArea && (
        <div
          className="absolute px-3 py-2 z-50 bg-white text-sm font-medium rounded-md pointer-events-none shadow-lg border border-gray-200 whitespace-nowrap"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 40,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}>
          <div className="text-primary">{hoveredArea.title}</div>
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid white",
            }}
          />
        </div>
      )}

      {/* Conteneur principal */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="bg-gray-800 touch-none"
          style={{ touchAction: "none" }}>
          <defs>
            {/* Motif de grille */}
            <pattern
              id="gridPattern"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#374151"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Groupe avec transformation */}
          <g
            transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
            {/* Image de fond ou motif */}
            {imageSrc ? (
              <image
                href={imageSrc}
                width={imageWidth}
                height={imageHeight}
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <rect
                width={imageWidth}
                height={imageHeight}
                fill="url(#gridPattern)"
                opacity="0.1"
              />
            )}

            {/* Zones interactives */}
            {mapAreas.map((area) => {
              const isHovered = hoveredArea?.id === area.id;
              const isAnimating = animatingArea === area.id;
              const perimeter = getPolygonPerimeter(area.coords);

              return (
                <g key={area.id}>
                  {/* Polygone principal */}
                  <polygon
                    points={coordsToPoints(area.coords)}
                    fill={
                      isHovered ? "rgba(255, 255, 255, 0.25)" : "transparent"
                    }
                    stroke="transparent"
                    strokeWidth="0"
                    style={{
                      cursor: "pointer",
                      transition: "fill 0.3s ease",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onMouseEnter={(e) => handleAreaMouseEnter(area, e)}
                    onMouseMove={handleAreaMouseMove}
                    onMouseLeave={handleAreaMouseLeave}
                  />

                  {/* Contour animé pour le survol */}
                  {isAnimating && (
                    <polygon
                      points={coordsToPoints(area.coords)}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeDasharray={`${perimeter}`}
                      strokeDashoffset={perimeter}
                      className="animate-draw-border"
                      style={{
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default InteractiveMap;
