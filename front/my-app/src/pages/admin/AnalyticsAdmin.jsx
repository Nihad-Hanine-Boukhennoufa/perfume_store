import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users as UsersIcon,
  Calendar,
  Package,
} from "lucide-react";
import { getDashboardStats } from "../../api/admin.api";
import { getAllOrders } from "../../api/order.api.js";
import { getAllUsers } from "../../api/user.api.js";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_COLORS = {
  pending:   "#F59E0B",
  shipped:   "#3B82F6",
  delivered: "#10B981",
  cancelled: "#EF4444",
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f172a] text-white rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="font-semibold mb-1.5 text-gray-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("revenue") ? fmt$(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ title, value, change, icon: Icon, lightColor, textColor }) {
  const changeNum  = parseFloat(change);
  const isPositive = changeNum >= 0;
  const hasChange  = change !== null && !isNaN(changeNum);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <div className={`${lightColor} p-3 rounded-xl`}>
          <Icon className={textColor} size={18} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2 tabular-nums">{value}</p>
      {hasChange && (
        <div className="flex items-center gap-1 text-xs">
          {isPositive ? (
            <TrendingUp className="text-emerald-500" size={14} />
          ) : (
            <TrendingDown className="text-red-500" size={14} />
          )}
          <span className={isPositive ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
            {isPositive ? "+" : ""}{change}%
          </span>
          <span className="text-gray-400">vs prev. period</span>
        </div>
      )}
    </div>
  );
}

// ─── Chart Card ──────────────────────────────────────────────────────────────

function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      <h2 className="text-base font-bold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function AnalyticsAdmin() {
  const [timeRange, setTimeRange] = useState("30");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    staleTime: 30_000,
  });

  // Fix: fetch all orders, not just first page — pass high limit or a dedicated
  // "all" flag depending on what your API supports.
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => getAllOrders({ page: 1, limit: 10_000 }),
  });

  // Fix: fetch all users with a high limit so role/growth counts are complete.
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users-analytics"],
    queryFn: () => getAllUsers({ page: 1, limit: 10_000, search: "", role: "" }),
  });

  // getAllOrders already unwraps res.data.data and returns a plain array.
  const orders = ordersData ?? [];
  const users  = usersData?.data ?? [];

  // ── Time-filtered orders ────────────────────────────────────────────────────
  const days = parseInt(timeRange);

  const filteredOrders = orders.filter((o) => {
    const daysAgo = (Date.now() - new Date(o.createdAt)) / 86_400_000;
    return daysAgo <= days;
  });

  const previousOrders = orders.filter((o) => {
    const daysAgo = (Date.now() - new Date(o.createdAt)) / 86_400_000;
    return daysAgo > days && daysAgo <= days * 2;
  });

  // Fix: use the same delivered-only filter for both revenue and avg order value
  const deliveredFiltered  = filteredOrders.filter((o) => o.status === "delivered");
  const deliveredPrevious  = previousOrders.filter((o) => o.status === "delivered");

  const totalRevenue  = deliveredFiltered.reduce((s, o) => s + o.total, 0);
  const prevRevenue   = deliveredPrevious.reduce((s, o) => s + o.total, 0);

  // Fix: return null when there's no previous period data so the MetricCard
  // hides the change indicator rather than showing a misleading 0%.
  const revenueGrowth = prevRevenue > 0
    ? (((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
    : null;

  const ordersGrowth = previousOrders.length > 0
    ? (((filteredOrders.length - previousOrders.length) / previousOrders.length) * 100).toFixed(1)
    : null;

  // Fix: divide by delivered count only, matching the revenue numerator
  const avgOrderValue = deliveredFiltered.length > 0
    ? totalRevenue / deliveredFiltered.length
    : 0;

  // ── Revenue by month (from backend) ────────────────────────────────────────
  const revenueByMonth = (stats?.revenueByMonth ?? [])
    .filter((item) => item?._id?.month)
    .map((item) => ({
      month:   MONTH_NAMES[item._id.month - 1] ?? `M${item._id.month}`,
      revenue: item.total ?? 0,
      orders:  item.count ?? 0,
    }));

  // ── Last 7 days revenue (uses filteredOrders so time range is consistent) ──
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dayOrders = filteredOrders.filter(
      (o) => new Date(o.createdAt).toDateString() === date.toDateString() && o.status === "delivered"
    );
    return {
      date:    label,
      revenue: parseFloat(dayOrders.reduce((s, o) => s + o.total, 0).toFixed(2)),
      orders:  dayOrders.length,
    };
  });

  // ── User growth last 7 days ─────────────────────────────────────────────────
  const userGrowth = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      newUsers: users.filter(
        (u) => new Date(u.createdAt).toDateString() === date.toDateString()
      ).length,
    };
  });

  // Fix: use filteredOrders so the status chart responds to the time range too
  const ordersByStatus = ["pending", "shipped", "delivered", "cancelled"].map((s) => ({
    name:  s.charAt(0).toUpperCase() + s.slice(1),
    value: filteredOrders.filter((o) => o.status === s).length,
    color: STATUS_COLORS[s],
  })).filter((s) => s.value > 0);

  // Fix: use filteredOrders so top products respond to the time range
  const productSales = {};
  filteredOrders.forEach((order) => {
    order.items?.forEach((item) => {
      const id   = item.productId?._id ?? item.productId;
      const name = item.productId?.name ?? "Unknown";
      if (!productSales[id]) productSales[id] = { name, quantity: 0, revenue: 0 };
      productSales[id].quantity += item.quantity;
      productSales[id].revenue  += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((p) => ({
      name:     p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name,
      sales:    parseFloat(p.revenue.toFixed(2)),
      quantity: p.quantity,
    }));

  const userRoles = [
    { name: "Users",  value: users.filter((u) => u.role === "user").length,  color: "#3B82F6" },
    { name: "Admins", value: users.filter((u) => u.role === "admin").length, color: "#8B5CF6" },
  ].filter((r) => r.value > 0);

  const metrics = [
    { title: "Total Revenue",    value: fmt$(totalRevenue),   change: revenueGrowth, icon: DollarSign,   lightColor: "bg-emerald-50", textColor: "text-emerald-600" },
    { title: "Total Orders",     value: filteredOrders.length,change: ordersGrowth,  icon: ShoppingCart, lightColor: "bg-blue-50",    textColor: "text-blue-600"    },
    { title: "Avg. Order Value", value: fmt$(avgOrderValue),  change: null,          icon: TrendingUp,   lightColor: "bg-violet-50",  textColor: "text-violet-600"  },
    { title: "Total Users",      value: users.length,         change: null,          icon: UsersIcon,    lightColor: "bg-amber-50",   textColor: "text-amber-600"   },
  ];

  // Fix: combine all three loading states — charts should not render with empty
  // data while orders or users are still being fetched.
  if (statsLoading || ordersLoading || usersLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-400 mt-1 text-sm">Track your store's performance and insights</p>
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm w-fit">
            <Calendar className="text-gray-400" size={15} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm text-gray-700 font-medium bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* ── Metric Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
        </div>

        {/* ── Row 1: Revenue over time + Monthly revenue ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Daily Revenue (last 7 days)">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="url(#revenueGrad)" strokeWidth={2.5} name="Revenue" dot={{ r: 3, fill: "#3B82F6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Revenue (12 months)">
            {revenueByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-300 text-sm">No revenue data yet</div>
            )}
          </ChartCard>
        </div>

        {/* ── Row 2: Order status + User growth ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Orders by Status">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%" cy="50%"
                    outerRadius={95} innerRadius={45}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {ordersByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-300 text-sm">No orders in this period</div>
            )}
          </ChartCard>

          <ChartCard title="New User Registrations (last 7 days)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="newUsers" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ── Row 3: Top products + User roles ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Top Selling Products">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="sales" fill="#F59E0B" radius={[0, 4, 4, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-300 text-sm">No sales data yet</div>
            )}
          </ChartCard>

          <ChartCard title="User Role Distribution">
            {userRoles.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={userRoles}
                    cx="50%" cy="50%"
                    outerRadius={95} innerRadius={45}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {userRoles.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-300 text-sm">No users yet</div>
            )}
          </ChartCard>
        </div>

        {/* ── Best Performing Products Table ────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50">
            <h2 className="text-base font-bold text-gray-900">Best Performing Products</h2>
          </div>
          {topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Rank", "Product", "Units Sold", "Revenue"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topProducts.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          index === 0 ? "bg-amber-100 text-amber-700"  :
                          index === 1 ? "bg-gray-100 text-gray-600"    :
                          index === 2 ? "bg-orange-100 text-orange-600":
                          "bg-blue-50 text-blue-500"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Package size={13} className="text-gray-400" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 font-medium">{product.quantity}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-emerald-600">{fmt$(product.sales)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-300 text-sm">No sales data available</div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AnalyticsAdmin;