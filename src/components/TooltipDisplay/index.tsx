export interface Tooltip {
  visible: boolean;
  x: number;
  y: number;
  text: string;
}

interface TooltipDisplayProps {
  tooltip: Tooltip;
}

export const TooltipDisplay = ({ tooltip }: TooltipDisplayProps) => {
  if (!tooltip.visible) return null;

  return (
    <div
      className="absolute px-3 py-2 z-50 bg-white text-sm font-medium rounded-md pointer-events-none shadow-lg border border-gray-200 whitespace-nowrap"
      style={{
        top: tooltip.y,
        left: tooltip.x,
        transform: "translateX(-50%)", // Centrer horizontalement par rapport au curseur
      }}>
      <span className="text-primary">{tooltip.text}</span>
      {/* Petite flèche pointant vers le bas */}
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
