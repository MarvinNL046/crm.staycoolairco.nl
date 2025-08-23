/**
 * Webhook Security Utilities
 * Production-ready webhook authentication, rate limiting, and monitoring
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { createBrowserClient } from '@supabase/ssr'

// Webhook signature validation
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Remove webhook secret prefix if present
    const cleanSecret = secret.replace('whsec_', '')
    
    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', cleanSecret)
      .update(payload, 'utf8')
      .digest('hex')
    
    // Compare signatures (timing-safe comparison)
    const expectedHeader = `sha256=${expectedSignature}`
    
    // Handle both formats: "sha256=..." or just the hex string
    const normalizedSignature = signature.startsWith('sha256=') 
      ? signature 
      : `sha256=${signature}`
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedHeader),
      Buffer.from(normalizedSignature)
    )
  } catch (error) {
    console.error('Webhook signature validation error:', error)
    return false
  }
}

// Rate limiting implementation
export class WebhookRateLimit {
  private supabase: any

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async checkRateLimit(
    tenantId: string,
    clientIp: string,
    limit: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    try {
      const windowStart = new Date()
      windowStart.setMinutes(windowStart.getMinutes() - 1) // 1-minute window

      // Get current rate limit record
      const { data: existingLimit } = await this.supabase
        .from('webhook_rate_limits')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('client_ip', clientIp)
        .gte('window_start', windowStart.toISOString())
        .single()

      if (existingLimit) {
        // Update existing record
        const newCount = existingLimit.request_count + 1
        
        if (newCount > limit) {
          // Rate limit exceeded
          await this.logSecurityEvent(tenantId, 'rate_limit_exceeded', clientIp, {
            request_count: newCount,
            limit,
            window_start: existingLimit.window_start
          })
          
          return {
            allowed: false,
            remaining: 0,
            resetTime: new Date(existingLimit.window_start.getTime() + 60000)
          }
        }

        // Update count
        await this.supabase
          .from('webhook_rate_limits')
          .update({
            request_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLimit.id)

        return {
          allowed: true,
          remaining: limit - newCount,
          resetTime: new Date(existingLimit.window_start.getTime() + 60000)
        }
      } else {
        // Create new rate limit record
        await this.supabase
          .from('webhook_rate_limits')
          .insert({
            tenant_id: tenantId,
            client_ip: clientIp,
            request_count: 1,
            window_start: new Date().toISOString()
          })

        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: new Date(Date.now() + 60000)
        }
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail open for availability, but log the error
      return {
        allowed: true,
        remaining: limit,
        resetTime: new Date(Date.now() + 60000)
      }
    }
  }

  private async logSecurityEvent(
    tenantId: string,
    eventType: string,
    clientIp: string,
    details: any,
    severity: string = 'medium'
  ) {
    try {
      await this.supabase
        .from('webhook_security_events')
        .insert({
          tenant_id: tenantId,
          event_type: eventType,
          client_ip: clientIp,
          details,
          severity
        })
    } catch (error) {
      console.error('Failed to log security event:', error)
    }
  }
}

// Webhook request logger
export class WebhookLogger {
  private supabase: any

  constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  async logWebhookRequest(
    tenantId: string,
    webhookType: string,
    request: {
      method: string
      headers: Record<string, any>
      body: any
      ip: string
      userAgent?: string
    },
    response: {
      status: number
      body: any
    },
    signatureValid: boolean,
    processingTimeMs: number,
    errorMessage?: string
  ) {
    try {
      await this.supabase
        .from('webhook_logs')
        .insert({
          tenant_id: tenantId,
          webhook_type: webhookType,
          url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://crm.staycoolairco.nl'}/api/webhook/leads?tenant=${tenantId}`,
          method: request.method,
          headers: request.headers,
          payload: request.body,
          response_status: response.status,
          response_body: JSON.stringify(response.body),
          client_ip: request.ip,
          user_agent: request.userAgent,
          signature_valid: signatureValid,
          processing_time_ms: processingTimeMs,
          error_message: errorMessage
        })
    } catch (error) {
      console.error('Failed to log webhook request:', error)
    }
  }
}

// Input validation and sanitization
export class WebhookValidator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 255
  }

  static sanitizeString(str: string, maxLength: number = 255): string {
    if (typeof str !== 'string') return ''
    
    // Remove dangerous characters and limit length
    return str
      .replace(/[<>'"&]/g, '') // Basic XSS protection
      .trim()
      .substring(0, maxLength)
  }

  static validatePhoneNumber(phone: string): boolean {
    // Basic international phone number validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
  }

  static validateLeadData(data: any): {
    isValid: boolean
    errors: string[]
    sanitized: any
  } {
    const errors: string[] = []
    const sanitized: any = {}

    // Required fields
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Name is required and must be a string')
    } else {
      sanitized.name = this.sanitizeString(data.name, 100)
      if (!sanitized.name) {
        errors.push('Name cannot be empty after sanitization')
      }
    }

    if (!data.email || typeof data.email !== 'string') {
      errors.push('Email is required and must be a string')
    } else if (!this.validateEmail(data.email)) {
      errors.push('Invalid email format')
    } else {
      sanitized.email = data.email.toLowerCase().trim()
    }

    // Optional fields
    if (data.phone) {
      if (typeof data.phone === 'string') {
        const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '')
        if (this.validatePhoneNumber(cleanPhone)) {
          sanitized.phone = cleanPhone
        } else {
          errors.push('Invalid phone number format')
        }
      } else {
        errors.push('Phone must be a string')
      }
    }

    if (data.message && typeof data.message === 'string') {
      sanitized.message = this.sanitizeString(data.message, 1000)
    }

    if (data.source && typeof data.source === 'string') {
      sanitized.source = this.sanitizeString(data.source, 50)
    } else {
      sanitized.source = 'webhook'
    }

    // Additional metadata with size limits
    if (data.metadata && typeof data.metadata === 'object') {
      sanitized.metadata = {}
      const metadataStr = JSON.stringify(data.metadata)
      if (metadataStr.length <= 5000) { // Limit metadata size
        sanitized.metadata = data.metadata
      } else {
        errors.push('Metadata too large (max 5000 characters)')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized
    }
  }
}

// Get client IP from request
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = request.headers.get('x-client-ip')
  
  if (forwardedFor) {
    // Take the first IP from the comma-separated list
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) return realIp
  if (clientIp) return clientIp
  
  // Fallback - NextRequest doesn't have ip property in newer versions
  return 'unknown'
}

// Webhook configuration helper
export async function getWebhookConfig(tenantId: string) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: config, error } = await supabase
    .from('webhook_configs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  if (error || !config) {
    throw new Error('Webhook configuration not found or inactive')
  }

  return config
}