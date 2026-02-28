import { getMap } from './map';
import { renderContactsSection } from './contacts';
import { navigateToProperty } from './deep-links';
import { fireKillSwitch, openAirtableForm } from './log-note';
import { showToast, escapeHtml } from './utils';
import type { Lead } from './types';

type SnapPoint = 0.3 | 0.6 | 0.9;
const SNAP_POINTS: SnapPoint[] = [0.3, 0.6, 0.9];

export class BottomSheet {
  private element: HTMLElement;
  private content: HTMLElement;
  private backdrop: HTMLElement;
  private handle: HTMLElement;
  private currentSnap: SnapPoint = 0.6;
  private currentLead: Lead | null = null;
  private openedAt = 0;

  // Touch tracking
  private startY = 0;
  private currentY = 0;
  private isDragging = false;

  constructor() {
    this.element = document.getElementById('bottom-sheet')!;
    this.content = this.element.querySelector('.bottom-sheet-content')!;
    this.handle = this.element.querySelector('.bottom-sheet-handle')!;
    this.backdrop = document.getElementById('bottom-sheet-backdrop')!;

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Backdrop click to close — 300ms cooldown prevents ghost click from pin tap
    this.backdrop.addEventListener('click', () => {
      if (Date.now() - this.openedAt > 300) this.close();
    });

    // Handle touch events for swipe gestures
    this.handle.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    this.handle.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.handle.addEventListener('touchend', () => this.onTouchEnd());

    // Event delegation for content buttons
    this.content.addEventListener('click', (e) => this.onContentClick(e));
  }

  show(lead: Lead): void {
    this.openedAt = Date.now();
    this.currentLead = lead;
    this.renderContent(lead);

    // Pan map to center the pin
    const map = getMap();
    map.panTo({ lat: lead.lat, lng: lead.lng });

    // Show sheet and backdrop
    this.element.classList.remove('hidden');
    this.backdrop.classList.add('visible');

    // Animate to default snap point
    requestAnimationFrame(() => {
      this.snapTo(0.6);
      this.element.classList.add('visible');
    });
  }

  close(): void {
    this.element.classList.remove('visible');
    this.backdrop.classList.remove('visible');
    this.element.style.transform = 'translateY(100%)';

    setTimeout(() => {
      this.element.classList.add('hidden');
      this.currentLead = null;
    }, 200);
  }

  private snapTo(point: SnapPoint): void {
    this.currentSnap = point;
    const height = point * 100;
    this.element.style.transition = 'transform 0.2s ease-out, height 0.2s ease-out';
    this.element.style.height = `${height}vh`;
    this.element.style.transform = 'translateY(0)';
  }

  private renderContent(lead: Lead): void {
    const displayScore = escapeHtml(lead.display_score || String(lead.score));
    const scoreClass = this.getScoreClass(lead.color);
    const scoreLabel = this.getScoreLabel(scoreClass);

    this.content.innerHTML = `
      <div class="sheet-header">
        <div class="sheet-address">${escapeHtml(lead.address)}</div>
      </div>

      <div class="sheet-pills">
        <span class="sheet-score-pill ${scoreClass}">Score: ${displayScore} (${scoreLabel})</span>
        ${lead.lead_type ? `<span class="sheet-tag">${escapeHtml(lead.lead_type)}</span>` : ''}
      </div>

      ${renderContactsSection(lead.contacts)}

      <div id="sheet-actions" class="sheet-actions">
        <button class="sheet-btn sheet-btn-navigate" data-action="navigate">
          <span class="sheet-btn-icon">&#128663;</span>
          NAVIGATE
        </button>
        <button class="sheet-btn sheet-btn-note" data-action="log-note">
          <span class="sheet-btn-icon">&#128221;</span>
          LOG NOTE
        </button>
      </div>
    `;
  }

  private onContentClick(e: Event): void {
    const target = e.target as HTMLElement;
    const btn = target.closest('[data-action]') as HTMLElement | null;
    if (!btn || !this.currentLead) return;

    const action = btn.dataset.action;

    if (action === 'navigate') {
      navigateToProperty(this.currentLead.lat, this.currentLead.lng);
    } else if (action === 'log-note') {
      fireKillSwitch(this.currentLead);
      openAirtableForm(this.currentLead);
      showToast('Kill switch activated', 'info');
      this.close();
    }
  }

  // ---- Touch gesture handling ----

  private onTouchStart(e: TouchEvent): void {
    this.isDragging = true;
    this.startY = e.touches[0].clientY;
    this.currentY = this.startY;
    this.element.style.transition = 'none';
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return;
    e.preventDefault();

    this.currentY = e.touches[0].clientY;
    const deltaY = this.currentY - this.startY;

    // Only allow dragging down (positive delta)
    if (deltaY > 0) {
      this.element.style.transform = `translateY(${deltaY}px)`;
    }
  }

  private onTouchEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;

    const deltaY = this.currentY - this.startY;
    const velocity = deltaY / (window.innerHeight * this.currentSnap);

    this.element.style.transition = 'transform 0.2s ease-out, height 0.2s ease-out';

    if (velocity > 0.5) {
      // Fast swipe down — close or go to lower snap
      const currentIdx = SNAP_POINTS.indexOf(this.currentSnap);
      if (currentIdx <= 0) {
        this.close();
      } else {
        this.snapTo(SNAP_POINTS[currentIdx - 1]);
      }
    } else if (velocity > 0.2) {
      // Moderate swipe — go to lower snap
      const currentIdx = SNAP_POINTS.indexOf(this.currentSnap);
      if (currentIdx > 0) {
        this.snapTo(SNAP_POINTS[currentIdx - 1]);
      } else {
        this.snapTo(this.currentSnap);
      }
    } else {
      // Not enough swipe — snap back
      this.snapTo(this.currentSnap);
    }
  }

  private getScoreClass(color: string): string {
    switch (color) {
      case 'red':
      case 'flash':
        return 'hot';
      case 'orange':
        return 'warm';
      case 'purple':
        return 'gap';
      default:
        return 'cold';
    }
  }

  private getScoreLabel(scoreClass: string): string {
    switch (scoreClass) {
      case 'hot':
        return 'HOT';
      case 'warm':
        return 'WARM';
      case 'gap':
        return 'DATA GAP';
      default:
        return 'COLD';
    }
  }
}
