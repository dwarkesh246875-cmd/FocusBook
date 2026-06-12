export const THEME_ORDER = ['morning', 'midday', 'golden', 'night', 'midnight'];

export const getAutoTheme = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'midday';
  if (h >= 17 && h < 20) return 'golden';   // warm amber dusk
  if (h >= 20 && h < 23) return 'night';
  return 'midnight';
};
