import React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// Memoized toast item component for better performance
const ToastItem = React.memo(({ id, title, description, action, ...props }: any) => (
  <Toast key={id} {...props}>
    <div className="grid gap-1">
      {title && <ToastTitle>{title}</ToastTitle>}
      {description && (
        <ToastDescription>{description}</ToastDescription>
      )}
    </div>
    {action}
    <ToastClose />
  </Toast>
));

ToastItem.displayName = "ToastItem";

export const Toaster = React.memo(() => {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
      <ToastViewport />
    </ToastProvider>
  )
});

Toaster.displayName = "Toaster";
