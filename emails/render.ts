// src/emails/render.ts

type VerifyProps = { name: string; url: string };
type ResetProps = { name: string; url: string };

export function renderVerifyEmail({ name, url }: VerifyProps) {
  return baseLayout(`
    <h1 style="margin:0 0 16px">Verify your email</h1>
    <p>Hi ${escapeHtml(
      name
    )}, confirm your email to finish creating your account.</p>
    ${ctaButton(url, "Verify email")}
    <p style="font-size:12px;color:#666">If the button doesn't work, paste this link into your browser:<br>${escapeHtml(
      url
    )}</p>
  `);
}

export function renderResetEmail({ name, url }: ResetProps) {
  return baseLayout(`
    <h1 style="margin:0 0 16px">Reset your password</h1>
    <p>Hi ${escapeHtml(name)}, click the button below to set a new password.</p>
    ${ctaButton(url, "Reset password")}
    <p style="font-size:12px;color:#666">If the button doesn't work, paste this link into your browser:<br>${escapeHtml(
      url
    )}</p>
  `);
}

/* ——— helpers ——— */

function baseLayout(content: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f6f8;padding:24px 0">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#fff;border-radius:12px;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
          <tr><td>
            ${content}
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="font-size:12px;color:#888;margin:0">If you did not request this, you can safely ignore this email.</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function ctaButton(url: string, label: string) {
  return `
    <p style="margin:20px 0">
      <a href="${escapeAttr(url)}"
         style="display:inline-block;padding:12px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px">
        ${escapeHtml(label)}
      </a>
    </p>`;
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ((
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        } as any
      )[ch])
  );
}
function escapeAttr(s: string) {
  // для href
  return s.replace(/"/g, "&quot;");
}
