const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://versecuretech.com').replace(/\/$/, '');
const smtpUser = process.env.SMTP_USER || 'hello@versecuretech.com';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusLabel(status = '') {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Same shell as contact-form team alerts */
function teamShell({ eyebrow, bodyHtml, ctaHref, ctaLabel }) {
  return `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #ffffff; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 20px; border: 1px solid #1a1a1a; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
            <div style="padding: 24px; border-bottom: 1px solid #1a1a1a; background: linear-gradient(180deg, #111 0%, #0a0a0a 100%); text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.02em;">Versecure<span style="color: #3b82f6;">.</span> <span style="font-weight: 300; color: #666;">PRIORITY</span></h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #3b82f6; margin-bottom: 24px;">${escapeHtml(eyebrow)}</h2>
              ${bodyHtml}
              ${
                ctaHref && ctaLabel
                  ? `<a href="${escapeHtml(ctaHref)}" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; transition: all 0.2s;">${escapeHtml(ctaLabel)}</a>`
                  : ''
              }
            </div>
            <div style="padding: 20px; background-color: #050505; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.1em;">Delivered via ${escapeHtml(smtpUser)} &bull; Versecure Tech</p>
            </div>
          </div>
        </div>
      `;
}

/** Same shell as contact-form visitor confirmation */
function clientShell({ greetingHtml, bodyHtml }) {
  return `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #050505; color: #ffffff; padding: 60px 20px; text-align: center;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 20px; border: 1px solid #1a1a1a; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: left;">
            <div style="padding: 40px; border-bottom: 1px solid #1a1a1a; background: linear-gradient(180deg, #111 0%, #0a0a0a 100%); text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #fff;">Versecure<span style="color: #3b82f6;">.</span></h1>
            </div>
            <div style="padding: 40px;">
              ${greetingHtml}
              ${bodyHtml}
              <div style="padding-top: 32px; border-top: 1px solid #1a1a1a;">
                <p style="margin: 0; font-size: 14px; color: #9ca3af;">Best regards,</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #fff;">The Versecure Engineering Team</p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">${escapeHtml(smtpUser)}</p>
              </div>
            </div>
            <div style="padding: 24px; background-color: #050505; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">
                &copy; ${new Date().getFullYear()} Versecure Tech &bull; Staff-Level Engineering Partners
              </p>
            </div>
          </div>
        </div>
      `;
}

function fieldBlock(label, valueHtml) {
  return `
              <div style="margin-bottom: 32px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(label)}</p>
                <p style="margin: 0; font-size: 16px; color: #fff;">${valueHtml}</p>
              </div>`;
}

function quoteBlock(label, text) {
  return `
              <div style="margin-bottom: 32px; padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a;">
                <p style="margin: 0 0 12px 0; font-size: 12px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em;">${escapeHtml(label)}</p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #d1d5db; font-style: italic;">"${escapeHtml(text)}"</p>
              </div>`;
}

export function projectCreatedEmail(project) {
  const title = project.title || 'Your project';
  const bodyHtml = `
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                We’ve assigned a service project to your client portal. You can track progress anytime, and priority support tickets are now unlocked for your account.
              </p>
              <div style="padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563;">Project Details</h3>
                <p style="margin: 0 0 8px 0; font-size: 16px; color: #fff; font-weight: 600;">${escapeHtml(title)}</p>
                <p style="margin: 0; font-size: 14px; color: #9ca3af;">Status: <span style="color: #fff;">${escapeHtml(statusLabel(project.status))}</span> &bull; Progress: <span style="color: #fff;">${Number(project.progress) || 0}%</span></p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 40px;">
                Sign in to your portal to follow updates or open a support ticket whenever you need us.
              </p>
              <a href="${SITE_URL}/portal" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; margin-bottom: 8px;">Open portal</a>`;
  return {
    subject: `Your project is live: ${title}`,
    text: `Your project "${title}" is live.\nStatus: ${project.status}\nProgress: ${project.progress}%\nPortal: ${SITE_URL}/portal`,
    html: clientShell({
      greetingHtml: `<h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #f3f4f6;">Hello,</h2>`,
      bodyHtml
    })
  };
}

export function projectUpdatedEmail(project) {
  const title = project.title || 'Your project';
  const bodyHtml = `
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                We’ve updated progress on <span style="color: #fff; font-weight: 500;">${escapeHtml(title)}</span>.
              </p>
              <div style="padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563;">Latest Status</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #d1d5db;">Status: <span style="color: #fff;">${escapeHtml(statusLabel(project.status))}</span><br/>Progress: <span style="color: #fff;">${Number(project.progress) || 0}%</span></p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 40px;">
                Open the portal anytime for the latest notes from our engineering team.
              </p>
              <a href="${SITE_URL}/portal" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; margin-bottom: 8px;">View project</a>`;
  return {
    subject: `Project update: ${title}`,
    text: `Project update — ${title}\nStatus: ${project.status}\nProgress: ${project.progress}%\nPortal: ${SITE_URL}/portal`,
    html: clientShell({
      greetingHtml: `<h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #f3f4f6;">Hello,</h2>`,
      bodyHtml
    })
  };
}

export function ticketCreatedTeamEmail({ email, ticket, message }) {
  const bodyHtml = `
              ${fieldBlock('Client Details', `<strong>${escapeHtml(email)}</strong>`)}
              ${fieldBlock('Priority', escapeHtml(statusLabel(ticket.priority)))}
              ${fieldBlock('Subject', escapeHtml(ticket.subject))}
              ${quoteBlock('Message Brief', message)}
              ${fieldBlock('Ticket ID', `<span style="color: #6b7280; font-size: 14px;">${escapeHtml(ticket.id)}</span>`)}
            `;
  return {
    subject: `[Priority Support] ${ticket.subject}`,
    text: `New ticket from ${email}\nPriority: ${ticket.priority}\n\n${message}\n\nID: ${ticket.id}`,
    html: teamShell({
      eyebrow: 'New Support Ticket',
      bodyHtml,
      ctaHref: `mailto:${email}`,
      ctaLabel: 'Reply Instantly'
    })
  };
}

export function ticketClientReplyTeamEmail({ email, ticket, body }) {
  const bodyHtml = `
              ${fieldBlock('Client Details', `<strong>${escapeHtml(email)}</strong>`)}
              ${fieldBlock('Subject', escapeHtml(ticket.subject))}
              ${quoteBlock('Client Reply', body)}
              ${fieldBlock('Ticket ID', `<span style="color: #6b7280; font-size: 14px;">${escapeHtml(ticket.id)}</span>`)}
            `;
  return {
    subject: `[Ticket Reply] ${ticket.subject}`,
    text: `Client reply from ${email}\n\n${body}\n\nID: ${ticket.id}`,
    html: teamShell({
      eyebrow: 'Client Ticket Reply',
      bodyHtml,
      ctaHref: `mailto:${email}`,
      ctaLabel: 'Reply Instantly'
    })
  };
}

export function ticketAdminReplyClientEmail({ ticket, adminReply }) {
  const bodyHtml = `
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                Our team replied to your support ticket regarding <span style="color: #fff; font-weight: 500;">${escapeHtml(ticket.subject)}</span>.
              </p>
              <div style="padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563;">Team Reply</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #d1d5db; font-style: italic;">"${escapeHtml(adminReply)}"</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                Current status: <span style="color: #fff; font-weight: 500;">${escapeHtml(statusLabel(ticket.status))}</span>
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 40px;">
                You can continue the conversation anytime in your client portal.
              </p>
              <a href="${SITE_URL}/portal" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; margin-bottom: 8px;">Open portal</a>`;
  return {
    subject: `Update on your support ticket: ${ticket.subject}`,
    text: `Team reply on "${ticket.subject}":\n\n${adminReply}\n\nStatus: ${ticket.status}\nPortal: ${SITE_URL}/portal`,
    html: clientShell({
      greetingHtml: `<h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #f3f4f6;">Hello,</h2>`,
      bodyHtml
    })
  };
}

export function ticketStatusClientEmail({ ticket }) {
  const bodyHtml = `
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                Your support ticket status was updated.
              </p>
              <div style="padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563;">Ticket Status</h3>
                <p style="margin: 0 0 8px 0; font-size: 16px; color: #fff; font-weight: 600;">${escapeHtml(ticket.subject)}</p>
                <p style="margin: 0; font-size: 14px; color: #9ca3af;">New status: <span style="color: #fff;">${escapeHtml(statusLabel(ticket.status))}</span></p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 40px;">
                Open your portal anytime to review the full thread.
              </p>
              <a href="${SITE_URL}/portal" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; margin-bottom: 8px;">View in portal</a>`;
  return {
    subject: `Ticket status updated: ${ticket.subject}`,
    text: `Ticket "${ticket.subject}" is now ${ticket.status}.\nPortal: ${SITE_URL}/portal`,
    html: clientShell({
      greetingHtml: `<h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #f3f4f6;">Hello,</h2>`,
      bodyHtml
    })
  };
}

export function ticketsLockedEmail({ clientEmail, projectTitle = '' }) {
  void clientEmail;
  const extra = projectTitle ? ` including <span style="color: #fff; font-weight: 500;">${escapeHtml(projectTitle)}</span>` : '';
  const bodyHtml = `
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 24px;">
                Your assigned service project${extra} was removed from the portal.
              </p>
              <div style="padding: 24px; background-color: #111; border-radius: 12px; border: 1px solid #1a1a1a; margin-bottom: 32px;">
                <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #4b5563;">Access Update</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #d1d5db;">Priority support tickets are locked again until a new project is assigned.</p>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; margin-bottom: 40px;">
                For new inquiries, use the contact form on our website and our team will follow up.
              </p>
              <a href="${SITE_URL}/contact" style="display: inline-block; padding: 12px 24px; background-color: #fff; color: #000; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; margin-bottom: 8px;">Contact us</a>`;
  return {
    subject: 'Portal support tickets locked',
    text: `Your project was removed. Support tickets are locked until a new project is assigned.\nContact: ${SITE_URL}/contact`,
    html: clientShell({
      greetingHtml: `<h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #f3f4f6;">Hello,</h2>`,
      bodyHtml
    })
  };
}
