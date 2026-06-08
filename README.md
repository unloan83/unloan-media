# unloan stock portfolio dashboard

A Vercel-ready portfolio dashboard built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui-style components, Recharts, and PapaParse.

## Features

- Upload a simple portfolio CSV in the browser.
- Fetch CMP, previous close, volume, headline signals, sector, and valuation details after upload.
- Portfolio-specific summary cards for value, recommendation history, and live quote score.
- Investment appetite modes: safe, moderate, and aggressive.
- Portfolio growth chart.
- Holdings table with value, return, and allocation weight.
- Sector allocation pie chart.
- Portfolio heatmap sized by portfolio weight and colored by return.
- Automatic symbol and sector identification for common Indian stocks.

## CSV Format

Use the included sample at `public/portfolio.csv`.

```csv
stock code,company,quantity
RELIANCE,Reliance Industries,42
TCS,Tata Consultancy Services,28
MARUTI,Maruti Suzuki India,
```

Required columns:

- `stock code` - NSE symbol such as `RELIANCE`, `TCS`, or `HDFCBANK`
- `company` - company name

Optional column:

- `quantity` - rows with quantity become current holdings; blank or zero quantity rows become watchlist items.

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
