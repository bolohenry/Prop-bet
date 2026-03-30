import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, weddingName, inviteLink, adminLink } = req.body;

  if (!email || !weddingName || !inviteLink || !adminLink) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Wedding Prop Bets <onboarding@resend.dev>',
      to: email,
      subject: `Your event is ready — ${weddingName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 0;">
          <h1 style="font-size: 24px; font-weight: 800; color: #1a1a2e; margin-bottom: 8px;">
            ${weddingName}
          </h1>
          <p style="font-size: 14px; color: #7c3aed; font-weight: 600; margin-bottom: 24px;">
            wedding prop bets
          </p>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 32px;">
            Your event is set up and ready to go. Save the two links below — you'll need them on the big day.
          </p>

          <div style="background: #f5f3ff; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
            <p style="font-size: 12px; font-weight: 700; color: #7c3aed; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              Participant invite link
            </p>
            <p style="font-size: 13px; color: #666; margin-bottom: 12px;">
              Share this with your wedding guests
            </p>
            <a href="${inviteLink}" style="display: inline-block; background: #7c3aed; color: white; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
              Open invite link
            </a>
            <p style="font-size: 12px; color: #999; margin-top: 12px; word-break: break-all;">
              ${inviteLink}
            </p>
          </div>

          <div style="background: #fdf2f8; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
            <p style="font-size: 12px; font-weight: 700; color: #ec4899; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              Admin dashboard link
            </p>
            <p style="font-size: 13px; color: #666; margin-bottom: 12px;">
              Keep this private — for event admin only
            </p>
            <a href="${adminLink}" style="display: inline-block; background: #ec4899; color: white; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
              Open admin dashboard
            </a>
            <p style="font-size: 12px; color: #999; margin-top: 12px; word-break: break-all;">
              ${adminLink}
            </p>
          </div>

          <p style="font-size: 12px; color: #aaa; line-height: 1.5;">
            If you lose your admin link, there's no way to recover it. Save it somewhere safe.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
