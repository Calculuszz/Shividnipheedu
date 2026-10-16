import nodemailer from 'nodemailer';

// Two Gmail accounts so a busy registration day can't use up the quota the booking emails
// need: 'main' sends registration, 'booking' sends Escape Room and Haunted House emails.
// Without GMAIL_USER_BOOKING set, booking emails go out from the main account as before.
export type EmailAccount = 'main' | 'booking';

function account(which: EmailAccount) {
  const booking = which === 'booking' && process.env.GMAIL_USER_BOOKING && process.env.GMAIL_APP_PASSWORD_BOOKING;
  return booking
    ? { user: process.env.GMAIL_USER_BOOKING!, pass: process.env.GMAIL_APP_PASSWORD_BOOKING! }
    : { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD };
}

const transporters = new Map<string, nodemailer.Transporter>();
function transporterFor(which: EmailAccount) {
  const auth = account(which);
  const key = auth.user ?? '';
  let t = transporters.get(key);
  if (!t) {
    t = nodemailer.createTransport({ service: 'gmail', auth });
    transporters.set(key, t);
  }
  return { transporter: t, user: auth.user };
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  /** Which Gmail account sends it (default: main) */
  from?: EmailAccount;
  attachments?: Array<{
    filename: string;
    content: string;
    cid: string;
    encoding: string;
  }>;
}

export async function sendEmail(options: SendEmailOptions) {
  // .invalid is reserved and never delivers (RFC 2606): load-test accounts use it, so
  // they don't spend the Gmail daily quota or bounce back to the inbox
  if (/\.invalid$/i.test(options.to.trim())) return { success: true, messageId: 'skipped-invalid-domain' };
  try {
    const { transporter, user } = transporterFor(options.from ?? 'main');
    const info = await transporter.sendMail({
      from: `"SHIVIDNI PHEEDU" <${user}>`,
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
