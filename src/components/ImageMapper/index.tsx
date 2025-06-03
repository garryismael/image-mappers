import { TooltipDisplay } from "@/components/TooltipDisplay";
import { useTooltip } from "@/hooks/use-tooltip";
import { useTransform } from "@/hooks/use-transform";
import { useRef } from "react";
import ReactImageMapper, {
  type MapArea as ReactImgArea,
  type RefProperties,
} from "react-img-mapper";

export interface MapArea extends ReactImgArea {
  title?: string;
}

type Props = {
  areas: MapArea[];
  src: string;
};

function ImageMapper({ src, areas }: Props) {
  const ref = useRef<RefProperties>(null);

  const {
    containerRef,
    transform,
    isDragging,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getCursor,
  } = useTransform();

  const {
    tooltip,
    handleMouseEnter,
    handleMouseLeave,
    handleTooltipMouseMove,
    handleContainerMouseMove, // Nouvelle fonction
  } = useTooltip();

  // Fonction combinée pour gérer les événements de souris
  const handleCombinedMouseMove = (e: React.MouseEvent) => {
    handleMouseMove(e); // Gestion du pan/drag
    handleContainerMouseMove(e); // Mise à jour de la position du tooltip
  };

  return (
    <div className="relative max-h-dvh h-dvh w-full overflow-hidden">
      {/* Main container with event handling */}
      <div
        ref={containerRef}
        className={`relative w-full h-full ${getCursor()}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleCombinedMouseMove} // Fonction combinée
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          handleMouseLeave(); // Cacher le tooltip quand on sort du conteneur
        }}>
        {/* ImageMapper with transformation */}
        <div
          style={{
            transform: `scale(${transform.scale}) translate(${
              transform.translateX / transform.scale
            }px, ${transform.translateY / transform.scale}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}>
          <div className="w-full h-full">
            <ReactImageMapper
              ref={ref}
              src={src}
              name="zululami-map"
              areas={areas}
              responsive={true}
              imgWidth={2560}
              parentWidth={1920}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onMouseMove={handleTooltipMouseMove}
            />
          </div>
        </div>
      </div>

      <TooltipDisplay tooltip={tooltip} />
    </div>
  );
}

export default ImageMapper;
