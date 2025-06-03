import "./App.css";
import InteractiveMap, { type MapArea } from "./components/InteractiveMap";
import { areas } from "./constants";
import { getMediaUrl } from "./utils";

export default function App() {
  const handleAreaClick = (area: MapArea) => {
    alert(`Vous avez cliqué sur: ${area.title}`);
  };

  return (
    <InteractiveMap
      imageSrc={getMediaUrl("/images/img-maps.jpg")}
      imageWidth={2560}
      imageHeight={1974}
      mapAreas={areas}
      onAreaClick={handleAreaClick}
    />
  );
}
