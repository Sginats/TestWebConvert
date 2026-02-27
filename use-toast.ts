'use client';

import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

let toastQueue: ((t: Toast) => void) | null = null;

export function useToast() {
  const toast = useCallback(
    ({
      title,
      description,
      variant,
    }: {
      title: string;
      description?: string;
      variant?: ToastVariant;
    }) => {
      if (toastQueue) {
        toastQueue({ id: String(Date.now()), title, description, variant });
      }
    },
    [],
  );

  return { toast };
}

export function registerToastQueue(fn: (t: Toast) => void) {
  toastQueue = fn;
}

export type { Toast };
