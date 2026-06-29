import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Upload, X, AlertTriangle } from "lucide-react";
import { registerUser } from "../../api/auth.api.js";

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

function LuxInput({ label, id, type = "text", value, onChange, placeholder, disabled, autoComplete, hint }) {
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
      {hint && (
        <p className="mt-1.5 text-[10px]"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>{hint}</p>
      )}
    </div>
  );
}

function Register() {
  const [form, setForm]     = useState({ name: "", email: "", password: "", image: null });
  const [preview, setPreview] = useState(null);
  const [error, setError]   = useState("");
  const navigate            = useNavigate();

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess:  () => navigate("/login"),
    onError:    (err) => setError(err.response?.data?.message ?? "Registration failed. Please try again."),
  });

  const handle = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please select a valid image file");
    if (file.size > 5 * 1024 * 1024) return setError("Image size must be less than 5MB");
    setForm((p) => ({ ...p, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setError("");
  };

  const removeImage = () => {
    setForm((p) => ({ ...p, image: null }));
    setPreview(null);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return setError("Name, email and password are required");

    // ✅ FIX: aligned with backend validator (min 8, uppercase, lowercase, digit)
    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(form.password))
      return setError("Password must contain at least one uppercase letter");
    if (!/[a-z]/.test(form.password))
      return setError("Password must contain at least one lowercase letter");
    if (!/\d/.test(form.password))
      return setError("Password must contain at least one number");

    const data = new FormData();
    data.append("name",     form.name);
    data.append("email",    form.email);
    data.append("password", form.password);
    if (form.image) data.append("image", form.image);
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16"
      style={{ background: "var(--color-obsidian)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
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
            style={{ color: "var(--color-gold)", fontFamily: "var(--font-body)" }}>Join us</p>
          <h1 className="font-medium"
            style={{ fontFamily: "var(--font-display)", fontSize: "32px", color: "var(--color-pearl)" }}>
            Create account
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

        <form onSubmit={submit} className="flex flex-col gap-5">

          {/* Avatar upload */}
          <div>
            <p className="text-[9px] tracking-[3px] uppercase mb-3"
              style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>
              Profile Picture <span style={{ color: "var(--color-smoke)" }}>— Optional</span>
            </p>

            {preview ? (
              <div className="flex items-center gap-4">
                <img src={preview} alt="Preview"
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                  style={{ border: "0.5px solid var(--color-gold)" }} />
                <div>
                  <p className="text-xs mb-1"
                    style={{ color: "var(--color-mist)", fontFamily: "var(--font-body)" }}>Image selected</p>
                  <button type="button" onClick={removeImage}
                    className="flex items-center gap-1.5 text-[10px] tracking-[1px] uppercase transition-colors duration-150"
                    style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)", background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#c47a7a")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-smoke)")}
                  ><X size={10} strokeWidth={1.5} /> Remove</button>
                </div>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center gap-3 py-6 transition-all duration-200 cursor-pointer"
                style={{ border: "0.5px dashed var(--color-smoke)", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-smoke)")}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(201,168,76,0.08)", border: "0.5px solid var(--color-gold-dark)" }}>
                  <Upload size={16} strokeWidth={1.5} style={{ color: "var(--color-gold)" }} />
                </div>
                <p className="text-[10px] tracking-[1px]"
                  style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
                  Click to upload · PNG, JPG up to 5MB
                </p>
                <input type="file" className="hidden" accept="image/*"
                  onChange={handleImage} disabled={mutation.isPending} />
              </label>
            )}
          </div>

          <LuxInput label="Full Name" id="name" value={form.name} onChange={handle}
            placeholder="Your name" disabled={mutation.isPending} autoComplete="name" />

          <LuxInput label="Email address" id="email" type="email" value={form.email}
            onChange={handle} placeholder="you@example.com"
            disabled={mutation.isPending} autoComplete="email" />

          {/* ✅ FIX: hint aligned with backend requirements */}
          <LuxInput label="Password" id="password" type="password" value={form.password}
            onChange={handle} placeholder="••••••••"
            disabled={mutation.isPending} autoComplete="new-password"
            hint="Min 8 characters · uppercase · lowercase · number" />

          <button type="submit" disabled={mutation.isPending} style={goldBtn}
            onMouseEnter={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold-light)"; }}
            onMouseLeave={(e) => { if (!mutation.isPending) e.currentTarget.style.background = "var(--color-gold)"; }}
          >{mutation.isPending ? "Creating account…" : "Create Account"}</button>
        </form>

        <p className="text-center mt-8 text-sm"
          style={{ color: "var(--color-smoke)", fontFamily: "var(--font-body)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-mist)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-gold)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-mist)")}
          >Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;