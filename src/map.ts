import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import config from './config';
import { log } from './utils';

let map: google.maps.Map | null = null;

export function getMap(): google.maps.Map {
  if (!map) throw new Error('Map not initialized');
  return map;
}

export async function initMap(): Promise<google.maps.Map> {
  log('Loading Google Maps API...');

  setOptions({
    key: config.GOOGLE_MAPS_API_KEY,
    v: 'weekly',
  });

  await importLibrary('maps');
  await importLibrary('marker');

  log('Google Maps API loaded, initializing map...');

  const mapElement = document.getElementById('map');
  if (!mapElement) throw new Error('#map element not found');

  map = new google.maps.Map(mapElement, {
    center: config.MAP.center,
    zoom: config.MAP.zoom,
    minZoom: config.MAP.minZoom,
    maxZoom: config.MAP.maxZoom,
    mapId: config.GOOGLE_MAPS_MAP_ID,
    mapTypeControl: config.MAP.mapTypeControl,
    streetViewControl: config.MAP.streetViewControl,
    fullscreenControl: config.MAP.fullscreenControl,
    zoomControl: config.MAP.zoomControl,
    gestureHandling: 'greedy',
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },
  });

  log('Map initialized');
  return map;
}

export function fitBoundsToLeads(
  leads: Array<{ lat: number; lng: number }>,
): void {
  const m = getMap();
  if (leads.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  for (const lead of leads) {
    bounds.extend({ lat: lead.lat, lng: lead.lng });
  }
  m.fitBounds(bounds, { top: 50, bottom: 200, left: 20, right: 20 });
}
