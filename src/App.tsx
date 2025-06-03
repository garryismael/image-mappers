import "./App.css";
import InteractiveMap from "./components/InteractiveMap";
import { areas, type MapArea } from "./constants";
import { getMediaUrl } from "./utils";

export default function App() {
  const handleAreaClick = (area: MapArea) => {
    alert(`Vous avez cliqué sur: ${area.title}`);
  };

  const handleAreaHover = (area: MapArea) => {
    console.log(`Survol de: ${area.title}`);
  };

  return (
    <InteractiveMap
      imageSrc={getMediaUrl("/images/img-maps.jpg")}
      imageWidth={2560}
      imageHeight={1974}
      mapAreas={areas}
      onAreaClick={handleAreaClick}
      onAreaHover={handleAreaHover}
    />
  );
}
