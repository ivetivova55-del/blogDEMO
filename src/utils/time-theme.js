const TIME_THEME_INDIGO = 'indigo';

export function getThemeByHour(hour) {
  if (hour >= 8 && hour <= 11) return 'purple';
  if (hour >= 12 && hour <= 15) return 'violet';
  if (hour >= 16 && hour <= 17) return 'blue';
  if (hour >= 18 && hour <= 20) return 'green';
  return TIME_THEME_INDIGO;
}

export function applyTimeTheme(date = new Date()) {
  const hour = date.getHours();
  const theme = getThemeByHour(hour);
  document.documentElement.setAttribute('data-time-theme', theme);
  return theme;
}
