export const captions = [
  'PALM BOULEVARD • 6:42 PM • GOLDEN HOUR',
  'PIER 26 • 7:05 AM • FIRST CAST',
  'OCEAN DRIVE • 7:40 PM • SKYLINE RUN',
  'ROUTE 87 • 12:04 AM • LAST STOP',
  'NEON STRIP • 1:17 AM • NO BRAKES',
  'THE PORTRAIT • 8:26 PM • MAIN CHARACTER',
];
export const sampleNames = ['boulevard', 'pier', 'aerial', 'gasstation', 'nightride', 'portrait'];
export function initialState(shot) {
  const state = { layout: 'slash', grade: 'Vice Sunset', grain: 20, width: 1920, height: 1080,
    title: 'VICE HEAT', subtitle: 'NEON CONFESSION', quote: 'PURE ADRENALINE IN EVERY FRAME - THE LEONIDA POST',
    furniture: { titleSize: 118 }, captions: [...captions], assignments: {}, framing: {}, selected: 0,
    accent: { panel: 3, grade: 'Neon Night' } };
  if (shot === 'magazine' || shot === '3') Object.assign(state, { layout: 'magazine', title: 'HEAT INDEX', grade: 'Duotone', subtitle: 'AFTER DARK', quote: 'THE NIGHT IS YOURS - THE LEONIDA POST', width: 1080, height: 1350, accent: null });
  if (shot === 'filmstrip' || shot === '4') Object.assign(state, { layout: 'filmstrip', title: 'NIGHT DRIVE', subtitle: 'AFTER DARK', quote: 'NO SLEEP ON THE COAST', width: 1080, height: 1080, accent: null });
  return state;
}
