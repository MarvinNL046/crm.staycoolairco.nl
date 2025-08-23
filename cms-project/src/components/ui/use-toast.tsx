import { toast as sonnerToast } from "sonner"

export function useToast() {
  return {
    toast: ({ title, description, variant, ...props }: {
      title?: string
      description?: string
      variant?: "default" | "destructive"
      duration?: number
    }) => {
      if (variant === "destructive") {
        sonnerToast.error(title, {
          description,
          duration: props.duration,
        })
      } else {
        sonnerToast.success(title, {
          description,
          duration: props.duration,
        })
      }
    },
    dismiss: sonnerToast.dismiss,
  }
}

export { useToast as toast }