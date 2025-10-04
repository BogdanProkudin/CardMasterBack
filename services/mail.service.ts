import nodemailer from "nodemailer";
import { env } from "../config/env";
import { renderVerifyEmail, renderResetEmail } from "../emails/render";

let transporter: nodemailer.Transporter;

// Если dev → ethereal (тестовые письма), если prod → реальный SMTP
if (env.nodeEnv === "development") {
  // создаём dev-транспорт с ethereal
  (async () => {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("✉️ Using Ethereal SMTP. Login:", testAccount.user);
  })();
} else {
  // prod SMTP (например, Gmail с app password)
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort ?? 465),
    secure: Number(env.smtpPort) === 465, // true для 465
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
}

// ====== функции отправки ======

export async function sendVerifyEmail(user: any) {
  const token = "TODO: generate JWT/UUID and save to DB";
  const url = `${env.publicAppUrl}/verify-email?token=${token}`;
  const html = renderVerifyEmail({ name: user.name ?? "there", url });

  const info = await transporter.sendMail({
    to: user.email,
    from: env.mailFrom,
    subject: "Verify your email",
    html,
  });

  // В dev можно вывести Preview URL
  if (env.nodeEnv === "development") {
    console.log("Preview verify email:", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendResetEmail(user: any) {
  const token = "TODO: generate JWT/UUID and save to DB";
  const url = `${env.publicAppUrl}/reset-password?token=${token}`;
  const html = renderResetEmail({ name: user.name ?? "there", url });

  const info = await transporter.sendMail({
    to: user.email,
    from: env.mailFrom,
    subject: "Reset your password",
    html,
  });

  if (env.nodeEnv === "development") {
    console.log("Preview reset email:", nodemailer.getTestMessageUrl(info));
  }
}
