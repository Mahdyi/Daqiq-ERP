export const DASHBOARD_PLACEHOLDER_LABELS = {
  eyebrow: 'داشبورد',
  title: 'زیرساخت پوسته ERP آماده است',
  description:
    'این صفحه فقط جایگاه اولیه داشبورد است. در مراحل بعدی، ماژول‌های واقعی، داده‌ها، نقش‌ها و ابزارهای سازمانی به صورت lazy-loaded به این پوسته متصل می‌شوند.',
  infrastructureStatus: 'وضعیت زیرساخت',
  metrics: [
    {
      label: 'وضعیت PrimeNG',
      value: 'Aura فعال'
    },
    {
      label: 'ساختار مسیرها',
      value: 'آماده lazy-load'
    },
    {
      label: 'چیدمان',
      value: 'RTL shell'
    }
  ]
} as const;
