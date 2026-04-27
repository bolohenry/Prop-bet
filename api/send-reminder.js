import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emails, eventName, inviteLink } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0 || !eventName || !inviteLink) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Wedding Prop Bets <onboarding@resend.dev>';
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await resend.emails.send({
        from,
        to: email,
        subject: `Reminder: Submit your prop bets for ${eventName}!`,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 20px;">
            <h1 style="font-size: 24px; font-weight: 800; color: #1f2937; margin-bottom: 8px;">
              Don't forget your prop bets! 🎲
            </h1>
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              You haven't submitted your predictions for <strong>${eventName}</strong> yet.
              Don't miss out on the fun!
            </p>
            <a href="${inviteLink}" style="display: inline-block; background: #7c3aed; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">
              Submit My Bets →
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
              Wedding Prop Bets
            </p>
          </div>
        `,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  return res.status(200).json({ sent, failed });
}
