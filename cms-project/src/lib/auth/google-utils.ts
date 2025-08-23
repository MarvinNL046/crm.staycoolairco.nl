/**
 * Generate a nonce for Google One Tap authentication
 * Returns both the raw nonce and the hashed version
 */
export async function generateNonce(): Promise<[string, string]> {
  // Generate a random nonce
  const nonce = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
  )
  
  // Create SHA-256 hash of the nonce
  const encoder = new TextEncoder()
  const encodedNonce = encoder.encode(nonce)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedNonce)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashedNonce = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  
  return [nonce, hashedNonce]
}

/**
 * Extract and store Google OAuth tokens from the session
 * This is useful when you need to access Google services on behalf of the user
 */
export function extractProviderToken(session: any) {
  if (session?.provider_token) {
    // Store the provider token securely
    // Note: In a real application, you'd want to store this in a secure way
    // For now, we'll just return it
    return {
      provider_token: session.provider_token,
      provider_refresh_token: session.provider_refresh_token,
    }
  }
  return null
}

/**
 * Check if Google One Tap is supported in the current browser
 */
export function isGoogleOneTapSupported(): boolean {
  // Check for FedCM API support (required for Chrome's third-party cookie phase-out)
  if ('IdentityCredential' in window) {
    return true
  }
  
  // Fallback for older browsers
  return typeof window !== 'undefined' && !!window.google?.accounts?.id
}