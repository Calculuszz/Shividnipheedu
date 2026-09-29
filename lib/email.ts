import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    cid: string;
    encoding: string;
  }>;
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"SHIVIDNI PHEEDU 2026" <${process.env.GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error };
  }
}
