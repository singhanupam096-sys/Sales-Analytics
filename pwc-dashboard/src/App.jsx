import { useState, useMemo } from "react";
import Papa from "papaparse";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { salesData as defaultData } from "./data";

const CATEGORY_COLORS = ["#0F6B5C", "#C08A2E", "#B23A48", "#4C5B68"];
const REQUIRED_COLUMNS = ["date", "region", "category", "revenue", "units"];

function groupByDate(rows) {
  const grouped = {};
  rows.forEach((r) => {
    const d = r.date;
    if (!grouped[d]) grouped[d] = { date: d, revenue: 0, units: 0, count: 0 };
    grouped[d].revenue += Number(r.revenue || 0);
    grouped[d].units += Number(r.units || 0);
    grouped[d].count += 1;
  });
  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

function pctChange(first, last) {
  if (!first) return null;
  return ((last - first) / Math.abs(first)) * 100;
}

function formatMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function App() {
  const [data, setData] = useState(defaultData);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  const regions = ["All", ...new Set(data.map((d) => d.region))];

  const filteredData = useMemo(() => {
    if (selectedRegion === "All") return data;
    return data.filter((d) => d.region === selectedRegion);
  }, [data, selectedRegion]);

  const totalRevenue = filteredData.reduce((sum, d) => sum + Number(d.revenue), 0);
  const totalUnits = filteredData.reduce((sum, d) => sum + Number(d.units), 0);
  const avgOrderValue = totalUnits ? totalRevenue / totalUnits : 0;
  const transactionCount = filteredData.length;

  const dateBuckets = useMemo(() => groupByDate(filteredData), [filteredData]);
  const firstBucket = dateBuckets[0];
  const lastBucket = dateBuckets[dateBuckets.length - 1];
  const hasTrend = dateBuckets.length > 1;

  const revenueTrendPct = hasTrend ? pctChange(firstBucket.revenue, lastBucket.revenue) : null;
  const unitsTrendPct = hasTrend ? pctChange(firstBucket.units, lastBucket.units) : null;
  const txTrendPct = hasTrend ? pctChange(firstBucket.count, lastBucket.count) : null;
  const avgTrendPct = hasTrend
    ? pctChange(
        firstBucket.units ? firstBucket.revenue / firstBucket.units : 0,
        lastBucket.units ? lastBucket.revenue / lastBucket.units : 0
      )
    : null;

  const revenueByRegion = useMemo(() => {
    const grouped = {};
    filteredData.forEach((d) => {
      grouped[d.region] = (grouped[d.region] || 0) + Number(d.revenue);
    });
    return Object.entries(grouped).map(([region, revenue]) => ({ region, revenue }));
  }, [filteredData]);

  const revenueByCategory = useMemo(() => {
    const grouped = {};
    filteredData.forEach((d) => {
      grouped[d.category] = (grouped[d.category] || 0) + Number(d.revenue);
    });
    return Object.entries(grouped).map(([category, revenue]) => ({ name: category, value: revenue }));
  }, [filteredData]);

  const topRegion = useMemo(
    () => [...revenueByRegion].sort((a, b) => b.revenue - a.revenue)[0],
    [revenueByRegion]
  );
  const topCategory = useMemo(
    () => [...revenueByCategory].sort((a, b) => b.value - a.value)[0],
    [revenueByCategory]
  );
  const topCategoryShare = topCategory && totalRevenue
    ? ((topCategory.value / totalRevenue) * 100).toFixed(0)
    : 0;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields?.map((f) => f.toLowerCase().trim()) || [];
        const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
        if (missing.length > 0) {
          setError(
            `We couldn't read this file — it's missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`
          );
          return;
        }
        setError(null);
        setFileName(file.name);
        setData(results.data);
        setSelectedRegion("All");
      },
      error: () => {
        setError("We couldn't parse this file. Make sure it's a valid CSV.");
      },
    });
    e.target.value = "";
  };

  const resetToSampleData = () => {
    setData(defaultData);
    setFileName(null);
    setError(null);
    setSelectedRegion("All");
  };

  return (
    <div className="min-h-screen font-sans text-ink">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Masthead */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b-2 border-ink">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-teal uppercase mb-2">
              Quarterly Performance Review
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-medium leading-tight">
              Sales Analytics
            </h1>
            <p className="text-sm text-ink/60 mt-2">
              {fileName ? `Source file: ${fileName}` : "Source: sample dataset (Jan–Apr 2024)"}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <label className="cursor-pointer font-mono text-xs tracking-wide uppercase border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors">
              ↑ Import CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            {fileName && (
              <button
                onClick={resetToSampleData}
                className="text-xs text-ink/50 underline hover:text-ink"
              >
                Reset to sample data
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="mt-6 border border-brick bg-brick/5 text-brick px-4 py-3 text-sm flex justify-between items-start gap-4">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-mono text-xs underline shrink-0">
              Dismiss
            </button>
          </div>
        )}

        {/* Region filter */}
        <div className="flex flex-wrap gap-2 mt-8">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRegion(r)}
              className={`px-4 py-1.5 text-sm font-mono border transition-colors ${
                selectedRegion === r
                  ? "bg-ink text-paper border-ink"
                  : "border-line text-ink/70 hover:border-ink"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Ledger strip */}
        <div className="mt-6 bg-white border border-line grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-line">
          <LedgerCell label="Total Revenue" value={formatMoney(totalRevenue)} trend={revenueTrendPct} />
          <LedgerCell label="Units Sold" value={totalUnits.toLocaleString()} trend={unitsTrendPct} />
          <LedgerCell label="Avg Order Value" value={formatMoney(avgOrderValue.toFixed(2))} trend={avgTrendPct} />
          <LedgerCell label="Transactions" value={transactionCount.toLocaleString()} trend={txTrendPct} />
        </div>

        {/* Exhibits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          <Exhibit
            label="Exhibit A"
            title="Revenue by Region"
            caption={
              topRegion
                ? `${topRegion.region} leads all regions at ${formatMoney(topRegion.revenue)} in the current view.`
                : "No data in the current view."
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByRegion}>
                <CartesianGrid stroke="#D8DEE4" vertical={false} />
                <XAxis dataKey="region" tick={{ fill: "#10233B", fontSize: 12, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#D8DEE4" }} tickLine={false} />
                <YAxis tick={{ fill: "#10233B", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#D8DEE4" }} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "1px solid #10233B", borderRadius: 0, fontFamily: "IBM Plex Sans", fontSize: 13 }}
                  formatter={(v) => formatMoney(v)}
                />
                <Bar dataKey="revenue" fill="#0F6B5C" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Exhibit>

          <Exhibit
            label="Exhibit B"
            title="Revenue by Category"
            caption={
              topCategory
                ? `${topCategory.name} accounts for ${topCategoryShare}% of revenue in the current view.`
                : "No data in the current view."
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={revenueByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ border: "1px solid #10233B", borderRadius: 0, fontFamily: "IBM Plex Sans", fontSize: 13 }}
                  formatter={(v) => formatMoney(v)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-1">
              {revenueByCategory.map((c, i) => (
                <span key={c.name} className="flex items-center gap-1.5 text-xs font-mono text-ink/70">
                  <span
                    className="inline-block w-2.5 h-2.5"
                    style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  {c.name}
                </span>
              ))}
            </div>
          </Exhibit>
        </div>

        <div className="mt-6">
          <Exhibit
            label="Exhibit C"
            title="Revenue Trend"
            caption={
              hasTrend && revenueTrendPct !== null
                ? `Revenue moved from ${formatMoney(firstBucket.revenue)} in ${firstBucket.date} to ${formatMoney(lastBucket.revenue)} in ${lastBucket.date}, a ${revenueTrendPct >= 0 ? "gain" : "decline"} of ${Math.abs(revenueTrendPct).toFixed(1)}%.`
                : "Not enough periods in the current view to show a trend."
            }
          >
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dateBuckets}>
                <CartesianGrid stroke="#D8DEE4" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#10233B", fontSize: 12, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#D8DEE4" }} tickLine={false} />
                <YAxis tick={{ fill: "#10233B", fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: "#D8DEE4" }} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "1px solid #10233B", borderRadius: 0, fontFamily: "IBM Plex Sans", fontSize: 13 }}
                  formatter={(v) => formatMoney(v)}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10233B" strokeWidth={2} dot={{ r: 3, fill: "#0F6B5C" }} />
              </LineChart>
            </ResponsiveContainer>
          </Exhibit>
        </div>

        <footer className="mt-10 pt-6 border-t border-line text-xs text-ink/50 font-mono">
          Required columns for import: date, region, category, revenue, units
        </footer>
      </div>
    </div>
  );
}

function LedgerCell({ label, value, trend }) {
  return (
    <div className="p-5">
      <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-ink/50">{label}</p>
      <p className="font-mono text-2xl mt-2">{value}</p>
      <TrendChip value={trend} />
    </div>
  );
}

function TrendChip({ value }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <p className="font-mono text-xs text-ink/30 mt-2">—</p>;
  }
  const isUp = value >= 0;
  return (
    <p className={`font-mono text-xs mt-2 ${isUp ? "text-teal" : "text-brick"}`}>
      {isUp ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </p>
  );
}

function Exhibit({ label, title, caption, children }) {
  return (
    <div className="bg-white border border-line p-6">
      <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-teal">{label}</p>
      <h2 className="font-display text-xl mt-1 mb-4">{title}</h2>
      {children}
      <p className="font-display italic text-sm text-ink/70 mt-4 pt-4 border-t border-line">
        {caption}
      </p>
    </div>
  );
}

export default App;
