import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube, Mail, MapPin, Phone } from "lucide-react";

// ── Data ──────────────────────────────────────────────────────────────────────
const FOOTER_LINKS = [
  {
    heading: "Shop",
    links: [
      { label: "All Fragrances",  to: "/products"              },
      { label: "New Arrivals",    to: "/products?sort=newest"  },
      { label: "Best Sellers",    to: "/products?sort=popular" },
      { label: "Gift Sets",       to: "/products?type=gift"    },
      { label: "Brands",          to: "/brands"                },
    ],
  },
  {
    heading: "Discover",
    links: [
      { label: "Our Story",       to: "/about"    },
      { label: "Fragrance Guide", to: "/guide"    },
      { label: "Scent Finder",    to: "/finder"   },
      { label: "Contact",         to: "/contact"  },
    ],
  },
  {
    heading: "Customer Care",
    links: [
      { label: "Shipping & Returns", to: "/shipping" },
      { label: "FAQ",                to: "/faq"      },
      { label: "Track My Order",     to: "/orders"   },
      { label: "Privacy Policy",     to: "/privacy"  },
      { label: "Terms of Service",   to: "/terms"    },
    ],
  },
];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Twitter,   label: "Twitter",   href: "#" },
  { icon: Facebook,  label: "Facebook",  href: "#" },
  { icon: Youtube,   label: "YouTube",   href: "#" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function FooterHeading({ children }) {
  return (
    <h4
      className="text-[9px] tracking-[4px] uppercase mb-5"
      style={{
        color: "var(--color-gold)",
        fontFamily: "var(--font-body)",
      }}
    >
      {children}
    </h4>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="text-xs tracking-wide transition-colors duration-200 block py-1"
        style={{
          color: "var(--color-mist)",
          fontFamily: "var(--font-body)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = "var(--color-pearl)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--color-mist)")
        }
      >
        {children}
      </Link>
    </li>
  );
}

// ── Main Footer ───────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: "var(--color-ink)",
        borderTop: "0.5px solid var(--color-charcoal)",
      }}
    >
      {/* ── Newsletter band ──────────────────────────────────────────────── */}
      <div
        className="py-12 px-5"
        style={{ borderBottom: "0.5px solid var(--color-charcoal)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Copy */}
          <div>
            <p
              className="text-xs tracking-[3px] uppercase mb-2"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}
            >
              The Inner Circle
            </p>
            <p
              className="text-2xl font-light"
              style={{
                color: "var(--color-pearl)",
                fontFamily: "var(--font-display)",
                letterSpacing: "1px",
              }}
            >
              Discover rare fragrances first.
            </p>
          </div>

          {/* Email subscribe */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full md:w-auto gap-0"
          >
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 md:w-72 px-4 py-3 text-xs tracking-wide outline-none"
              style={{
                background: "var(--color-charcoal)",
                border: "0.5px solid var(--color-smoke)",
                borderRight: "none",
                color: "var(--color-pearl)",
                fontFamily: "var(--font-body)",
                borderRadius: "0",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-gold)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-smoke)")
              }
            />
            <button
              type="submit"
              className="px-6 py-3 text-[10px] tracking-[3px] uppercase transition-all duration-200 flex-shrink-0"
              style={{
                background: "var(--color-gold)",
                color: "var(--color-obsidian)",
                fontFamily: "var(--font-body)",
                borderRadius: "0",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-gold-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--color-gold)")
              }
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* ── Main footer grid ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* Brand column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <Link to="/" className="inline-block mb-5">
              <span
                className="text-3xl font-light tracking-[6px] uppercase"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-pearl)",
                }}
              >
                L&apos;<span style={{ color: "var(--color-gold)" }}>AURA</span>
              </span>
            </Link>

            <p
              className="text-sm leading-relaxed mb-8 max-w-xs"
              style={{
                color: "var(--color-mist)",
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
              }}
            >
              Curating the world's finest fragrances — from ancient oud
              traditions to modern niche perfumery.
            </p>

            {/* Contact details */}
            <ul className="space-y-3 mb-8">
              {[
                { icon: MapPin,  text: "Algiers, Algeria"         },
                { icon: Phone,   text: "+213 555 000 000"         },
                { icon: Mail,    text: "hello@lauraparfum.com"    },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-xs"
                  style={{
                    color: "var(--color-mist)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Icon
                    size={13}
                    strokeWidth={1.5}
                    style={{ color: "var(--color-gold)", flexShrink: 0 }}
                  />
                  {text}
                </li>
              ))}
            </ul>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 flex items-center justify-center transition-all duration-200"
                  style={{
                    border: "0.5px solid var(--color-charcoal)",
                    color: "var(--color-smoke)",
                    borderRadius: "0",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-gold)";
                    e.currentTarget.style.color = "var(--color-gold)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-charcoal)";
                    e.currentTarget.style.color = "var(--color-smoke)";
                  }}
                >
                  <Icon size={13} strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ heading, links }) => (
            <div key={heading}>
              <FooterHeading>{heading}</FooterHeading>
              <ul className="space-y-0.5">
                {links.map(({ label, to }) => (
                  <FooterLink key={to} to={to}>
                    {label}
                  </FooterLink>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────── */}
      <div
        className="px-5 sm:px-8 py-5"
        style={{ borderTop: "0.5px solid var(--color-charcoal)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className="text-[10px] tracking-[1px]"
            style={{
              color: "var(--color-smoke)",
              fontFamily: "var(--font-body)",
            }}
          >
            © {new Date().getFullYear()} L&apos;Aura Parfumerie. All rights reserved.
          </p>

          {/* Payment / trust badges */}
          <div className="flex items-center gap-4">
            {["VISA", "MC", "AMEX", "PAYPAL"].map((brand) => (
              <span
                key={brand}
                className="text-[8px] tracking-[2px] px-2 py-1"
                style={{
                  color: "var(--color-smoke)",
                  border: "0.5px solid var(--color-charcoal)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;