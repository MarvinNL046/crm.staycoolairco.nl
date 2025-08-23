"use client"

import { Loader2, AlertCircle, RefreshCw, CheckCircle, Clock, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
  showText?: boolean
}

// Basic spinning loader
export function LoadingSpinner({ className, size = 'md', text, showText = true }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {showText && (
        <span className="text-sm text-muted-foreground">
          {text || 'Loading...'}
        </span>
      )}
    </div>
  )
}

// Centered page loader
export function PageLoader({ text = "Loading page..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <div className="space-y-2">
          <h3 className="font-medium">{text}</h3>
          <p className="text-sm text-muted-foreground">Please wait a moment...</p>
        </div>
      </div>
    </div>
  )
}

// Data loading state
export function DataLoader({ 
  text = "Loading data...", 
  subtext = "Fetching latest information"
}: { 
  text?: string
  subtext?: string 
}) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-3">
        <div className="relative">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">{text}</p>
          <p className="text-xs text-muted-foreground">{subtext}</p>
        </div>
      </div>
    </div>
  )
}

// Error state with retry
export function ErrorState({ 
  title = "Something went wrong",
  message = "We couldn't load the data. Please try again.",
  onRetry,
  showRetry = true
}: {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-red-900">{title}</h3>
              <p className="text-sm text-red-700">{message}</p>
            </div>
            {showRetry && onRetry && (
              <Button onClick={onRetry} variant="outline" className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Empty state
export function EmptyState({
  icon: Icon = Clock,
  title = "No data found",
  message = "There's nothing here yet.",
  actionLabel,
  onAction,
  className
}: {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  return (
    <div className={cn("text-center py-12", className)}>
      <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// Success state
export function SuccessState({
  title = "Success!",
  message = "Operation completed successfully.",
  actionLabel,
  onAction
}: {
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="text-center py-8">
      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-green-900 mb-2">{title}</h3>
      <p className="text-green-700 mb-4">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// Network status indicator
export function NetworkStatus({ isOnline = true }: { isOnline?: boolean }) {
  return (
    <div className={cn(
      "fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
      isOnline 
        ? "bg-green-100 text-green-800 border border-green-200" 
        : "bg-red-100 text-red-800 border border-red-200"
    )}>
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      {isOnline ? 'Online' : 'Offline'}
    </div>
  )
}

// Loading overlay for partial updates
export function LoadingOverlay({ 
  show = false, 
  text = "Updating...",
  className 
}: { 
  show?: boolean
  text?: string
  className?: string 
}) {
  if (!show) return null
  
  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50",
      className
    )}>
      <div className="bg-card border rounded-lg p-6 shadow-lg">
        <LoadingSpinner text={text} />
      </div>
    </div>
  )
}

// Button loading state
export function LoadingButton({
  children,
  loading = false,
  loadingText = "Loading...",
  ...props
}: {
  children: React.ReactNode
  loading?: boolean
  loadingText?: string
  [key: string]: any
}) {
  return (
    <Button disabled={loading} {...props}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

// Progress indicator
export function ProgressIndicator({ 
  steps = [], 
  currentStep = 0,
  className 
}: { 
  steps?: string[]
  currentStep?: number
  className?: string 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium",
              index < currentStep 
                ? "bg-primary border-primary text-primary-foreground"
                : index === currentStep
                ? "border-primary text-primary bg-primary/10"
                : "border-muted-foreground/30 text-muted-foreground"
            )}>
              {index < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "h-0.5 w-12 mx-2",
                index < currentStep ? "bg-primary" : "bg-muted-foreground/30"
              )} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{steps[currentStep]}</p>
        <p className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}