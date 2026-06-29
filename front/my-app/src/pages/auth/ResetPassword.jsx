import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../../api/auth.api.js";

const inputStyle = {
  background: "var(--color-charcoal)", border: "0.5px solid var(--color-smoke)",
  color: "var(--color-pearl)", fontFamily: "var(--font-body)", borderRadius: "0",
  width: "100%", outline: "none", fontSize: "14px",
  padding: "12px 14px", transition: "border-color .2s",
};

function ResetPassword() {
  const { token }             = useParams();
  const navigate              = useNavigate();
  const [password, setPassword] = useState("");
  const [show,     setShow]   = useState(false);
  const [error,    setError]  = useState("");
  const [done,     setDone]   = useState(false);

  const mutation = useMutation({
    mutationFn: ({ token, newPassword }) => resetPassword({ token, newPassword }),
    onSuccess:  () => {
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    },
    onError: (err) => setError(err.response?.data?.message ?? "Invalid or expired reset link."),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!password) return setError("Password is required");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(password)) return setError("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(password)) return setError("Password must contain at least one lowercase letter");
    if (!/\d/.test(password))    return setError("Password must contain at least one number");
    setError("");
    mutation.mutate({ token, newPassword: password });
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

        {done ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <CheckCircle2 size={40} strokeWidth={1} style={{ color: "var(--color-gold)" }} />
            </div>
            <h1 className="font-medium mb-3"
              style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--color-pearl)" }}>
              Password updated
            </h1>
            <p className="text-sm mb-2"
              style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
              Your password has been reset successfully.
            </p>
            <p className="text-xs"
              style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
              Redirecting to sign in…
            </p>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div className="mb-8">
              <p className="text-[9px] tracking-[5px] uppercase mb-2"
                style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>New password</p>
              <h1 className="font-medium"
                style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--color-pearl)" }}>
                Reset password
              </h1>
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
                <label htmlFor="password" className="block text-[9px] tracking-[3px] uppercase mb-2"
                  style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>New Password</label>
                <div className="relative">
                  <input id="password" type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="••••••••"
                    disabled={mutation.isPending}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
                  />
                  <button type="button" onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--color-smoke)", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
                  >{show ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}</button>
                </div>
                <p className="mt-1.5 text-[10px]"
                  style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                  Min 8 characters · uppercase · lowercase · number
                </p>
              </div>

              <button type="submit" disabled={mutation.isPending}
                className="text-[11px] tracking-[3px] uppercase py-4 transition-all duration-200 disabled:opacity-60"
                style={{ background: "var(--color-gold)", color: "var(--color-obsidian)", border: "none", fontFamily: "var(--font-body)", borderRadius: "0", cursor: "pointer" }}
                onMouseEnter={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
                onMouseLeave={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold)"; }}
              >{mutation.isPending ? "Updating…" : "Set New Password"}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;