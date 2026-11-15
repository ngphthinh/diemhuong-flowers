import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

export interface MailInput {
  subject: string;
  text: string;
  replyTo?: string;
}

/** Gửi email thông báo cho Admin. Trả false (không throw) nếu chưa cấu hình SMTP. */
export async function notifyAdmin({ subject, text, replyTo }: MailInput): Promise<boolean> {
  const env = getServerEnv();
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.ADMIN_NOTIFY_EMAIL) return false;
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: (env.SMTP_PORT ?? 587) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Flower Shop" <${env.SMTP_USER}>`,
      to: env.ADMIN_NOTIFY_EMAIL,
      replyTo,
      subject,
      text,
    });
    return true;
  } catch (err) {
    console.error("[mailer] gửi email thất bại:", err);
    return false;
  }
}
