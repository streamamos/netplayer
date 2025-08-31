export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const namedColorToRgb = (colorName: string) => {
  switch (colorName.toLowerCase()) {
    case 'white':
      return { r: 255, g: 255, b: 255 };
    case 'yellow':
      return { r: 255, g: 255, b: 0 };
    case 'red':
      return { r: 220, g: 20, b: 60 };
    case 'lightblue':
      return { r: 173, g: 216, b: 230 };
    default:
      return null;
  }
};

export const colorToRgba = (color: string, alpha: number) => {
  let rgb = null;
  if (color.startsWith('#')) {
    rgb = hexToRgb(color);
  } else {
    rgb = namedColorToRgb(color);
  }

  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  return `rgba(255, 255, 255, ${alpha})`; // Default to white with given alpha
};