export function formatTeacherCode(code: string | null | undefined): string {
  if (!code) return 'Unknown';
  const parts = code.split('_');
  if (parts.length < 2) return code;
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + '_' + parts[1].toUpperCase();
}
