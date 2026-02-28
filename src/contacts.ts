import { escapeHtml } from './utils';
import type { Contact, ContactStatus } from './types';

const STATUS_ORDER: Record<ContactStatus, number> = {
  primary: 1,
  candidate: 2,
  wrong: 3,
  dnc: 4,
  inactive: 5,
};

/** Sort contacts: primary first, then candidate, then invalid */
export function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99),
  );
}

/** Render a single contact card as HTML */
function renderContactCard(contact: Contact): string {
  const isPrimary = contact.status === 'primary';
  const isInvalid = ['wrong', 'dnc', 'inactive'].includes(contact.status);

  const bgClass = isPrimary
    ? 'contact-card--primary'
    : isInvalid
      ? 'contact-card--invalid'
      : 'contact-card--default';

  const primaryBadge = isPrimary
    ? '<span class="contact-badge-primary">PRIMARY</span>'
    : '';

  const statusTag = isInvalid
    ? `<span class="contact-status-tag contact-status-${contact.status}">${
        contact.status === 'wrong'
          ? 'WRONG CONTACT'
          : contact.status === 'dnc'
            ? 'DO NOT CONTACT'
            : 'INACTIVE'
      }</span>`
    : '';

  const safePhone = contact.phone ? escapeHtml(contact.phone) : null;
  const phoneLink = safePhone
    ? `<div class="contact-phone-row">
        <a href="tel:${safePhone}" class="contact-phone">${safePhone}</a>
      </div>`
    : '';

  return `<div class="contact-card ${bgClass}">
    <div class="contact-card-header">
      ${isPrimary ? '<span class="contact-star">&#11088;</span>' : ''}
      <span class="contact-name">${escapeHtml(contact.name)}</span>
      ${primaryBadge}
    </div>
    ${phoneLink}
    <div class="contact-meta">
      <span>${escapeHtml(contact.source)}</span>
    </div>
    ${statusTag ? `<div class="contact-status-row">${statusTag}</div>` : ''}
  </div>`;
}

/** Render the full contacts section for the bottom sheet */
export function renderContactsSection(contacts: Contact[]): string {
  if (!contacts || contacts.length === 0) {
    return '<div class="contacts-empty">No contacts available</div>';
  }

  const sorted = sortContacts(contacts);
  return `<div class="contacts-section">
    <div class="contacts-header">
      ${contacts.length} Contact${contacts.length > 1 ? 's' : ''}
    </div>
    <div class="contacts-list">
      ${sorted.map(renderContactCard).join('')}
    </div>
  </div>`;
}
