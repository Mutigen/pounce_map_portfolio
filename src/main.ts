import '../styles/main.css';
import '../styles/bottom-sheet.css';
import '../styles/loading.css';

import { initMap, fitBoundsToLeads } from './map';
import { renderLeads } from './markers';
import { BottomSheet } from './bottom-sheet';
import { fetchLeads, startAutoRefresh, isDemoMode } from './data';
import { goToUserLocation } from './location';
import { log, showToast } from './utils';
import type { Lead } from './types';

let bottomSheet: BottomSheet;
let currentLeads: Lead[] = [];

async function init(): Promise<void> {
  log('Starting Pounce Map v2.3.1...');
  const loadingScreen = document.getElementById('loading-screen');
  const loadingCount = loadingScreen?.querySelector('.loading-count');

  try {
    // 1. Initialize Google Maps (dynamic load)
    await initMap();

    // 2. Initialize bottom sheet
    bottomSheet = new BottomSheet();

    // 3. Fetch leads
    currentLeads = await fetchLeads();
    if (loadingCount) {
      loadingCount.textContent = `${currentLeads.length} leads loaded`;
    }

    // 4. Render markers on map
    if (currentLeads.length > 0) {
      renderLeads(currentLeads, handlePinClick);
      fitBoundsToLeads(currentLeads);
    } else {
      showToast('No leads found', 'info');
    }

    // 5. Start auto-refresh (every 5 minutes, skip in demo mode)
    if (!isDemoMode) {
      startAutoRefresh((leads) => {
        currentLeads = leads;
        renderLeads(leads, handlePinClick);
      });
    }

    // 6. Setup location button
    setupLocationButton();

    // 7. Show demo banner if needed
    if (isDemoMode) {
      showDemoBanner();
    }

    // 8. Hide loading screen
    hideLoading(loadingScreen);

    log('Pounce Map ready');
  } catch (error) {
    log('Initialization failed:', error);
    showToast('Failed to initialize app', 'error');
    hideLoading(loadingScreen);
  }
}

function handlePinClick(lead: Lead): void {
  bottomSheet.show(lead);
}

function setupLocationButton(): void {
  const btn = document.getElementById('location-btn');
  btn?.addEventListener('click', () => {
    goToUserLocation(currentLeads);
  });
}

function showDemoBanner(): void {
  const banner = document.createElement('div');
  banner.id = 'demo-banner';
  banner.textContent = '⚡ DEMO MODE — sample data only';
  document.body.appendChild(banner);
}

function hideLoading(el: HTMLElement | null): void {
  if (!el) return;
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.3s';
  setTimeout(() => {
    el.style.display = 'none';
  }, 300);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
