import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Package, ShoppingCart, DollarSign,
  TrendingUp, AlertCircle, Clock, CheckCircle2,
  Truck, XCircle, ArrowRight, BarChart3, Tag, Leaf,
} from "lucide-react";
import { getDashboardStats } from "../../api/admin.api";

const fmt$ = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const STATUS_CONFIG = {
  pending:   { label: "Pending",   Icon: Clock,        color: "var(--color-gold)",  bg: "rgba(201,168,76,0.1)",  border: "rgba(201,168,76,0.25)"  },
  shipped:   { label: "Shipped",   Icon: Truck,        color: "#7aabcc",            bg: "rgba(60,120,180,0.1)",  border: "rgba(60,120,180,0.25)"  },
  delivered: { label: "Delivered", Icon: CheckCircle2, color: "#70a880",            bg: "rgba(30,80,50,0.15)",   border: "rgba(60,120,80,0.25)"   },
  cancelled: { label: "Cancelled", Icon: XCircle,      color: "#c08080",            bg: "rgba(160,60,60,0.1)",   border: "rgba(160,60,60,0.25)"   },
};

function StatCard({ title, value, icon: Icon, link, loading }) {
  return (
    <Link to={link}
      className="group flex flex-col gap-4 p-5 transition-all duration-200"
      style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-charcoal)")}
    >
      <div className="flex items-center justify-between">
        <p className="text-[9px] tracking-[3px] uppercase"
          style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>{title}</p>
        <Icon size={15} strokeWidth={1.5} style={{ color: "var(--color-gold)" }} />
      </div>
      {loading
        ? <div className="h-8 w-24 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
        : <p style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 400, color: "var(--color-pearl)" }}>
            {value}
          </p>
      }
      <div className="flex items-center gap-1 text-[10px] tracking-[1px] uppercase transition-colors duration-150"
        style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
        <span className="group-hover:text-[--color-gold] transition-colors">View details</span>
        <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] tracking-[2px] uppercase"
      style={{ color: cfg.color, background: cfg.bg, border: `0.5px solid ${cfg.border}`, fontFamily: "var(--font-body)" }}>
      <cfg.Icon size={9} strokeWidth={1.5} />{cfg.label}
    </span>
  );
}

function RecentOrderRow({ order }) {
  const firstItem  = order.items?.[0];
  const extraCount = (order.items?.length ?? 1) - 1;
  const primaryImg = firstItem?.productId?.images?.find((i) => i.isPrimary) ?? firstItem?.productId?.images?.[0];

  return (
    <div className="flex items-center gap-4 py-3"
      style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
      <div className="shrink-0 overflow-hidden"
        style={{ width: 36, height: 36, background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)" }}>
        {primaryImg?.url
          ? <img src={primaryImg.url} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <Package size={13} strokeWidth={1} style={{ color: "var(--color-smoke)" }} />
            </div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate"
          style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
          {firstItem?.productId?.name ?? "Unknown product"}
          {extraCount > 0 && <span style={{ color: "var(--color-smoke)" }}> +{extraCount} more</span>}
        </p>
        <p className="text-[10px] mt-0.5"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      <StatusBadge status={order.status} />
      <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", color: "var(--color-pearl)", minWidth: 64, textAlign: "right" }}>
        {fmt$(order.total)}
      </span>
    </div>
  );
}

function LowStockRow({ product }) {
  const lowestStock = product.variants?.length
    ? Math.min(...product.variants.map((v) => v.stock))
    : 0;
  const isOut = lowestStock === 0;
  return (
    <div className="flex items-center justify-between p-3"
      style={{
        background: isOut ? "rgba(160,60,60,0.08)" : "rgba(201,168,76,0.06)",
        border: `0.5px solid ${isOut ? "rgba(160,60,60,0.25)" : "rgba(201,168,76,0.2)"}`,
      }}>
      <div className="flex items-center gap-3 min-w-0">
        <AlertCircle size={14} strokeWidth={1.5}
          style={{ color: isOut ? "#c08080" : "var(--color-gold)", flexShrink: 0 }} />
        <div className="min-w-0">
          <p className="text-xs font-medium truncate"
            style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{product.name}</p>
          <p className="text-[10px] mt-0.5"
            style={{ color: isOut ? "#c08080" : "var(--color-gold)", fontFamily: "var(--font-body)" }}>
            {isOut ? "Out of stock" : `${lowestStock} units remaining`}
          </p>
        </div>
      </div>
      <Link to="/dashboard/products"
        className="text-[10px] tracking-[1px] uppercase shrink-0 ml-3 transition-colors duration-150"
        style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
      >Restock →</Link>
    </div>
  );
}

function Dashboard() {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn:  getDashboardStats,
    staleTime: 30_000,
  });

  const lowStockProducts = (stats?.lowStockProducts ?? []).slice(0, 5);

  const statCards = [
    { title: "Total Users",    value: stats?.totalUsers    ?? 0, icon: Users,        link: "/dashboard/users"     },
    { title: "Total Products", value: stats?.totalProducts ?? 0, icon: Package,      link: "/dashboard/products"  },
    { title: "Total Orders",   value: stats?.totalOrders   ?? 0, icon: ShoppingCart, link: "/dashboard/orders"    },
    { title: "Total Revenue",  value: fmt$(stats?.totalRevenue ?? 0), icon: DollarSign, link: "/dashboard/analytics" },
  ];

  const quickActions = [
    { title: "Products",  description: "Add & manage products", icon: Package,      link: "/dashboard/products"  },
    { title: "Brands",    description: "Manage brands",          icon: Tag,          link: "/dashboard/brands"    },
    { title: "Notes",     description: "Manage fragrance notes", icon: Leaf,         link: "/dashboard/notes"     },
    { title: "Orders",    description: "Track & update orders",  icon: ShoppingCart, link: "/dashboard/orders"    },
    { title: "Users",     description: "Manage accounts",        icon: Users,        link: "/dashboard/users"     },
    { title: "Analytics", description: "Performance metrics",    icon: BarChart3,    link: "/dashboard/analytics" },
  ];

  return (
    <div className="p-6 lg:p-8" style={{ background: "var(--color-obsidian)", minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[9px] tracking-[5px] uppercase mb-1"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Admin</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "36px", fontWeight: 400, color: "var(--color-pearl)" }}>
            Dashboard
          </h1>
        </div>

        {isError && (
          <div className="flex items-center gap-3 mb-6 px-4 py-3 text-sm"
            style={{ background: "rgba(160,60,60,0.1)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
            <AlertCircle size={14} className="shrink-0" />
            Failed to load dashboard data. Please refresh the page.
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-10">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse" style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }} />
              ))
            : statCards.map((card, i) => <StatCard key={i} {...card} loading={false} />)
          }
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <p className="text-[9px] tracking-[4px] uppercase mb-4"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} to={action.link}
                  className="flex flex-col gap-3 p-4 transition-all duration-200 group"
                  style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-charcoal)")}
                >
                  <Icon size={18} strokeWidth={1.5} style={{ color: "var(--color-gold)" }} />
                  <div>
                    <p className="text-xs font-medium"
                      style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{action.title}</p>
                    <p className="text-[10px] mt-0.5"
                      style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{action.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Orders */}
          <div style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
              <p className="text-[9px] tracking-[4px] uppercase"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Recent Orders</p>
              <Link to="/dashboard/orders"
                className="text-[10px] tracking-[1px] uppercase flex items-center gap-1 transition-colors duration-150"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
              >View all <ArrowRight size={10} /></Link>
            </div>
            <div className="px-5 py-2">
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 my-2 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
                  ))
                : stats?.recentOrders?.length > 0
                  ? stats.recentOrders.map((order) => <RecentOrderRow key={order._id} order={order} />)
                  : <div className="flex flex-col items-center py-10"
                      style={{ color: "var(--color-charcoal)" }}>
                      <ShoppingCart size={28} strokeWidth={1} />
                      <p className="text-xs mt-2" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>No orders yet</p>
                    </div>
              }
            </div>
          </div>

          {/* Low Stock */}
          <div style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
              <p className="text-[9px] tracking-[4px] uppercase"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Low Stock Alerts</p>
              <Link to="/dashboard/products"
                className="text-[10px] tracking-[1px] uppercase flex items-center gap-1 transition-colors duration-150"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
              >View all <ArrowRight size={10} /></Link>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse" style={{ background: "var(--color-charcoal)" }} />
                  ))
                : lowStockProducts.length > 0
                  ? lowStockProducts.map((p) => <LowStockRow key={p._id} product={p} />)
                  : <div className="flex flex-col items-center py-10">
                      <TrendingUp size={28} strokeWidth={1} style={{ color: "var(--color-charcoal)" }} />
                      <p className="text-xs mt-2" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>All products well stocked</p>
                    </div>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;