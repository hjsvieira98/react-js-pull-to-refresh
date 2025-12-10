import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useImperativeHandle,
  CSSProperties,
} from "react";
import type { PullToRefreshProps, PullToRefreshState, PullToRefreshHandle, HapticFeedbackConfig } from "./types";
import { usePullToRefreshContext } from "./PullToRefreshProvider";

const DEFAULT_THRESHOLD = 80;
const DEFAULT_CAN_RELEASE_THRESHOLD = 0.8;
const DEFAULT_COMPLETE_DURATION = 1000;
const DEFAULT_RESISTANCE = 0.5;
const INDICATOR_Z_INDEX = 1000;
const TRANSITION_DURATION = "0.3s";

const resetToIdleState = (
  setState: (state: PullToRefreshState) => void,
  setPullDistance: React.Dispatch<React.SetStateAction<number>>,
  pullDistanceRef: React.MutableRefObject<number>,
  isRefreshingRef: React.MutableRefObject<boolean>
) => {
  setState("idle");
  setPullDistance(0);
  pullDistanceRef.current = 0;
  isRefreshingRef.current = false;
};

// Helper function for haptic feedback
const triggerHapticFeedback = (
  type: 'light' | 'medium' | 'heavy' = 'medium',
  config?: HapticFeedbackConfig
) => {
  if (typeof window === 'undefined') return;
  
  // Get custom intensity or use default
  const getIntensity = (feedbackType: 'light' | 'medium' | 'heavy') => {
    if (!config) return undefined;
    
    switch (feedbackType) {
      case 'light':
        return config.light;
      case 'medium':
        return config.medium;
      case 'heavy':
        return config.heavy;
    }
  };
  
  const intensity = getIntensity(type);
  
  // Check for Vibration API (Android)
  if ('vibrate' in navigator) {
    // If intensity is a number, use it directly
    if (typeof intensity === 'number') {
      navigator.vibrate(Math.min(Math.max(intensity, 0), 1000)); // Clamp between 0-1000ms
      return;
    }
    // Default patterns for Android
    const patterns: Record<string, number> = {
      light: 10,
      medium: 20,
      heavy: 30,
    };
    navigator.vibrate(patterns[type]);
    return;
  }

  // Check for Haptic Feedback API (iOS Safari)
  // @ts-ignore - Haptic feedback API is not in TypeScript types yet
  if (window.TapticEngine) {
    // If intensity is a string, use it directly
    if (typeof intensity === 'string') {
      // @ts-ignore
      window.TapticEngine.impact({ style: intensity });
      return;
    }
    // Default to the type passed
    // @ts-ignore
    window.TapticEngine.impact({ style: type });
    return;
  }
};

// Validation helper
const validateProps = (props: Partial<PullToRefreshProps>, isDev: boolean) => {
  if (!isDev) return;

  if (props.threshold !== undefined && props.threshold <= 0) {
    console.warn('PullToRefresh: threshold must be greater than 0');
  }
  if (props.canReleaseThreshold !== undefined && (props.canReleaseThreshold < 0 || props.canReleaseThreshold > 1)) {
    console.warn('PullToRefresh: canReleaseThreshold must be between 0 and 1');
  }
  if (props.resistance !== undefined && (props.resistance < 0 || props.resistance > 1)) {
    console.warn('PullToRefresh: resistance must be between 0 and 1');
  }
  if (props.completeDuration !== undefined && props.completeDuration < 0) {
    console.warn('PullToRefresh: completeDuration must be greater than or equal to 0');
  }
};

export const PullToRefresh = React.memo(
  React.forwardRef<HTMLDivElement | PullToRefreshHandle, PullToRefreshProps>(
    (
      {
        onRefresh,
        children,
        threshold,
        containerRef,
        disabled = false,
        canReleaseThreshold,
        indicator,
        completeDuration,
        className,
        style,
        indicatorClassName,
        indicatorStyle,
        renderIndicator,
        resistance,
        onStateChange,
        onPullStart,
        onPullEnd,
        onError,
        hapticFeedback = {enabled: true},
        accessibility,
      },
      ref
    ) => {
      const isDev = process.env.NODE_ENV === 'development';
      
      // Validate props in development
      useEffect(() => {
        validateProps({ threshold, canReleaseThreshold, resistance, completeDuration }, isDev);
      }, [threshold, canReleaseThreshold, resistance, completeDuration, isDev]);
      const context = usePullToRefreshContext();

      const masterThreshold = threshold ?? context?.config.threshold ?? DEFAULT_THRESHOLD;
      const masterCanReleaseThreshold = canReleaseThreshold ?? context?.config.canReleaseThreshold ?? DEFAULT_CAN_RELEASE_THRESHOLD;
      const masterCompleteDuration = completeDuration ?? context?.config.completeDuration ?? DEFAULT_COMPLETE_DURATION;
      const masterResistance = resistance ?? context?.config.resistance ?? DEFAULT_RESISTANCE;
      const masterIndicator = indicator ?? context?.config.indicator;
      const masterClassName = className ?? context?.config.className;
      const masterStyle = style ?? context?.config.style;
      const masterIndicatorClassName = indicatorClassName ?? context?.config.indicatorClassName;
      const masterIndicatorStyle = indicatorStyle ?? context?.config.indicatorStyle;
      const masterRenderIndicator = renderIndicator ?? context?.config.renderIndicator;


      // Merge callbacks from props and context
      const masterOnStateChange = onStateChange ?? context?.config.onStateChange;
      const masterOnPullStart = onPullStart ?? context?.config.onPullStart;
      const masterOnPullEnd = onPullEnd ?? context?.config.onPullEnd;
      const masterOnError = onError ?? context?.config.onError;
      // Process haptic feedback config: convert boolean to config object if needed
      const masterHapticFeedback = hapticFeedback ?? context?.config.hapticFeedback;
      
      // Merge accessibility config
      const masterAccessibility = accessibility ?? context?.config.accessibility;

      if (!masterIndicator && !masterRenderIndicator) {
        throw new Error(
          "PullToRefresh: 'indicator' is required. " +
          "Provide it via the 'indicator' prop or through PullToRefreshProvider, " +
          "or use 'renderIndicator' to customize the indicator rendering."
        );
      }

      const [state, setState] = useState<PullToRefreshState>("idle");
      const [pullDistance, setPullDistance] = useState(0);

      // State setter with callback
      const setStateWithCallback = useCallback((newState: PullToRefreshState) => {
        setState(newState);
        if (masterOnStateChange) {
          masterOnStateChange(newState);
        }
      }, [masterOnStateChange]);

      const containerElementRef = useRef<HTMLElement | null>(null);
      const startYRef = useRef<number>(0);
      const isDraggingRef = useRef<boolean>(false);
      const isRefreshingRef = useRef<boolean>(false);
      const touchIdRef = useRef<number | null>(null);
      const pullDistanceRef = useRef<number>(0);

      const releaseThreshold = masterThreshold * masterCanReleaseThreshold;

      const getScrollableContainer = useCallback((): HTMLElement | Window | null => {
        if (containerRef?.current) {
          return containerRef.current;
        }

        if (containerElementRef.current) {
          let parent = containerElementRef.current.parentElement;
          while (parent && parent !== document.body && parent !== document.documentElement) {
            if (typeof window !== 'undefined') {
              const style = window.getComputedStyle(parent);
              const isScrollable = 
                style.overflow === 'auto' || 
                style.overflow === 'scroll' || 
                style.overflowY === 'auto' || 
                style.overflowY === 'scroll';
              
              if (isScrollable) {
                return parent;
              }
            }
            parent = parent.parentElement;
          }
          return typeof window !== 'undefined' ? window : null;
        }
        return typeof window !== 'undefined' ? window : null;
      }, [containerRef]);

      const isContainerAtTop = useCallback(
        (container: HTMLElement | Window): boolean => {
          if (typeof window === 'undefined') return false;
          
          if (container === window || container === document.documentElement || container === document.body) {
            return window.scrollY === 0 && document.documentElement.scrollTop === 0;
          }
          if (container instanceof HTMLElement) {
            return container.scrollTop === 0;
          }
          return false;
        },
        []
      );

      const getYPosition = useCallback((event: TouchEvent | MouseEvent): number => {
        if ("touches" in event) {
          return event.touches[0]?.clientY ?? 0;
        }
        return event.clientY;
      }, []);

      const calculatePullDistance = useCallback(
        (deltaY: number): number => {
          if (deltaY <= 0) return 0;
          if (deltaY <= masterThreshold) return deltaY;
          return masterThreshold + (deltaY - masterThreshold) * masterResistance;
        },
        [masterThreshold, masterResistance]
      );

      const resetState = useCallback(() => {
        resetToIdleState(setStateWithCallback, setPullDistance, pullDistanceRef, isRefreshingRef);
      }, [setStateWithCallback]);

      // Create internal ref for DOM element
      const internalRef = useRef<HTMLDivElement | null>(null);

      // Implement PullToRefreshHandle methods
      const refreshMethod = useCallback(async () => {
        if (disabled || isRefreshingRef.current) return;
        
        isRefreshingRef.current = true;
        setStateWithCallback("refreshing");
        setPullDistance(masterThreshold);
        pullDistanceRef.current = masterThreshold;

        if (masterHapticFeedback.enabled) {
          triggerHapticFeedback('medium', masterHapticFeedback);
        }

        try {
          const result = onRefresh();
          if (result && typeof result.then === 'function') {
            await result;
          }
          setStateWithCallback("complete");
          setPullDistance(masterThreshold);
          pullDistanceRef.current = masterThreshold;

          setTimeout(() => {
            resetState();
          }, masterCompleteDuration);
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              setStateWithCallback("error");
          
          if (masterOnError) {
            masterOnError(error);
          } else {
            console.error("Pull to refresh error:", error);
          }
          
          // Reset after error
          setTimeout(() => {
            resetState();
          }, 2000);
        }
      }, [disabled, masterThreshold, masterCompleteDuration, onRefresh, resetState, setStateWithCallback, masterHapticFeedback, masterOnError]);

      const resetMethod = useCallback(() => {
        resetState();
      }, [resetState]);

      // Use imperative handle for PullToRefreshHandle type
      useImperativeHandle(
        ref as React.RefObject<PullToRefreshHandle> | null,
        () => ({
          refresh: refreshMethod,
          reset: resetMethod,
        }),
        [refreshMethod, resetMethod]
      );

      // Handle ref forwarding for HTMLDivElement
      const handleRef = useCallback(
        (node: HTMLDivElement | null) => {
          containerElementRef.current = node;
          internalRef.current = node;
          
          if (typeof ref === "function") {
            // Check if ref expects PullToRefreshHandle or HTMLDivElement
            // Try to call with handle first, then with node
            try {
              ref({ refresh: refreshMethod, reset: resetMethod } as any);
            } catch {
              ref(node);
            }
          } else if (ref && 'current' in ref) {
            // Check if ref is for PullToRefreshHandle
            const handle: PullToRefreshHandle = {
              refresh: refreshMethod,
              reset: resetMethod,
            };
            
            // Try to assign handle, if it fails, assign node
            try {
              (ref as React.MutableRefObject<PullToRefreshHandle | HTMLDivElement | null>).current = handle as any;
            } catch {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }
        },
        [ref, refreshMethod, resetMethod]
      );

      const handleDragStart = useCallback(
        (event: TouchEvent | MouseEvent) => {
          if (disabled || isRefreshingRef.current) return;

          const container = getScrollableContainer();
          if (!container || !isContainerAtTop(container)) return;

          const y = getYPosition(event);
          startYRef.current = y;
          isDraggingRef.current = true;

          if ("touches" in event && event.touches.length > 0) {
            touchIdRef.current = event.touches[0].identifier;
          }

          // Don't preventDefault here - wait until we know user is actually pulling down
          // This allows normal scrolling to work
        },
        [disabled, getScrollableContainer, isContainerAtTop, getYPosition]
      );

      const handleDragMove = useCallback(
        (event: TouchEvent | MouseEvent) => {
          if (!isDraggingRef.current || disabled || isRefreshingRef.current) {
            return;
          }

          if ("touches" in event) {
            const touch = Array.from(event.touches).find(
              (t) => t.identifier === touchIdRef.current
            );
            if (!touch) return;
          }

          const y = getYPosition(event);
          const deltaY = y - startYRef.current;
          const container = getScrollableContainer();

          // Check if container is still at top
          if (!container || !isContainerAtTop(container)) {
            isDraggingRef.current = false;
            resetState();
            return;
          }

          // Only prevent default and handle pull when user is pulling DOWN (deltaY > 0)
          // Allow normal scroll when user is scrolling up (deltaY < 0)
          if (deltaY > 0) {
            const distance = calculatePullDistance(deltaY);
            setPullDistance(distance);
            pullDistanceRef.current = distance;

            const progress = distance / masterThreshold;
            const previousState = state;
            
            // Only call onPullStart on first pull
            if (previousState === "idle" && masterOnPullStart) {
              masterOnPullStart();
            }
            
            if (progress >= masterCanReleaseThreshold) {
              setStateWithCallback("canRelease");
              // Haptic feedback when reaching canRelease state
              if (masterHapticFeedback.enabled && previousState !== "canRelease") {
                triggerHapticFeedback('medium', masterHapticFeedback);
              }
            } else {
              setStateWithCallback("pulling");
              // Light haptic feedback on first pull
              if (masterHapticFeedback.enabled && previousState === "idle") {
                triggerHapticFeedback('light', masterHapticFeedback);
              }
            }

            // Only prevent default when actually pulling down
            event.preventDefault();
          } else if (deltaY < 0) {
            // User is scrolling up, allow normal scroll
            isDraggingRef.current = false;
            resetState();
          }
        },
        [
          disabled,
          getScrollableContainer,
          isContainerAtTop,
          getYPosition,
          calculatePullDistance,
          masterThreshold,
          masterCanReleaseThreshold,
          resetState,
          setStateWithCallback,
          state,
          masterHapticFeedback,
          masterOnPullStart,
        ]
      );

      const handleDragEnd = useCallback(async () => {
        if (!isDraggingRef.current || disabled) return;

        isDraggingRef.current = false;
        touchIdRef.current = null;

        const currentDistance = pullDistanceRef.current;
        const shouldTriggerRefresh = currentDistance >= releaseThreshold;

        if (masterOnPullEnd) {
          masterOnPullEnd();
        }

        if (shouldTriggerRefresh && !isRefreshingRef.current) {
          isRefreshingRef.current = true;
          setStateWithCallback("refreshing");
          setPullDistance(masterThreshold);
          pullDistanceRef.current = masterThreshold;

          if (masterHapticFeedback.enabled) {
            triggerHapticFeedback('heavy', masterHapticFeedback);
          }

          try {
            const result = onRefresh();

            if (result && typeof result.then === 'function') {
              await result;

              setStateWithCallback("complete");
              setPullDistance(masterThreshold);
              pullDistanceRef.current = masterThreshold;

              setTimeout(() => {
                resetState();
              }, masterCompleteDuration);
            } else {
              setStateWithCallback("complete");
              setPullDistance(masterThreshold);
              pullDistanceRef.current = masterThreshold;

              setTimeout(() => {
                resetState();
              }, Math.min(masterCompleteDuration, 300));
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setStateWithCallback("error");
            
            if (masterOnError) {
              masterOnError(error);
            } else {
              console.error("Pull to refresh error:", error);
            }
            
            // Reset after error
            setTimeout(() => {
              resetState();
            }, 2000);
          }
        } else {
          resetState();
        }
      }, [disabled, masterThreshold, releaseThreshold, onRefresh, masterCompleteDuration, resetState, setStateWithCallback, masterOnPullEnd, masterHapticFeedback, masterOnError, state]);

      useEffect(() => {
        if (disabled) return;

        const container = getScrollableContainer();
        if (!container) return;

        const eventTarget = container === window ? document : container;

        const handleTouchStart = (e: Event) => {
          if (e instanceof TouchEvent) handleDragStart(e);
        };

        const handleTouchMove = (e: Event) => {
          if (e instanceof TouchEvent) handleDragMove(e);
        };

        const handleTouchEnd = () => handleDragEnd();

        const handleMouseDown = (e: Event) => {
          if (e instanceof MouseEvent) handleDragStart(e);
        };

        const handleMouseMove = (e: Event) => {
          if (e instanceof MouseEvent) handleDragMove(e);
        };

        const handleMouseUp = () => handleDragEnd();

        eventTarget.addEventListener("touchstart", handleTouchStart, { passive: false });
        eventTarget.addEventListener("touchmove", handleTouchMove, { passive: false });
        eventTarget.addEventListener("touchend", handleTouchEnd, { passive: false });
        eventTarget.addEventListener("touchcancel", handleTouchEnd, { passive: false });

        eventTarget.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
          eventTarget.removeEventListener("touchstart", handleTouchStart);
          eventTarget.removeEventListener("touchmove", handleTouchMove);
          eventTarget.removeEventListener("touchend", handleTouchEnd);
          eventTarget.removeEventListener("touchcancel", handleTouchEnd);
          eventTarget.removeEventListener("mousedown", handleMouseDown);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }, [disabled, getScrollableContainer, handleDragStart, handleDragMove, handleDragEnd]);


      const indicatorOpacity = useMemo(() => {
        if (state === "idle" && pullDistance === 0) return 0;
        if (state === "refreshing" || state === "complete") return 1;
        return Math.min(pullDistance / masterThreshold, 1);
      }, [pullDistance, masterThreshold, state]);

      const childrenTranslateY = useMemo(() => {
        return pullDistance > 0 ? Math.min(pullDistance, masterThreshold) : 0;
      }, [pullDistance, masterThreshold]);

      const childrenTransform = useMemo(() => {
        return childrenTranslateY > 0
          ? `translateY(${childrenTranslateY}px)`
          : "none";
      }, [childrenTranslateY]);

      const pullProgress = useMemo(() => {
        return Math.min(pullDistance / masterThreshold, 1);
      }, [pullDistance, masterThreshold]);

      const containerStyles: CSSProperties = useMemo(
        () => ({
          position: "relative",
          overflow: "hidden",
          ...masterStyle,
        }),
        [masterStyle]
      );

      const baseIndicatorStyles: CSSProperties = useMemo(
        () => ({
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          paddingTop: "10px",
          paddingBottom: "10px",
          opacity: indicatorOpacity,
          transition:
            state === "idle" || state === "complete"
              ? `opacity ${TRANSITION_DURATION} ease`
              : "none",
          pointerEvents: "none",
          zIndex: INDICATOR_Z_INDEX,
        }),
        [indicatorOpacity, state]
      );

      const indicatorStyles: CSSProperties = useMemo(
        () => ({
          ...baseIndicatorStyles,
          ...masterIndicatorStyle,
        }),
        [baseIndicatorStyles, masterIndicatorStyle]
      );


      const renderIndicatorContent = () => {
        if (masterRenderIndicator) {
          return masterRenderIndicator({
            indicator: masterIndicator ?? undefined,
            state,
            opacity: indicatorOpacity,
            height: pullDistance,
            progress: pullProgress,
          });
        }

        return (
          <div className={masterIndicatorClassName} style={indicatorStyles}>
            {masterIndicator}
          </div>
        );
      };

      const childrenWrapperStyles: CSSProperties = useMemo(
        () => ({
          transform: childrenTransform,
          transition:
            state === "idle" || state === "complete"
              ? `transform ${TRANSITION_DURATION} ease`
              : "none",
        }),
        [childrenTransform, state]
      );

      // ARIA attributes for accessibility
      const ariaLabel = useMemo(() => {
        if (masterAccessibility?.ariaLabel) {
          if (typeof masterAccessibility.ariaLabel === 'function') {
            return masterAccessibility.ariaLabel(state);
          }
          return masterAccessibility.ariaLabel;
        }
       
      }, [state, masterAccessibility]);

      const ariaLive = useMemo(() => {
        if (masterAccessibility?.ariaLive) {
          if (typeof masterAccessibility.ariaLive === 'function') {
            return masterAccessibility.ariaLive(state);
          }
          return masterAccessibility.ariaLive;
        }
        // Default: polite when refreshing/complete/error, off otherwise
        return state === "refreshing" || state === "complete" || state === "error" ? "polite" : "off";
      }, [state, masterAccessibility]);

      const ariaBusy = useMemo(() => {
        if (masterAccessibility?.ariaBusy !== undefined) {
          if (typeof masterAccessibility.ariaBusy === 'function') {
            return masterAccessibility.ariaBusy(state);
          }
          return masterAccessibility.ariaBusy;
        }
        // Default: true when refreshing
        return state === "refreshing";
      }, [state, masterAccessibility]);

      const role = masterAccessibility?.role ?? "region";

      return (
        <div
          ref={handleRef}
          className={masterClassName}
          style={containerStyles}
          role={role}
          aria-label={ariaLabel}
          aria-live={ariaLive}
          aria-busy={ariaBusy}
        >
          {renderIndicatorContent()}
          <div style={childrenWrapperStyles}>
            {children}
          </div>
        </div>
      );
    }
  )
);

PullToRefresh.displayName = "PullToRefresh";
