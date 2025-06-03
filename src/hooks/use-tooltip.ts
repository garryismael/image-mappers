import type { MapArea } from "@/components/ImageMapper";
import type { Tooltip } from "@/components/TooltipDisplay";
import { useState, type MouseEvent } from "react";

export const useTooltip = () => {
  const [tooltip, setTooltip] = useState<Tooltip>({
    visible: false,
    x: 0,
    y: 0,
    text: "",
  });

  const handleMouseEnter = (area: MapArea, _index: number, e: MouseEvent) => {
    console.log(_index, e);
    setTooltip((prev) => ({
      ...prev,
      visible: true,
      text: area.title || area.id,
    }));
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: "" });
  };

  // Nouvelle fonction pour gérer le mouvement de la souris sur le conteneur principal
  const handleContainerMouseMove = (e: MouseEvent) => {
    if (tooltip.visible) {
      // Utiliser les coordonnées relatives au conteneur principal
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setTooltip((prev) => ({
        ...prev,
        x: x + 10, // Offset pour éviter que le tooltip couvre le curseur
        y: y - 60, // Placer au-dessus du curseur
      }));
    }
  };

  const handleTooltipMouseMove = (
    _area: MapArea,
    _index: number,
    e: MouseEvent
  ) => {
    console.log(_area, _index, e);
  };

  return {
    tooltip,
    handleMouseEnter,
    handleMouseLeave,
    handleTooltipMouseMove,
    handleContainerMouseMove, // Nouvelle fonction exportée
  };
};
