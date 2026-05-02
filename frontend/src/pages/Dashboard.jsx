import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

// 🔢 Count animation hook
function useCountUp(target, duration = 1200, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let startTime = null;

    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration, start]);

  return count;
}

// 📊 Stat Card
function StatCard({ label, value, color, trigger }) {
  const count = useCountUp(value, 1200, trigger);

  return (
    <div
      style={{
        padding: 20,
        border: "1px solid #333",
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <p style={{ color: "#94a3b8", margin: 0 }}>{label}</p>
      <h2 style={{ color, marginTop: 6 }}>{count}</h2>
    </div>
  );
}

// 🚀 MAIN DASHBOARD
export default function Dashboard({
  patientContext,
  messageCount = 0,
  stats = {},
}) {
  const [triggered, setTriggered] = useState(false);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => setTriggered(true), 200);
    return () => clearTimeout(t);
  }, []);

  // 📊 Dynamic Stats
  const dynamicStats = [
    {
      label: "PubMed Papers",
      value: stats?.pubmed ?? (messageCount ? messageCount * 10 : 0),
      color: "#06b6d4",
    },
    {
      label: "Clinical Trials",
      value: stats?.trials ?? (messageCount ? messageCount * 3 : 0),
      color: "#8b5cf6",
    },
    {
      label: "OpenAlex Works",
      value: stats?.openalex ?? (messageCount ? messageCount * 6 : 0),
      color: "#10b981",
    },
    {
      label: "Messages",
      value: messageCount,
      color: "#f59e0b",
    },
  ];

  // 📈 Chart Data
  useEffect(() => {
    const pubmed = stats?.pubmed ?? 40;
    const trials = stats?.trials ?? 20;
    const openalex = stats?.openalex ?? 15;
    const fda = stats?.fda ?? 10;

    const total = pubmed + trials + openalex + fda;

    setChartData([
      { name: "PubMed", value: pubmed },
      { name: "ClinicalTrials", value: trials },
      { name: "OpenAlex", value: openalex },
      { name: "FDA", value: fda },
      {
        name: "Other",
        value: Math.max(100 - total, 5),
      },
    ]);
  }, [stats, messageCount]);

  return (
    <div
      style={{
        padding: 30,
        background: "#020817",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>Research Dashboard</h1>

      {/* 🧠 Disease Info */}
      {patientContext?.disease && (
        <p style={{ color: "#06b6d4" }}>
          Disease: {patientContext.disease}
        </p>
      )}

      {/* 📊 Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginTop: 20,
        }}
      >
        {dynamicStats.map((s) => (
          <StatCard key={s.label} {...s} trigger={triggered} />
        ))}
      </div>

      {/* 📈 Pie Chart */}
      <div style={{ width: "100%", height: 300, marginTop: 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" outerRadius={100}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}