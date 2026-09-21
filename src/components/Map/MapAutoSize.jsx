import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

// Leaflet mäter kartcontainerns storlek när den skapas. Om kartan sitter i
// en layout som ändras strax efter (andra sektioner som får sin höjd
// senare, flikar, modaler) blir kartan annars kvar med fel mått och visas
// som en grå ruta. Vi tvingar därför en omräkning strax efter montering.
export default function MapAutoSize() {
  const map = useMap();
  useEffect(() => {
    const timeouts = [50, 250, 600].map((delay) => setTimeout(() => map.invalidateSize(), delay));
    return () => timeouts.forEach(clearTimeout);
  }, [map]);
  return null;
}
