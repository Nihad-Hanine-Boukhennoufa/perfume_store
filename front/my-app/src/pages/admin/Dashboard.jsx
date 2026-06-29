import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowRight,
  BarChart3,
  Tag,
} from "lucide-react";
import { getDashboardStats } from "../../api/admin.api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);

const STATUS_CONFIG = {
  pending:   { label: "Pending",   icon: Clock,        color: "text-amber-500",  bg: "bg-amber-50"   },
  shipped:   { label: "Shipped",   icon: Truck,        color: "text-blue-500",   bg: "bg-blue-50"    },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-emerald-500",bg: "bg-emerald-50" },
  cancelled: { label: "Cancelled", icon: XCircle,      color: "text-red-500",    bg: "bg-red-50"     },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, icon, lightColor, textColor, link, loading }) {
  const Icon = icon;
  return (
    <Link
      to={link}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse mt-2" />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1.5 tabular-nums">
              {value}
            </p>
          )}
        </div>
        <div
          className={`${lightColor} p-3 rounded-xl ml-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
        >
          <Icon className={textColor} size={20} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs text-gray-400 group-hover:text-blue-500 transition-colors">
        <span>View details</span>
        <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

function OrderStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

function RecentOrderRow({ order }) {
  const firstItem = order.items?.[0];
  const extraCount = (order.items?.length ?? 1) - 1;

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
          {firstItem?.productId?.image ? (
            <img
              src={firstItem.productId.image}
              alt={firstItem.productId.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package size={14} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {firstItem?.productId?.name ?? "Unknown product"}
            {extraCount > 0 && (
              <span className="ml-1.5 text-xs text-gray-400 font-normal">
                +{extraCount} more
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <OrderStatusBadge status={order.status} />
        <span className="text-sm font-bold text-gray-900 tabular-nums">
          {formatCurrency(order.total)}
        </span>
      </div>
    </div>
  );
}

function LowStockRow({ product }) {
  const urgency =
    product.stock === 0 ? "red" : product.stock <= 3 ? "red" : product.stock <= 5 ? "orange" : "yellow";

  const urgencyMap = {
    red:    { bg: "bg-red-50 border-red-100",       icon: "text-red-500",    bar: "bg-red-400",    label: product.stock === 0 ? "Out of stock" : `${product.stock} left` },
    orange: { bg: "bg-orange-50 border-orange-100", icon: "text-orange-500", bar: "bg-orange-400", label: `${product.stock} left` },
    yellow: { bg: "bg-amber-50 border-amber-100",   icon: "text-amber-500",  bar: "bg-amber-400",  label: `${product.stock} left` },
  };
  const u = urgencyMap[urgency];

  return (
    <div className={`flex items-center justify-between p-3.5 ${u.bg} rounded-xl border`}>
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle className={u.icon} size={16} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
          <p className={`text-xs font-medium mt-0.5 ${u.icon}`}>{u.label}</p>
        </div>
      </div>
      <Link
        to="/dashboard/products"
        className="text-xs text-blue-600 hover:text-blue-700 font-bold flex-shrink-0 ml-3 hover:underline"
      >
        Restock
      </Link>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
          <div className="h-8 w-24 bg-gray-100 rounded" />
        </div>
        <div className="h-11 w-11 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-3 w-16 bg-gray-100 rounded mt-5" />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    staleTime: 30_000,
  });

  const lowStockProducts = (stats?.lowStockProducts ?? [])
    .filter((p) => p.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const statCards = [
    {
      title: "Total Users",
      value: formatNumber(stats?.totalUsers ?? 0),
      icon: Users,
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      link: "/dashboard/users",
    },
    {
      title: "Total Products",
      value: formatNumber(stats?.totalProducts ?? 0),
      icon: Package,
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      link: "/dashboard/products",
    },
    {
      title: "Total Orders",
      value: formatNumber(stats?.totalOrders ?? 0),
      icon: ShoppingCart,
      lightColor: "bg-violet-50",
      textColor: "text-violet-600",
      link: "/dashboard/orders",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
      link: "/dashboard/analytics",
    },
  ];

  const quickActions = [
    {
      title: "Products",
      description: "Add, edit & manage products",
      icon: Package,
      link: "/dashboard/products",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Brands",
      description: "Manage product brands",
      icon: Tag,
      link: "/dashboard/brands",
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      title: "Orders",
      description: "Track & update orders",
      icon: ShoppingCart,
      link: "/dashboard/orders",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      title: "Analytics",
      description: "Sales & performance metrics",
      icon: BarChart3,
      link: "/dashboard/analytics",
      gradient: "from-orange-500 to-rose-500",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Here's a live snapshot of your store.
          </p>
        </div>

        {/* ── Error banner ────────────────────────────────────────────── */}
        {isError && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>Failed to load dashboard data. Please refresh the page.</span>
          </div>
        )}

        {/* ── Stats Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((card, i) => (
                <StatCard key={i} {...card} loading={false} />
              ))}
        </div>

        {/* ── Quick Actions ────────────────────────────────────────────── */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  to={action.link}
                  className={`bg-gradient-to-br ${action.gradient} text-white rounded-2xl p-5 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shadow-sm`}
                >
                  <Icon size={24} className="mb-3 opacity-90" />
                  <h3 className="font-bold text-sm mb-0.5">{action.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Bottom Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
              <Link
                to="/dashboard/orders"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : stats?.recentOrders?.length > 0 ? (
              <div>
                {stats.recentOrders.map((order) => (
                  <RecentOrderRow key={order._id} order={order} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <ShoppingCart size={36} className="mb-2" />
                <p className="text-sm font-medium">No orders yet</p>
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Low Stock Alerts</h2>
              <Link
                to="/dashboard/products"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : lowStockProducts.length > 0 ? (
              <div className="space-y-2.5">
                {lowStockProducts.map((product) => (
                  <LowStockRow key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <TrendingUp size={36} className="mb-2" />
                <p className="text-sm font-medium">All products are well stocked</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;