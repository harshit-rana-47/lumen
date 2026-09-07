"use client";

import { useEffect, useState } from "react";
import { waitForApiReady, type ApiReadyStatus } from "@/lib/apiReadiness";

export function useApiReady(): ApiReadyStatus {
  const [status, setStatus] = useState<ApiReadyStatus>("starting");

  useEffect(() => {
    const controller = new AbortController();

    void waitForApiReady(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          setStatus("ready");
        }
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setStatus("unreachable");
        void caught;
      });

    return () => {
      controller.abort();
    };
  }, []);

  return status;
}
