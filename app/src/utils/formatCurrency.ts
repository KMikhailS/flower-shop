const rubleFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export const formatRuble = (value: number): string => {
  const amount = Number.isFinite(value) ? value : 0;
  return rubleFormatter.format(amount);
};
