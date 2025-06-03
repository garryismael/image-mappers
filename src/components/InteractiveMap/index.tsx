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
  onAreaClick,
  onAreaHover,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedArea, setSelectedArea] = useState<MapArea | null>(null);
  const [hoveredArea, setHoveredArea] = useState<MapArea | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

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
        setTransform(prev => constrainTransform(prev.x, prev.y, prev.scale));
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

  // Gestion du clic sur une zone
  const handleAreaClick = useCallback(
    (area: MapArea): void => {
      setSelectedArea(area);
      if (onAreaClick) {
        onAreaClick(area);
      }
    },
    [onAreaClick]
  );

  // Gestion du survol
  const handleAreaMouseEnter = useCallback(
    (area: MapArea, e: React.MouseEvent): void => {
      setHoveredArea(area);
      setTooltipPos({ x: e.clientX, y: e.clientY });
      if (onAreaHover) {
        onAreaHover(area);
      }
    },
    [onAreaHover]
  );

  const handleAreaMouseMove = useCallback((e: React.MouseEvent): void => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleAreaMouseLeave = useCallback((): void => {
    setHoveredArea(null);
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
      {/* Tooltip */}
      {hoveredArea && (
        <div 
          className="fixed z-30 bg-white text-xs text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y - 60,
            transform: tooltipPos.x > window.innerWidth - 200 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="font-semibold text-primary">{hoveredArea.title}</div>
        </div>
      )}

      {/* Panneau d'information pour la zone sélectionnée */}
      {selectedArea && (
        <div className="absolute top-4 right-4 z-20 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h3 className="font-bold text-lg mb-2">{selectedArea.title}</h3>
          <p className="text-sm text-gray-600">ID: {selectedArea.id}</p>
          <p className="text-sm text-gray-600">Type: {selectedArea.shape}</p>
          <p className="text-xs text-green-600 mt-1">Sélectionné</p>
          <button 
            onClick={() => setSelectedArea(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            ✕ Fermer
          </button>
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
            {mapAreas.map((area) => (
              <polygon
                key={area.id}
                points={coordsToPoints(area.coords)}
                fill={
                  hoveredArea?.id === area.id
                    ? "rgba(255, 255, 255, 0.25)"
                    : selectedArea?.id === area.id
                    ? "rgba(34, 197, 94, 0.3)"
                    : "transparent"
                }
                stroke={
                  hoveredArea?.id === area.id
                    ? "white"
                    : selectedArea?.id === area.id
                    ? "#22c55e"
                    : "transparent"
                }
                strokeWidth={
                  hoveredArea?.id === area.id
                    ? 3
                    : selectedArea?.id === area.id
                    ? 2
                    : 0
                }
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAreaClick(area);
                }}
                onMouseEnter={(e) => handleAreaMouseEnter(area, e)}
                onMouseMove={handleAreaMouseMove}
                onMouseLeave={handleAreaMouseLeave}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

export default InteractiveMap;