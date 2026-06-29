import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import AuthContext from "../../context/AuthContext.jsx";
import { loginUser } from "../../api/auth.api.js";

const inputStyle = {
  background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
  color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: "0",
  width: "100%", outline: "none", fontSize: "14px",
  padding: "12px 14px", transition: "border-color .2s",
};
const goldBtn = {
  background: "var(--color-gold)", color: "var(--color-obsidian)",
  border: "0.5px solid var(--color-gold)", fontFamily: "var(--font-body)",
  borderRadius: "0", width: "100%", cursor: "pointer",
  fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase",
  padding: "15px", transition: "background .2s",
};

function LuxInput({ label, id, type = "text", value, onChange, placeholder, disabled, autoComplete }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label htmlFor={id} className="block text-[9px] tracking-[3px] uppercase mb-2"
        style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>{label}</label>
      <div className="relative">
        <input id={id} name={id} type={isPassword && show ? "text" : type}
          value={value} onChange={onChange} placeholder={placeholder}
          disabled={disabled} autoComplete={autoComplete} style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
          >{show ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}</button>
        )}
      </div>
    </div>
  );
}

function Login() {
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { login }         = useContext(AuthContext);
  const navigate          = useNavigate();

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (res) => {
      login(res.data);
      navigate(res.data.user.role === "admin" ? "/dashboard" : "/");
    },
    onError: (err) => setError(err.response?.data?.message ?? "Invalid email or password"),
  });

  const handle = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Email and password are required");
    mutation.mutate(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16"
      style={{ background: "var(--color-obsidian)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-12">
          <Link to="/">
            <span className="text-4xl font-medium tracking-[6px] uppercase"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-pearl)" }}>
              L&apos;<span style={{ color: "var(--color-gold)" }}>AURA</span>
            </span>
          </Link>
          <div className="w-8 h-px mx-auto mt-4" style={{ background: "var(--color-gold)" }} />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <p className="text-[9px] tracking-[5px] uppercase mb-2"
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Welcome back</p>
          <h1 className="font-medium"
            style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--color-pearl)" }}>
            Sign in
          </h1>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-6 text-sm"
            style={{ background: "rgba(160,60,60,0.12)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
            <AlertTriangle size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-5">
          <LuxInput label="Email address" id="email" type="email" value={form.email}
            onChange={handle} placeholder="you@example.com"
            disabled={mutation.isPending} autoComplete="email" />

          <div>
            <LuxInput label="Password" id="password" type="password" value={form.password}
              onChange={handle} placeholder="••••••••"
              disabled={mutation.isPending} autoComplete="current-password" />
            {/* ✅ FIX: added forgot password link */}
            <div className="flex justify-end mt-2">
              <Link to="/forgot-password"
                className="text-[10px] tracking-[1px] uppercase transition-colors duration-150"
                style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
              >Forgot password?</Link>
            </div>
          </div>

          <button type="submit" disabled={mutation.isPending} style={goldBtn}
            onMouseEnter={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
            onMouseLeave={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold)"; }}
          >{mutation.isPending ? "Signing in…" : "Sign In"}</button>
        </form>

        <p className="text-center mt-8 text-sm"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
          No account?{" "}
          <Link to="/register" style={{ color: "var(--color-mist)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
          >Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;