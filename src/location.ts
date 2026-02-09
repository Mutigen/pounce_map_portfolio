import { getMap } from './map';
import { calculateDistance, log, showToast } from './utils';
import type { Lead } from './types';

let userMarker: google.maps.Marker | null = null;

/** Request user location, pan map, show blue dot */
export function goToUserLocation(leads: Lead[]): void {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude: lat, longitude: lng } = position.coords;
      const map = getMap();

      // Pan to user location
      map.panTo({ lat, lng });
      map.setZoom(15);

      // Show user position marker (blue dot)
      if (userMarker) userMarker.setMap(null);
      userMarker = new google.maps.Marker({
        position: { lat, lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
        },
        zIndex: 9999,
        title: 'Your location',
      });

      // Find 5 nearest leads
      const nearest = findNearestLeads(lat, lng, leads, 5);
      if (nearest.length > 0) {
        log(
          'Nearest leads:',
          nearest.map((l) => `${l.address} (${l.dist.toFixed(2)}mi)`),
        );
      }
    },
    (error) => {
      log('Geolocation error:', error);
      showToast('Could not get your location', 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 },
  );
}

interface LeadWithDist {
  address: string;
  dist: number;
}

function findNearestLeads(
  lat: number,
  lng: number,
  leads: Lead[],
  count: number,
): LeadWithDist[] {
  return leads
    .map((lead) => ({
      address: lead.address,
      dist: calculateDistance(lat, lng, lead.lat, lead.lng),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, count);
}
