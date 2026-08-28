# Sales Analytics Dashboard

A React + Recharts dashboard for visualizing sales data — built for a Data Analytics/Tech portfolio project.

## Features
- 4 KPI summary cards (Total Revenue, Total Units, Avg Order Value, Transaction Count)
- Bar chart: Revenue by Region
- Pie chart: Revenue by Category
- Line chart: Revenue Trend Over Time
- Region filter dropdown (updates all charts/KPIs live)
- CSV upload — drop in your own data (columns: date, region, category, revenue, units) and the dashboard updates instantly
- Comes with sample data pre-loaded, plus a `sample-data.csv` you can use to test the upload feature

## Setup

1. Unzip this folder and open it in VS Code.
2. Open a terminal in VS Code (`` Ctrl+` ``) and run:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the localhost link shown in the terminal (usually `http://localhost:5173`).

## Build for deployment

```bash
npm run build
```

This creates a `dist` folder — drag it into https://app.netlify.com/drop for an instant live link.

## Tech stack
- React (Vite)
- Recharts (charts)
- PapaParse (CSV parsing)
- Tailwind CSS (styling)
