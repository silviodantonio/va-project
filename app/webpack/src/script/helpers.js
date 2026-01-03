function desatAndLighten(hexColor, desaturate, lighten) {
  
  // Remove the hash if present
  let hex = hexColor.replace(/^#/, '');
  
  // Convert hex into a value between 0 and 1
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Magic for converting HEX into HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  
  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    
    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6;
    } else {
      h = ((r - g) / delta + 4) / 6;
    }
  }
  
  // Adjust saturation
  s = s * (1 - desaturate);
  
  // Adjust lightness
  if (lighten > 0) {
    // Lighten: move towards 1
    l = l + (1 - l) * lighten;
  } else if (lighten < 0) {
    // Darken: move towards 0
    l = l + l * lighten;
  }
  
  // Clamp values
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  
  
  const [newR, newG, newB] = hslToRgb(h, s, l);
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

const hslToRgb = (h, s, l) => {

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export const catColors = [
    '#377eb8',
    '#e41a1c',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf',
    '#999999'
];

// build array of Desaturated colors
export const catColorsDesat = catColors.map((color) => desatAndLighten(color, 0.3, 0.7));
