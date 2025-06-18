// src/components/ui/toaster.tsx
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  // ToastClose, // No longer needed here
  // ToastDescription, // No longer needed here
  ToastProvider,
  // ToastTitle, // No longer needed here
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Ahora pasamos title y description explícitamente a Toast
        return (
          <Toast 
            key={id} 
            title={title} 
            description={description} 
            action={action} // action se pasa, aunque CustomToastCard no lo use actualmente
            {...props} 
          />
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
