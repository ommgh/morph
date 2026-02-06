"use client";

import * as React from "react";
import { useTamboStreamStatus, useTamboComponentState } from "@tambo-ai/react";

/**
 * Stream status type that works both inside and outside TamboMessageProvider
 */
interface SafeStreamStatus {
  isPending: boolean;
  isStreaming: boolean;
  isComplete?: boolean;
  isError: boolean;
  streamError?: Error | null;
}

/**
 * Default stream status when outside TamboMessageProvider
 */
const defaultStreamStatus: SafeStreamStatus = {
  isPending: false,
  isStreaming: false,
  isComplete: true,
  isError: false,
  streamError: null,
};

/**
 * Safe wrapper for useTamboStreamStatus that works outside TamboMessageProvider
 * Returns default "complete" status when not in provider context
 */
export function useSafeTamboStreamStatus<T extends Record<string, unknown>>(): {
  streamStatus: SafeStreamStatus;
  propStatus: Partial<Record<keyof T, { isStreaming: boolean }>>;
} {
  try {
    // This will throw if not in provider
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const status = useTamboStreamStatus<T>();
    return status as {
      streamStatus: SafeStreamStatus;
      propStatus: Partial<Record<keyof T, { isStreaming: boolean }>>;
    };
  } catch {
    // Not in provider, return defaults
    return {
      streamStatus: defaultStreamStatus,
      propStatus: {} as Partial<Record<keyof T, { isStreaming: boolean }>>,
    };
  }
}

/**
 * Safe wrapper for useTamboComponentState that works outside TamboMessageProvider
 * Falls back to regular React state when not in provider context
 */
export function useSafeTamboComponentState<T>(
  key: string,
  initialValue: T,
): [T, (value: T) => void] {
  // Regular React state as fallback
  const [localState, setLocalState] = React.useState<T>(initialValue);

  try {
    // This will throw if not in provider
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [state, setState] = useTamboComponentState<T>(key, initialValue);
    // State could be undefined, fall back to initialValue
    return [state ?? initialValue, setState];
  } catch {
    // Not in provider, use local state
    return [localState, setLocalState];
  }
}
