const messagebird = require('messagebird')

// MessageBird client setup
const getMessageBirdClient = () => {
  if (!process.env.MESSAGEBIRD_API_KEY) {
    throw new Error('MESSAGEBIRD_API_KEY environment variable is not set')
  }
  return messagebird(process.env.MESSAGEBIRD_API_KEY)
}

// Bird API via HTTP (nieuwe MessageBird API)
const BIRD_BASE_URL = 'https://api.bird.com'

const getBirdHeaders = () => ({
  'Authorization': `AccessKey ${process.env.MESSAGEBIRD_API_KEY}`,
  'Content-Type': 'application/json'
})

export interface SMSData {
  to: string
  message: string
  from?: string
}

export interface WhatsAppData {
  to: string
  message: string
  template?: {
    name: string
    parameters?: Array<{ type: string; text: string }>
  }
}

// SMS versturen via Bird API (nieuwe versie)
export const sendSMS = async (smsData: SMSData) => {
  try {
    if (!process.env.MESSAGEBIRD_WORKSPACE_ID || !process.env.MESSAGEBIRD_SMS_CHANNEL_ID) {
      throw new Error('MessageBird workspace ID en SMS channel ID zijn vereist')
    }

    const payload = {
      receiver: {
        contacts: [
          {
            identifierValue: formatPhoneNumber(smsData.to)
          }
        ]
      },
      body: {
        type: 'text',
        text: {
          text: smsData.message
        }
      }
    }

    const url = `${BIRD_BASE_URL}/workspaces/${process.env.MESSAGEBIRD_WORKSPACE_ID}/channels/${process.env.MESSAGEBIRD_SMS_CHANNEL_ID}/messages`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getBirdHeaders(),
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return {
      success: true,
      messageId: data.id,
      result: data
    }
  } catch (error) {
    console.error('SMS send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Fallback SMS via legacy MessageBird SDK (voor backward compatibility)
export const sendSMSLegacy = async (smsData: SMSData) => {
  try {
    const mb = getMessageBirdClient()
    
    const params = {
      originator: smsData.from || 'StayCool',
      recipients: [formatPhoneNumber(smsData.to)],
      body: smsData.message
    }

    return new Promise((resolve, reject) => {
      mb.messages.create(params, (err: any, response: any) => {
        if (err) {
          console.error('MessageBird SMS error:', err)
          reject({
            success: false,
            error: err.message || 'SMS send failed',
            details: err
          })
        } else {
          resolve({
            success: true,
            messageId: response.id,
            result: response
          })
        }
      })
    })
  } catch (error) {
    console.error('SMS send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// WhatsApp bericht versturen via Bird API
export const sendWhatsApp = async (whatsappData: WhatsAppData) => {
  try {
    if (!process.env.MESSAGEBIRD_WORKSPACE_ID || !process.env.MESSAGEBIRD_WHATSAPP_CHANNEL_ID) {
      throw new Error('MessageBird workspace ID en WhatsApp channel ID zijn vereist')
    }

    let messageBody
    
    if (whatsappData.template) {
      // Template message (voor marketing/notifications)
      messageBody = {
        type: 'template',
        template: {
          name: whatsappData.template.name,
          language: { code: 'nl' },
          components: whatsappData.template.parameters ? [
            {
              type: 'body',
              parameters: whatsappData.template.parameters
            }
          ] : undefined
        }
      }
    } else {
      // Regular text message
      messageBody = {
        type: 'text',
        text: {
          text: whatsappData.message
        }
      }
    }

    const payload = {
      receiver: {
        contacts: [
          {
            identifierValue: formatPhoneNumber(whatsappData.to)
          }
        ]
      },
      body: messageBody
    }

    const url = `${BIRD_BASE_URL}/workspaces/${process.env.MESSAGEBIRD_WORKSPACE_ID}/channels/${process.env.MESSAGEBIRD_WHATSAPP_CHANNEL_ID}/messages`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getBirdHeaders(),
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return {
      success: true,
      messageId: data.id,
      result: data
    }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Format Nederlandse telefoonnummers voor internationale verzending
export const formatPhoneNumber = (phone: string): string => {
  // Remove alle non-digits
  const cleaned = phone.replace(/\D/g, '')
  
  // Nederlandse nummers
  if (cleaned.startsWith('06') && cleaned.length === 10) {
    return `+31${cleaned.substring(1)}` // 06xxxxxxxx → +316xxxxxxxx
  }
  
  if (cleaned.startsWith('316') && cleaned.length === 11) {
    return `+${cleaned}` // 316xxxxxxxx → +316xxxxxxxx
  }
  
  if (cleaned.startsWith('31') && cleaned.length === 11) {
    return `+${cleaned}` // 31xxxxxxxxx → +31xxxxxxxxx
  }
  
  // Andere landcodes
  if (cleaned.length > 10 && !cleaned.startsWith('+')) {
    return `+${cleaned}`
  }
  
  // Return as-is if already formatted or unknown format
  return phone.startsWith('+') ? phone : `+${cleaned}`
}

// SMS Templates
export const generateWelcomeSMS = (leadName: string, companyName: string) => {
  return `Hallo ${leadName}! Bedankt voor je interesse in ${companyName}. We nemen binnen 24 uur contact met je op voor een vrijblijvend gesprek. Mvg, ${companyName}`
}

export const generateStatusChangeSMS = (
  leadName: string, 
  newStatus: string, 
  companyName: string
) => {
  const statusMessages = {
    contacted: `Hallo ${leadName}, we hebben je aanvraag ontvangen en nemen binnenkort contact op.`,
    qualified: `Goed nieuws ${leadName}! Je aanvraag is goedgekeurd. We stellen een passende oplossing voor je samen.`,
    proposal: `${leadName}, je offerte is klaar! Check je email voor alle details.`,
    won: `Gefeliciteerd ${leadName}! We gaan aan de slag met je project. Meer info volgt binnenkort.`,
    lost: `Hallo ${leadName}, helaas kunnen we nu niet aan je wensen voldoen. Neem gerust contact op als je situatie verandert.`,
  }

  const message = statusMessages[newStatus as keyof typeof statusMessages] || 
                  `${leadName}, je aanvraag status is bijgewerkt.`

  return `${message} Mvg, ${companyName}`
}

// WhatsApp Templates
export const generateWhatsAppWelcome = (leadName: string, companyName: string) => {
  return {
    message: `🌟 Hallo ${leadName}!\n\nBedankt voor je interesse in ${companyName}! \n\n✅ Je aanvraag is ontvangen\n⏰ We bellen je binnen 24 uur\n💬 Heb je vragen? Reageer gewoon op dit bericht!\n\nMet vriendelijke groet,\n${companyName} 🏠❄️`,
  }
}

export const generateWhatsAppStatusUpdate = (
  leadName: string,
  newStatus: string, 
  companyName: string
) => {
  const statusEmojis = {
    contacted: '📞',
    qualified: '✅', 
    proposal: '📋',
    won: '🎉',
    lost: '😔'
  }

  const statusMessages = {
    contacted: `We hebben contact met je opgenomen en je aanvraag is in behandeling.`,
    qualified: `Goed nieuws! Je aanvraag is gekwalificeerd en we werken een oplossing voor je uit.`,
    proposal: `Je offerte is klaar! Check je email voor alle details.`,
    won: `Fantastisch! We gaan aan de slag met je project. Meer informatie volgt binnenkort.`,
    lost: `Helaas kunnen we nu niet aan je wensen voldoen. Neem gerust contact op als je situatie verandert.`,
  }

  const emoji = statusEmojis[newStatus as keyof typeof statusEmojis] || '📄'
  const message = statusMessages[newStatus as keyof typeof statusMessages] || 
                  `Je aanvraag status is bijgewerkt.`

  return {
    message: `${emoji} Hallo ${leadName}!\n\n${message}\n\nHeb je vragen? Reageer gewoon op dit bericht!\n\nMet vriendelijke groet,\n${companyName} 🏠❄️`
  }
}