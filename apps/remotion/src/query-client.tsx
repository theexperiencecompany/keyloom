"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";

function createRemotionQueryClient() {
  // chat-ui has internal `useQuery` calls for integrations (config / user /
  // status) that point at a GAIA backend not present here. A catch-all
  // queryFn plus shaped integration cache keeps those internal queries silent
  // during Remotion previews and renders.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: async () => null,
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
        refetchOnWindowFocus: false,
      },
    },
  });

  queryClient.setQueryDefaults(["integrations"], {
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
  queryClient.setQueryData(["integrations", "config"], {
    configurations: [],
  });
  queryClient.setQueryData(["integrations", "user"], { integrations: [] });
  queryClient.setQueryData(["integrations", "status"], { status: {} });

  return queryClient;
}

export function RemotionQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createRemotionQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

type AnyComponent = ComponentType<any>;

const wrappedComponents = new WeakMap<AnyComponent, AnyComponent>();

export function withRemotionQueryClient<P extends object>(
  Component: ComponentType<P>,
): ComponentType<P> {
  const existing = wrappedComponents.get(Component as AnyComponent);
  if (existing) return existing as ComponentType<P>;

  const Wrapped = (props: P) => (
    <RemotionQueryProvider>
      <Component {...props} />
    </RemotionQueryProvider>
  );
  Wrapped.displayName = `WithRemotionQueryClient(${
    Component.displayName ?? Component.name ?? "Component"
  })`;

  wrappedComponents.set(Component as AnyComponent, Wrapped as AnyComponent);
  return Wrapped;
}
