import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";
import { forgotPassword } from "../../api/auth.api.js";

const inputStyle = {
  background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
  color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: "0",
  width: "100%", outline: "none", fontSize: "14px",
  padding: "12px 14px", transition: "border-color .2s",
};

function ForgotPassword() {
  const [email, setEmail]   = useState("");
  const [error, setError]   = useState("");
  const [sent,  setSent]    = useState(false);

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess:  () => setSent(true),
    onError:    (err) => setError(err.response?.data?.message ?? "Something went wrong. Please try again."),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!email) return setError("Email is required");
    setError("");
    mutation.mutate(email);
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

        {sent ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <CheckCircle2 size={40} strokeWidth={1} style={{ color: "var(--color-gold)" }} />
            </div>
            <h1 className="font-medium mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--color-pearl)" }}>
              Check your inbox
            </h1>
            <p className="text-sm mb-8 leading-relaxed"
              style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
              If an account exists for <span style={{ color: "var(--color-pearl)" }}>{email}</span>,
              you'll receive a reset link shortly. It expires in 10 minutes.
            </p>
            <Link to="/login"
              className="flex items-center justify-center gap-2 text-[10px] tracking-[2px] uppercase"
              style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
            >
              <ArrowLeft size={12} strokeWidth={1.5} /> Back to sign in
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-8">
              <p className="text-[9px] tracking-[5px] uppercase mb-2"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Password reset</p>
              <h1 className="font-medium mb-3"
                style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--color-pearl)" }}>
                Forgot password?
              </h1>
              <p className="text-sm leading-relaxed"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3 mb-6 text-sm"
                style={{ background: "rgba(160,60,60,0.12)", border: "0.5px solid rgba(160,60,60,0.3)", color: "#c08080", fontFamily: "var(--font-body)" }}>
                <AlertTriangle size={13} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="email" className="block text-[9px] tracking-[3px] uppercase mb-2"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Email address</label>
                <input id="email" type="email" value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com"
                  disabled={mutation.isPending}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
                />
              </div>

              <button type="submit" disabled={mutation.isPending}
                className="text-[11px] tracking-[3px] uppercase py-4 transition-all duration-200 disabled:opacity-60"
                style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "none", fontFamily: "var(--font-body)", borderRadius: "0", cursor: "pointer" }}
                onMouseEnter={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold)"; }}
              >{mutation.isPending ? "Sending…" : "Send Reset Link"}</button>
            </form>

            <div className="text-center mt-8">
              <Link to="/login"
                className="flex items-center justify-center gap-2 text-[10px] tracking-[2px] uppercase"
                style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
              >
                <ArrowLeft size={12} strokeWidth={1.5} /> Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;