import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import config from './config';
import { createPinElement, createClusterSvg, svgToDataUrl } from './pins';
import { getMap } from './map';
import { log } from './utils';
import type { Lead, PinColor } from './types';

type AdvancedMarker = google.maps.marker.AdvancedMarkerElement & { _lead?: Lead };

let markers: AdvancedMarker[] = [];
let clusterer: MarkerClusterer | null = null;

/** Clear all markers and clustering */
export function clearMarkers(): void {
  for (const m of markers) m.map = null;
  markers = [];
  if (clusterer) {
    clusterer.clearMarkers();
    clusterer = null;
  }
}

/** Determine dominant color for a set of leads */
function dominantColor(leads: Lead[]): PinColor {
  let flash = 0,
    red = 0,
    orange = 0;
  for (const l of leads) {
    if (l.color === 'flash') flash++;
    else if (l.color === 'red') red++;
    else if (l.color === 'orange') orange++;
  }
  if (flash > 0) return 'flash';
  if (red > orange) return 'red';
  if (orange > 0) return 'orange';
  return 'blue';
}

/** Create markers for all leads with z-index ordering and clustering */
export function renderLeads(
  leads: Lead[],
  onPinClick: (lead: Lead) => void,
): void {
  clearMarkers();
  const map = getMap();

  log(`Rendering ${leads.length} leads`);

  for (const lead of leads) {
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: lead.lat, lng: lead.lng },
      content: createPinElement(lead.display_score, lead.color, lead.badge),
      title: lead.address,
      zIndex: config.PIN_Z_INDEX[lead.color] || 1000,
      gmpClickable: true,
    }) as AdvancedMarker;

    marker.addListener('gmp-click', () => onPinClick(lead));
    marker._lead = lead;
    markers.push(marker);
  }

  // Set up clustering with custom renderer showing dominant color
  const algorithm = new GridAlgorithm({
    gridSize: config.CLUSTER.gridSize,
    maxZoom: config.CLUSTER.maxZoom,
  });

  clusterer = new MarkerClusterer({
    map,
    markers,
    algorithm,
    renderer: {
      render({ count, position, markers: clusterMarkers }) {
        const clusterLeads = (clusterMarkers || [])
          .map((m) => (m as AdvancedMarker)._lead)
          .filter((l): l is Lead => l != null);
        const dominant = dominantColor(clusterLeads);
        const svg = createClusterSvg(count, dominant);
        const size = Math.min(50 + Math.floor(count / 100) * 5, 80);
        const half = size / 2;

        return new google.maps.Marker({
          position,
          icon: {
            url: svgToDataUrl(svg),
            scaledSize: new google.maps.Size(size, size),
            anchor: new google.maps.Point(half, half),
          },
          zIndex: 1000 + count,
        });
      },
    },
  });

  log('Markers rendered with clustering');
}
