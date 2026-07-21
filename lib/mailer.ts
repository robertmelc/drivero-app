import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Swap this for a verified drivero.eu address once the domain is set up in
// Resend (Domains → Add Domain → add the DNS records they give you, same
// pattern as the drivero.eu Vercel domain setup). Until then, Resend's shared
// sandbox sender works fine for real delivery to real inboxes.
const FROM = "Drivero <onboarding@resend.dev>";

export async function sendDriverInviteEmail(to: string, inviteUrl: string, companyName: string) {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Pozvánka do Drivero — ${companyName}`,
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #05070A; color: #E9F3EC;">
        <p style="font-size: 13px; letter-spacing: 0.12em; font-weight: 800; color: #34E37A; margin: 0 0 24px;">DRIVER</p>
        <h1 style="font-size: 20px; margin: 0 0 12px;">Byli jste pozváni do Drivero</h1>
        <p style="font-size: 14px; line-height: 1.6; color: #8FA69B; margin: 0 0 24px;">
          Firma <strong style="color:#E9F3EC">${companyName}</strong> vás přidala jako řidiče do systému správy vozového parku Drivero.
          Klikněte na tlačítko níže a nastavte si vlastní heslo.
        </p>
        <a href="${inviteUrl}" style="display:inline-block; background: linear-gradient(135deg, #34E37A, #1F9D57); color: #05070A; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          Nastavit heslo a přihlásit se
        </a>
        <p style="font-size: 12px; color: #8FA69B; margin: 24px 0 0;">
          Odkaz je platný 7 dní. Pokud jste tuto pozvánku nečekali, můžete e-mail ignorovat.
        </p>
      </div>
    `,
  });

  if (error) throw new Error(`Odeslání e-mailu selhalo: ${error.message}`);
}
