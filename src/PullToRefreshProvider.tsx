import React, { createContext, useContext, useMemo, ReactNode } from "react";
import type { PullToRefreshConfig } from "./types";

interface PullToRefreshContextValue {
  config: PullToRefreshConfig;
}

const PullToRefreshContext = createContext<PullToRefreshContextValue | null>(
  null
);

export interface PullToRefreshProviderProps {
  config?: PullToRefreshConfig;
  children: ReactNode;
}

export const PullToRefreshProvider: React.FC<PullToRefreshProviderProps> = ({
  config = {},
  children,
}) => {
  const value = useMemo(
    () => ({
      config,
    }),
    [config]
  );

  return (
    <PullToRefreshContext.Provider value={value}>
      {children}
    </PullToRefreshContext.Provider>
  );
};

PullToRefreshProvider.displayName = "PullToRefreshProvider";

export const usePullToRefreshContext = (): PullToRefreshContextValue | null => {
  return useContext(PullToRefreshContext);
};

