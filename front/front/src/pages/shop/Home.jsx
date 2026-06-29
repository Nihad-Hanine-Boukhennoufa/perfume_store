import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Shield, Truck, RotateCcw } from "lucide-react";
import { getProducts } from "../../api/product.api";
import { getAllBrands } from "../../api/brand.api";
import ProductCard from "../../components/product/ProductCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const goldBtn = {
  background: "var(--color-gold)", color: "var(--color-obsidian)",
  border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)",
  borderRadius: "0", cursor: "pointer",
  fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase",
  padding: "14px 32px", transition: "background .2s",
  display: "inline-flex", alignItems: "center", gap: "8px",
};

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

// ─── useInView ────────────────────────────────────────────────────────────────
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─── Stat item ────────────────────────────────────────────────────────────────
function StatItem({ value, suffix = "", label, start }) {
  const count = useCountUp(value, 1600, start);
  return (
    <div className="flex flex-col items-center gap-2">
      <span style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,52px)", fontWeight: 500, color: "var(--color-pearl)", lineHeight: 1 }}>
        {count}{suffix}
      </span>
      <span className="text-[9px] tracking-[4px] uppercase" style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
        {label}
      </span>
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <section className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{ minHeight: "92vh", background: "var(--color-obsidian)", padding: "80px 20px" }}>

      {/* Ambient background circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full"
          style={{
            width: "600px", height: "600px",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
            transition: "opacity 1.8s ease",
            opacity: mounted ? 1 : 0,
          }} />
        <div className="absolute rounded-full"
          style={{
            width: "300px", height: "300px",
            top: "20%", right: "15%",
            background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
            transition: "opacity 2.4s ease 0.4s",
            opacity: mounted ? 1 : 0,
          }} />
        <div className="absolute rounded-full"
          style={{
            width: "200px", height: "200px",
            bottom: "25%", left: "10%",
            background: "radial-gradient(circle, rgba(201,168,76,0.03) 0%, transparent 70%)",
            transition: "opacity 2.4s ease 0.6s",
            opacity: mounted ? 1 : 0,
          }} />
      </div>

      {/* Decorative horizontal lines */}
      <div className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: "50%", height: "0.5px",
          background: "linear-gradient(to right, transparent, rgba(201,168,76,0.15), transparent)",
          transition: "opacity 2s ease 0.8s", opacity: mounted ? 1 : 0,
        }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl mx-auto">

        {/* Eyebrow */}
        <div className="flex items-center gap-3"
          style={{ transition: "opacity .8s ease, transform .8s ease", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)" }}>
          <span className="w-8 h-px" style={{ background: "var(--color-gold)" }} />
          <span className="text-[9px] tracking-[6px] uppercase" style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>
            Parfumerie de Luxe
          </span>
          <span className="w-8 h-px" style={{ background: "var(--color-gold)" }} />
        </div>

        {/* Main heading */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(48px, 8vw, 96px)",
          fontWeight: 500,
          color: "var(--color-pearl)",
          lineHeight: 1.05,
          letterSpacing: "2px",
          transition: "opacity 1s ease 0.2s, transform 1s ease 0.2s",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
        }}>
          The Art of<br />
          <em style={{ color: "var(--color-gold)", fontStyle: "italic" }}>Fragrance</em>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: "var(--font-body)",
          fontSize: "15px",
          fontWeight: 300,
          color: "var(--color-mist)",
          lineHeight: 1.8,
          maxWidth: "480px",
          letterSpacing: "0.3px",
          transition: "opacity 1s ease 0.4s, transform 1s ease 0.4s",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
        }}>
          Curating the world's rarest scents — from ancient Arabian oud
          to modern niche perfumery. Each bottle, a journey.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4"
          style={{ transition: "opacity 1s ease 0.6s, transform 1s ease 0.6s", opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(12px)" }}>
          <Link to="/products" style={goldBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
          >
            Explore Collection <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
          <Link to="/products?sort=newest"
            className="text-[10px] tracking-[3px] uppercase transition-colors duration-200"
            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-pearl)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
          >
            New Arrivals →
          </Link>
        </div>

        {/* Floating scent words */}
        <div className="flex flex-wrap justify-center gap-3 mt-4"
          style={{ transition: "opacity 1.2s ease 0.9s", opacity: mounted ? 1 : 0 }}>
          {["Oud", "Amber", "Musk", "Rose", "Saffron", "Vetiver"].map((note, i) => (
            <span key={note} className="text-[9px] tracking-[3px] uppercase px-3 py-1.5"
              style={{
                color: "var(--color-smoke)",
                border: "0.5px solid var(--color-charcoal)",
                fontFamily: "var(--font-body)",
                transition: `opacity 1.2s ease ${0.9 + i * 0.08}s`,
                opacity: mounted ? 1 : 0,
              }}>
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ transition: "opacity 1.5s ease 1.2s", opacity: mounted ? 0.4 : 0 }}>
        <span className="text-[8px] tracking-[4px] uppercase" style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
          Scroll
        </span>
        <div className="w-px h-8 overflow-hidden" style={{ background: "var(--color-charcoal)" }}>
          <div className="w-full h-1/2" style={{ background: "var(--color-gold)", animation: "scrollDot 1.8s ease-in-out infinite" }} />
        </div>
      </div>

      <style>{`
        @keyframes scrollDot {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(300%); }
        }
      `}</style>
    </section>
  );
}

// ─── Stats Section ────────────────────────────────────────────────────────────
function Stats() {
  const [ref, visible] = useInView(0.3);
  return (
    <section ref={ref} style={{ background: "var(--color-ink)", borderTop: "0.5px solid var(--color-charcoal)", borderBottom: "0.5px solid var(--color-charcoal)" }}>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        {[
          { value: 500,  suffix: "+",  label: "Fragrances"    },
          { value: 80,   suffix: "+",  label: "Maisons"       },
          { value: 12,   suffix: "k+", label: "Happy Clients" },
          { value: 100,  suffix: "%",  label: "Authentic"     },
        ].map((s) => <StatItem key={s.label} {...s} start={visible} />)}
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
function FeaturedProducts() {
  const [ref, visible] = useInView(0.1);

  const { data, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => getProducts(1, 8, "", { sort: "newest" }),
    select: (res) => (res?.data ?? []).filter((p) => p.isFeatured).slice(0, 8),
  });

  const products = data ?? [];

  return (
    <section ref={ref} style={{ background: "var(--color-obsidian)", padding: "80px 0" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          style={{ transition: "opacity .8s ease, transform .8s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}>
          <div>
            <p className="text-[9px] tracking-[5px] uppercase mb-2"
              style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Handpicked</p>
            <h2 className="font-medium" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,42px)", color: "var(--color-pearl)" }}>
              Featured Fragrances
            </h2>
          </div>
          <Link to="/products" className="text-[10px] tracking-[3px] uppercase flex items-center gap-2 transition-colors duration-200 flex-shrink-0"
            style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
          >
            View All <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden"
                style={{ background: "var(--color-ink)", border: "0.5px solid var(--color-charcoal)" }}>
                <div className="aspect-square" style={{ background: "var(--color-charcoal)" }} />
                <div className="p-3 space-y-2">
                  <div className="h-2 w-14" style={{ background: "var(--color-charcoal)" }} />
                  <div className="h-3 w-3/4" style={{ background: "var(--color-charcoal)" }} />
                  <div className="h-7 w-full" style={{ background: "var(--color-charcoal)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product, i) => (
              <div key={product._id}
                style={{ transition: `opacity .6s ease ${i * 0.07}s, transform .6s ease ${i * 0.07}s`, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16"
            style={{ border: "0.5px solid var(--color-charcoal)" }}>
            <p style={{ color: "var(--color-mist)", fontFamily: "var(--font-display)", fontSize: "20px" }}>
              No featured fragrances yet
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Brands Section ───────────────────────────────────────────────────────────
function BrandsSection() {
  const [ref, visible] = useInView(0.2);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: getAllBrands,
  });

  return (
    <section ref={ref} style={{ background: "var(--color-ink)", borderTop: "0.5px solid var(--color-charcoal)", padding: "80px 0" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        <div className="text-center mb-12"
          style={{ transition: "opacity .8s ease, transform .8s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}>
          <p className="text-[9px] tracking-[5px] uppercase mb-2"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Our Partners</p>
          <h2 className="font-medium" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,42px)", color: "var(--color-pearl)" }}>
            Prestigious Maisons
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse"
                style={{ background: "var(--color-charcoal)", border: "0.5px solid var(--color-charcoal)" }} />
            ))}
          </div>
        ) : brands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {brands.map((brand, i) => (
              <Link key={brand._id} to={`/products?brand=${brand._id}`}
                className="flex flex-col items-center justify-center gap-3 py-6 px-4 transition-all duration-300 group"
                style={{
                  background: "var(--color-obsidian)",
                  border: "0.5px solid var(--color-charcoal)",
                  transition: `opacity .6s ease ${i * 0.05}s, transform .6s ease ${i * 0.05}s, border-color .3s`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(16px)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-charcoal)")}
              >
                {brand.image?.url ? (
                  <img src={brand.image.url} alt={brand.name}
                    className="h-8 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                    style={{ filter: "brightness(0.7) grayscale(0.3)", transition: "filter .3s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1) grayscale(0)")}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(0.7) grayscale(0.3)")}
                  />
                ) : (
                  <span className="text-sm font-medium tracking-wider text-center"
                    style={{ color: "var(--color-mist)", fontFamily: "var(--font-display)", fontSize: "15px" }}>
                    {brand.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── Why Choose Us ────────────────────────────────────────────────────────────
function WhyUs() {
  const [ref, visible] = useInView(0.2);

  const features = [
    {
      Icon: Shield,
      title: "100% Authentic",
      desc: "Every fragrance is sourced directly from official distributors and verified for authenticity.",
    },
    {
      Icon: Sparkles,
      title: "Expert Curation",
      desc: "Our team of perfumers handpicks only the finest scents from around the world.",
    },
    {
      Icon: Truck,
      title: "Free Shipping",
      desc: "Complimentary shipping on all orders over $150, delivered in luxury packaging.",
    },
    {
      Icon: RotateCcw,
      title: "Easy Returns",
      desc: "30-day return policy. If you're not completely satisfied, we'll make it right.",
    },
  ];

  return (
    <section ref={ref} style={{ background: "var(--color-obsidian)", borderTop: "0.5px solid var(--color-charcoal)", padding: "80px 0" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        <div className="text-center mb-16"
          style={{ transition: "opacity .8s ease, transform .8s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}>
          <p className="text-[9px] tracking-[5px] uppercase mb-2"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Our Promise</p>
          <h2 className="font-medium" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,42px)", color: "var(--color-pearl)" }}>
            Why Choose L&apos;Aura
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
          style={{ border: "0.5px solid var(--color-charcoal)" }}>
          {features.map(({ Icon, title, desc }, i) => (
            <div key={title} className="flex flex-col gap-5 p-8 transition-colors duration-300"
              style={{
                background: "var(--color-ink)",
                borderRight: i < features.length - 1 ? "0.5px solid var(--color-charcoal)" : "none",
                transition: `opacity .7s ease ${i * 0.1}s, transform .7s ease ${i * 0.1}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-ink)")}
            >
              {/* Icon */}
              <div className="w-10 h-10 flex items-center justify-center"
                style={{ border: "0.5px solid rgba(201,168,76,0.3)", background: "rgba(201,168,76,0.06)" }}>
                <Icon size={18} strokeWidth={1.5} style={{ color: "var(--color-gold)" }} />
              </div>

              <div>
                <p className="text-sm font-medium mb-2"
                  style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>{title}</p>
                <p className="text-sm leading-relaxed"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)", fontWeight: 300 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter ───────────────────────────────────────────────────────────────
function Newsletter() {
  const [ref, visible] = useInView(0.3);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section ref={ref} style={{ background: "var(--color-ink)", borderTop: "0.5px solid var(--color-charcoal)", padding: "80px 0" }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center"
        style={{ transition: "opacity .8s ease, transform .8s ease", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}>

        <p className="text-[9px] tracking-[5px] uppercase mb-3"
          style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>The Inner Circle</p>
        <h2 className="font-medium mb-3"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,42px)", color: "var(--color-pearl)" }}>
          Discover Rare Fragrances First
        </h2>
        <p className="text-sm mb-10 leading-relaxed"
          style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
          Join our inner circle and receive exclusive access to new arrivals, private sales, and fragrance stories.
        </p>

        {submitted ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.1)", border: "0.5px solid rgba(201,168,76,0.3)" }}>
              <Sparkles size={18} strokeWidth={1.5} style={{ color: "var(--color-gold)" }} />
            </div>
            <p className="text-sm" style={{ color: "var(--color-pearl)", fontFamily: "var(--font-body)" }}>
              Welcome to the inner circle.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 outline-none text-sm px-4 py-3.5 transition-colors duration-200"
              style={{
                background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
                borderRight: "none", color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: "0",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
            />
            <button type="submit" style={{ ...goldBtn, padding: "14px 24px", borderRadius: "0", fontSize: "9px" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-gold-light)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-gold)")}
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const Home = () => (
  <div style={{ background: "var(--color-obsidian)" }}>
    <Hero />
    <Stats />
    <FeaturedProducts />
    <BrandsSection />
    <WhyUs />
    <Newsletter />
  </div>
);

export default Home;