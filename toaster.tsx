'use client';

import { useEffect, useState } from 'react';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { registerToastQueue, type Toast as ToastType } from '@/components/ui/use-toast';

export function Toaster() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    registerToastQueue((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    });
  }, []);

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast key={toast.id} variant={toast.variant} open>
          <div className="grid gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
          </div>
          <ToastClose onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
