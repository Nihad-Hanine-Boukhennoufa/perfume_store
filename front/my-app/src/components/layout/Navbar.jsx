import { Link, useLocation } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Heart, User, LogOut, ChevronDown, Menu, X, Search } from "lucide-react";

import AuthContext from "../../context/AuthContext.jsx";
import { getCart } from "../../api/cart.api";
import { getWishlist } from "../../api/wishlist.api";

const NAV_LINKS = [
  { to: "/",         label: "Home"        },
  { to: "/products", label: "Collections" },
  { to: "/about",    label: "About"       },
  { to: "/contact",  label: "Contact"     },
];

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[9px] font-medium leading-none rounded-full"
      style={{ background: "var(--color-gold)", color: "var(--color-obsidian)" }}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function IconBtn({ to, icon: IconComponent, count, label }) {
  return (
    <Link to={to} aria-label={label} className="relative p-2 transition-colors duration-200 group"
      style={{ color: "var(--color-mist)" }}>
      <IconComponent size={18} strokeWidth={1.5}
        className="transition-colors duration-200 group-hover:text-[--color-gold]"
        style={{ color: "inherit" }} />
      <Badge count={count} />
    </Link>
  );
}

function VDivider() {
  return <span className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "var(--color-charcoal)" }} />;
}

// ── Avatar — shows photo if available, otherwise initial ──────────────────────
function UserAvatar({ user, size = 28 }) {
  if (user?.image) {
    return (
      <img src={user.image} alt={user.name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size, border: "0.5px solid var(--color-gold)" }} />
    );
  }
  return (
    <span className="rounded-full flex items-center justify-center text-xs font-medium uppercase flex-shrink-0"
      style={{
        width: size, height: size,
        background: "rgba(201,168,76,0.15)",
        border: "0.5px solid var(--color-gold)",
        color: "var(--color-gold)",
        fontFamily: "var(--font-body)",
      }}>
      {user?.name?.[0] ?? <User size={13} />}
    </span>
  );
}

function Navbar() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const location = useLocation();
  const isUser = user?.role === "user";

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: !!user && isUser,
  });

  const { data: wishlistCount } = useQuery({
    queryKey: ["wishlistCount"],
    queryFn: async () => (await getWishlist()).length,
    enabled: !!user && isUser,
  });

  const cartCount     = cart?.items?.length ?? 0;
  const wishlistItems = wishlistCount ?? 0;

  if (isAdmin) return null;

  return (
    <>
      {/* Announcement bar */}
      <div className="hidden md:flex items-center justify-center h-8 text-[10px] tracking-[3px] uppercase"
        style={{ background: "var(--color-gold)", color: "var(--color-obsidian)" }}>
        Free shipping on orders over $150 &nbsp;·&nbsp; New arrivals every Friday
      </div>

      {/* Main navbar */}
      <nav className="fixed md:sticky top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(13,13,13,0.97)" : "var(--color-obsidian)",
          borderBottom: "0.5px solid var(--color-charcoal)",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex flex-col items-start leading-none group">
            <span className="text-xl tracking-[5px] uppercase font-light transition-colors duration-200"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>
              L&apos;<span style={{ color: "var(--color-gold)" }}>AURA</span>
            </span>
            <span className="text-[8px] tracking-[4px] uppercase mt-0.5 transition-colors duration-200 group-hover:opacity-100 opacity-60"
              style={{ fontFamily: "var(--font-body)", color: "var(--color-gold)" }}>
              Parfumerie
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => {
              const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <Link key={to} to={to}
                  className="relative px-4 py-2 text-xs tracking-[2px] uppercase transition-colors duration-200"
                  style={{ fontFamily: "var(--font-body)", color: active ? "var(--color-pearl)" : "var(--color-mist)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-pearl)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = active ? "var(--color-pearl)" : "var(--color-mist)")}
                >
                  {label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px transition-all duration-300"
                    style={{ background: "var(--color-gold)", width: active ? "24px" : "0px" }} />
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5">

            {/* Search */}
            <button className="p-2 transition-colors duration-200" style={{ color: "var(--color-mist)" }}
              aria-label="Search"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
            ><Search size={17} strokeWidth={1.5} /></button>

            {/* Wishlist + Cart */}
            {isUser && (
              <>
                <VDivider />
                <IconBtn to="/wishlist" icon={Heart}       count={wishlistItems} label="Wishlist" />
                <IconBtn to="/cart"     icon={ShoppingBag} count={cartCount}     label="Cart"     />
              </>
            )}

            <VDivider />

            {/* User dropdown */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 px-2 py-1.5 transition-colors duration-150"
                  aria-expanded={profileOpen}>
                  <UserAvatar user={user} />
                  <span className="hidden sm:block text-xs tracking-wide max-w-[90px] truncate"
                    style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                    {user.name}
                  </span>
                  <ChevronDown size={12} strokeWidth={1.5} className="transition-transform duration-200"
                    style={{ color: "var(--color-mist)", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden"
                    style={{
                      background: "var(--color-ink)",
                      border: "0.5px solid var(--color-charcoal)",
                      borderRadius: "2px",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                    }}>

                    {/* Header with avatar */}
                    <div className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
                      <UserAvatar user={user} size={32} />
                      <div className="min-w-0">
                        <p className="text-xs tracking-[1px] truncate font-medium"
                          style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
                          {user.name}
                        </p>
                        <p className="text-[10px] truncate mt-0.5"
                          style={{ color: "var(--color-mist)" }}>
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Menu */}
                    <ul className="py-1">
                      {[
                        { to: "/profile", Icon: User,        label: "My Profile" },
                        { to: "/orders",  Icon: ShoppingBag, label: "My Orders"  },
                      ].map(({ to, Icon, label }) => (
                        <li key={to}>
                          <Link to={to}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs tracking-[1px] uppercase transition-colors duration-150"
                            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-pearl)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-mist)"; e.currentTarget.style.background = "transparent"; }}
                          ><Icon size={13} strokeWidth={1.5} />{label}</Link>
                        </li>
                      ))}
                      <li style={{ height: "0.5px", margin: "4px 16px", background: "var(--color-charcoal)" }} />
                      <li>
                        <button onClick={logout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs tracking-[1px] uppercase transition-colors duration-150"
                          style={{ color: "#a06060", fontFamily: "var(--font-body)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#c47a7a"; e.currentTarget.style.background = "rgba(180,60,60,0.08)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#a06060"; e.currentTarget.style.background = "transparent"; }}
                        ><LogOut size={13} strokeWidth={1.5} />Logout</button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-1">
                <Link to="/login" className="text-[10px] tracking-[2px] uppercase transition-colors duration-200"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-pearl)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
                >Login</Link>
                <Link to="/register" className="px-4 py-2 text-[10px] tracking-[2px] uppercase transition-all duration-200"
                  style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)", borderRadius: "0" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
                >Register</Link>
              </div>
            )}

            {/* Mobile toggle */}
            <button className="md:hidden ml-2 p-2 transition-colors duration-150"
              style={{ color: "var(--color-mist)" }}
              onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
              {mobileOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden px-5 pb-5 pt-2 space-y-1"
            style={{ borderTop: "0.5px solid var(--color-charcoal)", background: "var(--color-obsidian)" }}>

            {/* User info strip (mobile) */}
            {user && (
              <div className="flex items-center gap-3 py-3 mb-1"
                style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}>
                <UserAvatar user={user} size={32} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate"
                    style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{user.name}</p>
                  <p className="text-[10px] truncate"
                    style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{user.email}</p>
                </div>
              </div>
            )}

            {NAV_LINKS.map(({ to, label }) => {
              const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <Link key={to} to={to}
                  className="flex items-center gap-3 px-3 py-3 text-xs tracking-[2px] uppercase transition-colors duration-150"
                  style={{ color: active ? "var(--color-pearl)" : "var(--color-mist)", borderBottom: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)" }}>
                  {active && <span className="w-1 h-1 flex-shrink-0" style={{ background: "var(--color-gold)", borderRadius: "50%" }} />}
                  {label}
                </Link>
              );
            })}

            {!user ? (
              <div className="flex gap-3 pt-3">
                <Link to="/login" className="flex-1 text-center py-2.5 text-[10px] tracking-[2px] uppercase"
                  style={{ color: "var(--color-mist)", border: "0.5px solid var(--color-charcoal)", fontFamily: "var(--font-body)" }}>
                  Login
                </Link>
                <Link to="/register" className="flex-1 text-center py-2.5 text-[10px] tracking-[2px] uppercase"
                  style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", fontFamily: "var(--font-body)" }}>
                  Register
                </Link>
              </div>
            ) : (
              <button onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 text-[10px] tracking-[2px] uppercase transition-colors duration-150"
                style={{ color: "#a06060", border: "0.5px solid rgba(160,60,60,0.3)", fontFamily: "var(--font-body)", background: "transparent", borderRadius: "0", cursor: "pointer" }}>
                <LogOut size={12} strokeWidth={1.5} /> Logout
              </button>
            )}
          </div>
        )}
      </nav>

      <div className="md:hidden h-16" />
    </>
  );
}

export default Navbar;