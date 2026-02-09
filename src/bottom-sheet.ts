import { getMap } from './map';
import { renderContactsSection } from './contacts';
import { navigateToProperty } from './deep-links';
import { renderLogNoteForm, submitLogNote } from './log-note';
import type { Lead, NoteType } from './types';

type SnapPoint = 0.3 | 0.6 | 0.9;
const SNAP_POINTS: SnapPoint[] = [0.3, 0.6, 0.9];

export class BottomSheet {
  private element: HTMLElement;
  private content: HTMLElement;
  private backdrop: HTMLElement;
  private handle: HTMLElement;
  private currentSnap: SnapPoint = 0.6;
  private currentLead: Lead | null = null;
  private isOpen = false;
  private showingForm = false;

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
    // Backdrop click to close
    this.backdrop.addEventListener('click', () => this.close());

    // Handle touch events for swipe gestures
    this.handle.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
    this.handle.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.handle.addEventListener('touchend', () => this.onTouchEnd());

    // Event delegation for content buttons
    this.content.addEventListener('click', (e) => this.onContentClick(e));
  }

  show(lead: Lead): void {
    if (this.isOpen && this.showingForm) this.hideLogNoteForm();
    this.currentLead = lead;
    this.showingForm = false;
    this.renderContent(lead);

    // Pan map to center the pin
    const map = getMap();
    map.panTo({ lat: lead.lat, lng: lead.lng });

    // Show sheet and backdrop
    this.element.classList.remove('hidden');
    this.backdrop.classList.add('visible');
    this.isOpen = true;

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
      this.isOpen = false;
      this.currentLead = null;
      this.showingForm = false;
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
    const displayScore = lead.display_score || String(lead.score);
    const scoreClass = this.getScoreClass(lead.color);
    const scoreLabel = this.getScoreLabel(scoreClass);

    const cityState = [lead.city, lead.state].filter(Boolean).join(', ');
    const location = [cityState, lead.zip].filter(Boolean).join(' ');

    const tags = (lead.tags || []).filter(Boolean);

    const daysUntilAuction = lead.days_until_auction;
    const showAuction =
      daysUntilAuction != null && daysUntilAuction <= 7 && daysUntilAuction >= 0;

    this.content.innerHTML = `
      <div class="sheet-header">
        <div class="sheet-address">${lead.address}</div>
        ${location ? `<div class="sheet-location">${location}</div>` : ''}
      </div>

      <div class="sheet-pills">
        <span class="sheet-score-pill ${scoreClass}">Score: ${displayScore} (${scoreLabel})</span>
        ${tags.map((tag) => `<span class="sheet-tag">${tag}</span>`).join('')}
      </div>

      ${
        showAuction
          ? `<div class="sheet-auction-row">
              <span class="sheet-auction-icon">&#128293;</span>
              <span class="sheet-auction-text">Auction in ${daysUntilAuction} day${daysUntilAuction !== 1 ? 's' : ''}</span>
              ${lead.auction_date ? `<span class="sheet-auction-date">${lead.auction_date}</span>` : ''}
            </div>`
          : ''
      }

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
      this.showLogNoteForm();
    } else if (action === 'cancel-form') {
      this.hideLogNoteForm();
    }
  }

  private showLogNoteForm(): void {
    if (!this.currentLead) return;
    this.showingForm = true;

    const actionsEl = this.content.querySelector('#sheet-actions');
    if (!actionsEl) return;

    actionsEl.innerHTML = renderLogNoteForm();
    this.snapTo(0.9);

    // Bind form events
    const form = this.content.querySelector('#log-note-form') as HTMLFormElement;
    const cancelBtn = this.content.querySelector('#log-note-cancel');

    cancelBtn?.addEventListener('click', () => this.hideLogNoteForm());

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentLead) return;

      const noteType = (this.content.querySelector('#note-type') as HTMLSelectElement)?.value as NoteType;
      const notes = (this.content.querySelector('#note-text') as HTMLTextAreaElement)?.value || '';

      if (!noteType) return;

      // Disable submit button
      const submitBtn = this.content.querySelector('#log-note-submit') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      const success = await submitLogNote(this.currentLead, noteType, notes);

      if (success) {
        this.close();
      } else if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    });
  }

  private hideLogNoteForm(): void {
    if (!this.currentLead) return;
    this.showingForm = false;

    const actionsEl = this.content.querySelector('#sheet-actions');
    if (!actionsEl) return;

    actionsEl.innerHTML = `
      <button class="sheet-btn sheet-btn-navigate" data-action="navigate">
        <span class="sheet-btn-icon">&#128663;</span>
        NAVIGATE
      </button>
      <button class="sheet-btn sheet-btn-note" data-action="log-note">
        <span class="sheet-btn-icon">&#128221;</span>
        LOG NOTE
      </button>
    `;
    this.snapTo(0.6);
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
