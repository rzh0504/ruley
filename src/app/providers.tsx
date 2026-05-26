"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import {
  AnchoredToastProvider,
  ToastProvider,
} from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider position="bottom-right">
        <AnchoredToastProvider>{children}</AnchoredToastProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
