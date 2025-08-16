import { google } from 'googleapis'
import nodemailer from 'nodemailer'

// Gmail API client setup
const getGmailClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

// Nodemailer transporter voor Gmail
const createGmailTransporter = (accessToken: string) => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  })
}

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

// Gmail versturen via Nodemailer (eenvoudiger)
export const sendEmailViaGmail = async (emailData: EmailData) => {
  try {
    // Get fresh access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()
    const accessToken = credentials.access_token

    if (!accessToken) {
      throw new Error('Could not retrieve access token')
    }

    // Create transporter
    const transporter = createGmailTransporter(accessToken)

    // Send email
    const result = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    return {
      success: true,
      messageId: result.messageId,
      result,
    }
  } catch (error) {
    console.error('Gmail send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Email templates
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

  return {
    html,
    text: `Hallo ${leadName}!\n\nBedankt voor je interesse in onze diensten. We hebben je aanvraag ontvangen en nemen zo spoedig mogelijk contact met je op.\n\nOnze diensten:\n- Airconditioning installatie\n- Onderhoud en service\n- Reparaties\n- Energiebesparende oplossingen\n\nWe bellen je binnen 24 uur voor een vrijblijvend gesprek over je wensen en mogelijkheden.\n\nMet vriendelijke groet,\n${companyName}`,
  }
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

  return {
    html,
    text: `Hallo ${leadName}!\n\n${message}\n\nHeb je vragen? Neem gerust contact op!\n\n${companyName}`,
  }
}