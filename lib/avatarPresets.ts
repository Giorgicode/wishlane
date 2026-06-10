export const AVATAR_PRESETS = [
  { key: 'rose',   color: '#FF6B81' },
  { key: 'teal',   color: '#5AF0D0' },
  { key: 'gold',   color: '#C8A95A' },
  { key: 'purple', color: '#A78BFA' },
  { key: 'blue',   color: '#60A5FA' },
  { key: 'green',  color: '#34D399' },
  { key: 'orange', color: '#FB923C' },
  { key: 'pink',   color: '#F472B6' },
];

export function isPreset(url: string | null | undefined): boolean {
  return !!url?.startsWith('preset:');
}

export function presetColor(url: string | null | undefined): string {
  const key = url?.replace('preset:', '') ?? '';
  return AVATAR_PRESETS.find((p) => p.key === key)?.color ?? '#FF6B81';
}
