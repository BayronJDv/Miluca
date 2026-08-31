export function formatMesAnio(iso: string | null | undefined): string {
  if (!iso) return '';
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  return match ? `${match[2]}/${match[1]}` : iso;
}
