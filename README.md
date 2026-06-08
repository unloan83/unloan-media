# Multibagger Portfolio Dashboard

A Vercel-ready portfolio dashboard built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui-style components, Recharts, and PapaParse.

## Features

- Upload a simple current portfolio and watchlist CSV in the browser.
- Fetch CMP, previous close, volume, headline signals, sector, and valuation details after upload.
- Portfolio summary cards for value, daily movement, watchlist count, and top sector.
- Portfolio growth chart.
- Holdings table with value, return, and allocation weight.
- Sector allocation pie chart.
- Portfolio heatmap sized by portfolio weight and colored by return.
- Automatic symbol and sector identification for common Indian stocks.

## CSV Format

Use the included sample at `public/portfolio.csv`.

```csv
list,stock,quantity
current,Reliance Industries,42
current,TCS,28
watchlist,Maruti Suzuki India,
```

Required columns:

- `list` - use `current` or `watchlist`
- `stock` - stock name or NSE symbol, such as `Reliance Industries`, `TCS`, or `HDFCBANK`

Optional column:

- `quantity` - required for `current` rows, optional for `watchlist` rows.

After upload, the app resolves the stock name or symbol and fetches CMP, previous close, volume, and available headline signals using a Next.js API route.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New Project** and import the GitHub repository.
3. Keep the framework preset as **Next.js**.
4. Use the default build command:

```bash
npm run build
```

5. Use the default output settings and deploy.

No environment variables are required for the dashboard.
