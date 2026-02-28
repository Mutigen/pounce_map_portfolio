import type { PinColor } from './types';

const config = {
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  GOOGLE_MAPS_MAP_ID: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '',
  JSON_FEED_URL: import.meta.env.VITE_JSON_FEED_URL ?? '',
  MAKE_WEBHOOK_URL: import.meta.env.VITE_MAKE_WEBHOOK_URL ?? '',
  AIRTABLE_FORM_URL: import.meta.env.VITE_AIRTABLE_FORM_URL ?? '',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',

  MAP: {
    center: { lat: 30.2672, lng: -81.6557 } as google.maps.LatLngLiteral,
    zoom: 11,
    minZoom: 10,
    maxZoom: 18,
    styles: [
      {
        featureType: 'poi' as const,
        elementType: 'labels' as const,
        stylers: [{ visibility: 'off' as const }],
      },
    ],
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
  },

  CLUSTER: {
    gridSize: 60,
    maxZoom: 15,
    minimumClusterSize: 3,
  },

  PERFORMANCE: {
    viewportBuffer: 0.2,
    debounceDelay: 300,
  },

  REFRESH: {
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  },

  UI: {
    toastDuration: 3000,
    sheetAnimationDuration: 200,
    mapPanDuration: 300,
  },

  PIN_COLORS: {
    flash: '#FF6B00',
    purple: '#9333EA',
    red: '#DC2626',
    orange: '#F97316',
    blue: '#3B82F6',
  } as Record<PinColor, string>,

  FLASH_BORDER_COLOR: '#FFD700',

  PIN_Z_INDEX: {
    flash: 5000,
    purple: 4000,
    red: 3000,
    orange: 2000,
    blue: 1000,
  } as Record<PinColor, number>,
} as const;

export default config;
