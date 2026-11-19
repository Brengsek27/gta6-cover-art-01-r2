export const grades = ['Vice Sunset', 'Neon Night', 'Golden Hour', 'Duotone', 'Comic Ink', 'Halftone Print', 'Natural'];
const cache = new WeakMap();
const clamp = value => Math.max(0, Math.min(255, value));

export function graded(image, name, grain = 20) {
  if (!cache.has(image)) cache.set(image, new Map());
  const key = `${name}:${grain}`;
  if (cache.get(image).has(key)) return cache.get(image).get(key);
  const canvas = document.createElement('canvas');
  const factor = Math.min(1, 1500 / Math.max(image.width, image.height));
  canvas.width = Math.round(image.width * factor); canvas.height = Math.round(image.height * factor);
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  const original = new Uint8ClampedArray(pixels.data);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const position = index / 4, column = position % canvas.width, row = Math.floor(position / canvas.width);
    let red = original[index], green = original[index + 1], blue = original[index + 2];
    const luminance = red * .299 + green * .587 + blue * .114;
    if (name === 'Duotone') {
      const amount = Math.max(0, Math.min(1, (luminance - 18) / 220));
      red = 27 + 225 * amount; green = 17 + 161 * amount; blue = 61 + 110 * amount;
    } else {
      const saturation = name === 'Natural' ? 1 : name === 'Neon Night' ? 1.45 : 1.28;
      red = luminance + (red - luminance) * saturation;
      green = luminance + (green - luminance) * saturation;
      blue = luminance + (blue - luminance) * saturation;
      const contrast = name === 'Natural' ? 1 : 1.12;
      red = (red - 128) * contrast + 128; green = (green - 128) * contrast + 128; blue = (blue - 128) * contrast + 128;
      if (name === 'Vice Sunset') { red += 22; green -= 4; blue += luminance < 110 ? 16 : -18; }
      if (name === 'Neon Night') { red = red * .83 + 25; green *= .70; blue = blue * 1.22 + 20; }
      if (name === 'Golden Hour') { red += 26; green += 12; blue *= .78; }
      if (name === 'Comic Ink') {
        const next = Math.min(index + 4, original.length - 4), down = Math.min(index + canvas.width * 4, original.length - 4);
        const edge = Math.abs(original[index] - original[next]) + Math.abs(original[index] - original[down]);
        if (edge > 52) { red = 22; green = 14; blue = 34; }
        else { red = Math.round(red / 48) * 48; green = Math.round(green / 48) * 48; blue = Math.round(blue / 48) * 48; }
      }
      if (name === 'Halftone Print') {
        const dot = Math.hypot(column % 7 - 3, row % 7 - 3);
        const ink = dot < (1 - luminance / 255) * 4.4;
        red = ink ? 35 : 247; green = ink ? 25 : 204; blue = ink ? 56 : 160;
      }
    }
    const radius = Math.hypot((column / canvas.width - .5) * 1.4, (row / canvas.height - .5) * 1.4);
    const vignette = 1 - Math.max(0, radius - .25) * .24;
    const noise = (((position * 1664525 + 1013904223) >>> 8) % 101 / 100 - .5) * grain * .65;
    pixels.data[index] = clamp(red * vignette + noise + 3);
    pixels.data[index + 1] = clamp(green * vignette + noise + 1);
    pixels.data[index + 2] = clamp(blue * vignette + noise);
  }
  context.putImageData(pixels, 0, 0);
  context.fillStyle = 'rgba(255,155,84,.035)'; context.fillRect(0, 0, canvas.width, canvas.height);
  const entries = cache.get(image); if (entries.size > 18) entries.clear();
  entries.set(key, canvas); return canvas;
}
