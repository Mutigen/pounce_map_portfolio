/** Open turn-by-turn navigation to coordinates (iOS/Android/Desktop) */
export function navigateToProperty(lat: number, lng: number): void {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    // Try Google Maps app first, fall back to Apple Maps
    const gmapsUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    const appleMapsUrl = `maps://?daddr=${lat},${lng}&dirflg=d`;

    window.location.href = gmapsUrl;
    setTimeout(() => {
      window.location.href = appleMapsUrl;
    }, 500);
  } else if (isAndroid) {
    window.location.href = `google.navigation:q=${lat},${lng}&mode=d`;
  } else {
    // Desktop fallback: browser Google Maps
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      '_blank',
    );
  }
}
