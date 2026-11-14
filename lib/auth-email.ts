type AuthEmailInput = {
  recipient: string
  subject: string
  title: string
  description: string
  actionUrl: string
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

export async function sendAuthEmail({
  recipient,
  subject,
  title,
  description,
  actionUrl,
}: AuthEmailInput) {
  const apiKey = process.env.RESEND_API_KEY
  const domain = process.env.RESEND_EMAIL_DOMAIN

  if (!apiKey || !domain) {
    throw new Error('Email delivery is not configured.')
  }

  const safeUrl = escapeHtml(actionUrl)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `MAKONI <no-reply@${domain}>`,
      to: [recipient],
      subject,
      html: `<main style="font-family:Arial,sans-serif;color:#193b32;line-height:1.6"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#193b32;color:#fff;text-decoration:none;border-radius:8px">Davom etish</a></p><p>Agar tugma ishlamasa, ushbu havolani brauzerga nusxalang:</p><p>${safeUrl}</p><p>Bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.</p></main>`,
      text: `${title}\n\n${description}\n\nDavom etish: ${actionUrl}\n\nBu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Email delivery failed with status ${response.status}.`)
  }
}
