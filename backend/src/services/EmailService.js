import nodemailer from "nodemailer";

// ─── Transporter ──────────────────────────────────────────────────────────────
// Brevo (formerly Sendinblue) SMTP settings
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.BREVO_SMTP_USER, // your Brevo login email
    pass: process.env.BREVO_SMTP_PASS, // your Brevo SMTP key (not login password)
  },
});

// ─── Helper ───────────────────────────────────────────────────────────────────
const FROM = `"${process.env.EMAIL_FROM_NAME || "Your Store"}" <${process.env.EMAIL_FROM_ADDRESS}>`;

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
  });
};

// ─── Welcome Email ────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (email, name) => {
  await sendEmail({
    to: email,
    subject: "Welcome! Your account is ready 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>You can now browse our collection, add items to your cart, and place orders.</p>
        <br/>
        <a href="${process.env.CLIENT_URL}" 
           style="background:#000; color:#fff; padding:12px 24px; 
                  text-decoration:none; border-radius:4px;">
          Start Shopping
        </a>
        <br/><br/>
        <p style="color:#888; font-size:12px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  });
};

// ─── Forgot Password Email ────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (email, name, resetToken) => {
  // The reset link points to the frontend page which will call the API
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. 
           Click the button below to choose a new one.</p>
        <p><strong>This link expires in 10 minutes.</strong></p>
        <br/>
        <a href="${resetUrl}" 
           style="background:#000; color:#fff; padding:12px 24px; 
                  text-decoration:none; border-radius:4px;">
          Reset Password
        </a>
        <br/><br/>
        <p style="color:#888; font-size:12px;">
          If you didn't request a password reset, ignore this email — 
          your password will remain unchanged.
        </p>
        <p style="color:#888; font-size:12px;">
          Or copy this link: ${resetUrl}
        </p>
      </div>
    `,
  });
};