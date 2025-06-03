import type { MapArea } from "../InteractiveMap";

export interface TooltipPos {
  x: number;
  y: number;
}

interface TooltipDisplayProps {
  tooltipPos: TooltipPos;
  hoveredArea: MapArea;
}

export const TooltipDisplay = ({
  tooltipPos,
  hoveredArea,
}: TooltipDisplayProps) => {
  return (
    <div
      className="absolute px-6 hidden lg:block py-1.5 z-50 bg-white text-sm font-medium pointer-events-none shadow-md border border-gray-200 whitespace-nowrap"
      style={{
        left: tooltipPos.x,
        top: tooltipPos.y - 60,
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
  );
};
