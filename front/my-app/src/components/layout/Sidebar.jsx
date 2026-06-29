import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Tag,
  Leaf,
} from "lucide-react";
import AuthContext from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard",            icon: LayoutDashboard, end: true },
  { label: "Products",  to: "/dashboard/products",   icon: Package  },
  { label: "Brands",    to: "/dashboard/brands",     icon: Tag      },
  { label: "Notes",     to: "/dashboard/notes",      icon: Leaf     }, // ✅ added
  { label: "Orders",    to: "/dashboard/orders",     icon: ShoppingCart },
  { label: "Users",     to: "/dashboard/users",      icon: Users    },
  { label: "Analytics", to: "/dashboard/analytics",  icon: BarChart3 },
];

function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside
      className="relative flex flex-col h-screen flex-shrink-0 transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? 68 : 220,
        background: "var(--color-ink)",
        borderRight: "0.5px solid var(--color-charcoal)",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 h-16 flex-shrink-0 overflow-hidden"
        style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
      >
        <span
          className="text-lg tracking-[4px] uppercase font-light flex-shrink-0"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}
        >
          L&apos;<span style={{ color: "var(--color-gold)" }}>A</span>
        </span>
        {!collapsed && (
          <span
            className="text-xs tracking-[3px] uppercase whitespace-nowrap"
            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
          >
            Admin Panel
          </span>
        )}
      </div>

      {/* ── Collapse Toggle ───────────────────────────────────────────── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-[72px] z-10 w-6 h-6 flex items-center justify-center transition-colors duration-150"
        style={{
          background: "var(--color-ink)",
          border: "0.5px solid var(--color-charcoal)",
          borderRadius: "50%",
          color: "var(--color-smoke)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* ── Nav Items ─────────────────────────────────────────────────── */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                title={collapsed ? label : undefined}
                className="relative flex items-center gap-3 px-3 py-2.5 transition-all duration-150"
                style={({ isActive }) => ({
                  color:      isActive ? "var(--color-gold)"    : "var(--color-mist)",
                  background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
                  fontFamily: "var(--font-body)",
                  borderLeft: isActive ? "2px solid var(--color-gold)" : "2px solid transparent",
                  borderRadius: "2px",
                })}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.dataset.active)
                    e.currentTarget.style.color = "var(--color-pearl)";
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.dataset.active)
                    e.currentTarget.style.color = "var(--color-mist)";
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} strokeWidth={isActive ? 2 : 1.6} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-xs tracking-[1.5px] uppercase whitespace-nowrap">
                        {label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── User + Logout ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 p-3 space-y-1"
        style={{ borderTop: "0.5px solid var(--color-charcoal)" }}
      >
        {/* User info */}
        <div className={`flex items-center gap-2.5 px-2 py-2 overflow-hidden ${collapsed ? "justify-center" : ""}`}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase flex-shrink-0"
            style={{
              background: "rgba(201,168,76,0.15)",
              border: "0.5px solid var(--color-gold)",
              color: "var(--color-gold)",
              fontFamily: "var(--font-body)",
            }}
          >
            {user?.name?.[0] ?? "A"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}
              >
                {user?.name}
              </p>
              <p
                className="text-[10px] truncate mt-0.5"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}
              >
                {user?.email}
              </p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors duration-150 text-xs tracking-[1.5px] uppercase ${collapsed ? "justify-center" : ""}`}
          style={{
            color: "var(--color-smoke)",
            fontFamily: "var(--font-body)",
            background: "transparent",
            border: "none",
            borderRadius: "2px",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#c47a7a";
            e.currentTarget.style.background = "rgba(180,60,60,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-smoke)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={15} strokeWidth={1.6} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;