import { Resend } from 'resend'

const getResendClient = () => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
}

export const sendEmailViaResend = async (emailData: EmailData) => {
  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: emailData.from || 'StayCool CRM <noreply@staycoolairco.nl>',
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      messageId: data?.id,
      result: data,
    }
  } catch (error) {
    console.error('Resend email error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Email templates (hergebruik van Gmail versie)
export const generateWelcomeEmail = (leadName: string, companyName: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Welkom bij ${companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${companyName}</h1>
        <p style="color: #666; margin: 5px 0;">Airconditioning & Klimaattechniek</p>
      </div>
      
      <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1e40af; margin-top: 0;">Hallo ${leadName}!</h2>
        <p>Bedankt voor je interesse in onze diensten. We hebben je aanvraag ontvangen en nemen zo spoedig mogelijk contact met je op.</p>
      </div>
      
      <div style="margin-bottom: 25px;">
        <h3 style="color: #1e40af;">Onze diensten:</h3>
        <ul style="padding-left: 20px;">
          <li>Airconditioning installatie</li>
          <li>Onderhoud en service</li>
          <li>Reparaties</li>
          <li>Energiebesparende oplossingen</li>
        </ul>
      </div>
      
      <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="color: #1e40af; margin-top: 0;">Wat kunnen we voor je doen?</h3>
        <p>We bellen je binnen 24 uur voor een vrijblijvend gesprek over je wensen en mogelijkheden.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; margin: 0;">Met vriendelijke groet,</p>
        <p style="color: #1e40af; font-weight: bold; margin: 5px 0;">${companyName}</p>
        <p style="color: #666; font-size: 14px; margin: 10px 0;">
          Dit bericht is automatisch gegenereerd door StayCool CRM
        </p>
      </div>
    </body>
    </html>
  `

  return { html }
}

export const generateStatusChangeEmail = (
  leadName: string, 
  oldStatus: string, 
  newStatus: string, 
  companyName: string
) => {
  const statusMessages = {
    contacted: 'We hebben contact met je opgenomen en je aanvraag in behandeling genomen.',
    qualified: 'Je aanvraag is gekwalificeerd en we gaan een passende oplossing voor je uitwerken.',
    proposal: 'We hebben een offerte voor je opgesteld. Check je email voor de details!',
    won: 'Fantastisch! We gaan aan de slag met je project. Je ontvangt binnenkort meer informatie.',
    lost: 'Helaas kunnen we op dit moment niet aan je wensen voldoen. Neem gerust contact op als je situatie verandert.',
  }

  const message = statusMessages[newStatus as keyof typeof statusMessages] || 
                  `Je aanvraag status is bijgewerkt naar: ${newStatus}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Status Update - ${companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">${companyName}</h1>
        <p style="color: #666; margin: 5px 0;">Status Update</p>
      </div>
      
      <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #1e40af; margin-top: 0;">Hallo ${leadName}!</h2>
        <p>${message}</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #666; margin: 0;">Heb je vragen? Neem gerust contact op!</p>
        <p style="color: #1e40af; font-weight: bold; margin: 5px 0;">${companyName}</p>
        <p style="color: #666; font-size: 14px; margin: 10px 0;">
          Dit bericht is automatisch gegenereerd door StayCool CRM
        </p>
      </div>
    </body>
    </html>
  `

  return { html }
}