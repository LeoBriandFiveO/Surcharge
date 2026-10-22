export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `Aujourd'hui à ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Hier à ${time}`;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) + ` à ${time}`;
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return '';
  const minutes = Math.max(1, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.', ',')} t`;
  return `${Math.round(kg)} kg`;
}

// Accepte "62,5" comme "62.5".
export function parseNumber(text: string): number {
  const n = Number(text.replace(',', '.').trim());
  return Number.isFinite(n) ? n : NaN;
}

export function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}
