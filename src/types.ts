import { ReactNode, CSSProperties } from "react";

/**
 * Accessibility configuration for the pull-to-refresh component
 */
export interface AccessibilityConfig {
  /** 
   * ARIA role for the container element
   * Default: "region"
   */
  role?: string;
  
  /** 
   * ARIA label. Can be a string or a function that receives the current state and returns a string
   * Default: Dynamic based on state
   */
  ariaLabel?: string | ((state: PullToRefreshState) => string);
  
  /** 
   * ARIA live region setting. Can be "polite" | "off" | "assertive" or a function that receives the state
   * Default: "polite" when refreshing/complete/error, "off" otherwise
   */
  ariaLive?: "polite" | "off" | "assertive" | ((state: PullToRefreshState) => "polite" | "off" | "assertive");
  
  /** 
   * ARIA busy attribute. Can be a boolean or a function that receives the state and returns a boolean
   * Default: true when refreshing, false otherwise
   */
  ariaBusy?: boolean | ((state: PullToRefreshState) => boolean);
}

/**
 * Configuration for haptic feedback behavior
 */
export interface HapticFeedbackConfig {
  /** 
   * Enable haptic feedback
   * Default: true
   */
  enabled?: boolean;
  
  /** 
   * Intensity for light haptic feedback (when user starts pulling)
   * For Android: vibration duration in milliseconds (0-1000)
   * For iOS: 'light' | 'medium' | 'heavy'
   * Default: 'light' for iOS, 10ms for Android
   */
  light?: 'light' | 'medium' | 'heavy' | number;
  
  /** 
   * Intensity for medium haptic feedback (when reaching canRelease state)
   * For Android: vibration duration in milliseconds (0-1000)
   * For iOS: 'light' | 'medium' | 'heavy'
   * Default: 'medium' for iOS, 20ms for Android
   */
  medium?: 'light' | 'medium' | 'heavy' | number;
  
  /** 
   * Intensity for heavy haptic feedback (when refresh is triggered)
   * For Android: vibration duration in milliseconds (0-1000)
   * For iOS: 'light' | 'medium' | 'heavy'
   * Default: 'heavy' for iOS, 30ms for Android
   */
  heavy?: 'light' | 'medium' | 'heavy' | number;
}

/**
 * The state of the pull-to-refresh component during user interaction
 */
export type PullToRefreshState =
  | "idle" // Initial state, no interaction
  | "pulling" // User is pulling down but hasn't reached the release threshold
  | "canRelease" // User has pulled enough to trigger refresh on release
  | "refreshing" // Refresh action is in progress
  | "complete" // Refresh has completed
  | "error"; // An error occurred during refresh

/**
 * Configuration options for pull-to-refresh behavior and appearance
 */
export interface PullToRefreshConfig {
  /** 
   * The distance in pixels the user needs to pull down to trigger a refresh.
   * Default: 80
   */
  threshold?: number;
  
  /** 
   * A ratio (0-1) of the threshold that determines when the user can release to trigger refresh.
   * For example, 0.8 means the user needs to pull 80% of the threshold distance.
   * Default: 0.8
   */
  canReleaseThreshold?: number;
  
  
  /** 
   * Custom indicator component to display during pull-to-refresh.
   * This is required and must be provided either via prop or PullToRefreshProvider.
   */
  indicator?: ReactNode;
  
  /** 
   * Duration in milliseconds to show the "complete" state before resetting to idle.
   * Default: 1000
   */
  completeDuration?: number;
  
  /** 
   * Resistance factor (0-1) applied when pulling beyond the threshold.
   * Lower values create more resistance (harder to pull further).
   * Default: 0.5
   */
  resistance?: number;
  
  /** 
   * CSS class name applied to the main container element
   */
  className?: string;
  
  /** 
   * Inline styles applied to the main container element
   */
  style?: CSSProperties;
  
  /** 
   * CSS class name applied to the indicator element
   */
  indicatorClassName?: string;
  
  /** 
   * Inline styles applied to the indicator element
   */
  indicatorStyle?: CSSProperties;
  
  /** 
   * Custom render function for the indicator.
   * Allows full control over how the indicator and message are displayed.
   * @param props - Object containing indicator, message, state, opacity, height, and progress
   * @returns ReactNode to render as the indicator
   */
  renderIndicator?: (props: {
    /** The indicator component (undefined if not provided) */
    indicator: ReactNode | undefined;
    /** The current state of the pull-to-refresh */
    state: PullToRefreshState;
    /** Opacity value (0-1) for fade animations */
    opacity: number;
    /** Current pull distance in pixels */
    height: number;
    /** Progress value (0-1) based on pull distance relative to threshold */
    progress: number;
  }) => ReactNode;

  /** 
   * Callback fired when the component state changes
   */
  onStateChange?: (state: PullToRefreshState) => void;

  /** 
   * Callback fired when the user starts pulling
   */
  onPullStart?: () => void;

  /** 
   * Callback fired when the user ends pulling (releases)
   */
  onPullEnd?: () => void;

  /** 
   * Callback fired when an error occurs during refresh
   */
  onError?: (error: Error) => void;

  /** 
   * Enable haptic feedback on supported devices (iOS, Android)
   * Default: false
   */
  hapticFeedback?: HapticFeedbackConfig;
  
  /** 
   * Accessibility configuration for ARIA attributes
   */
  accessibility?: AccessibilityConfig;
}

/**
 * Props for the PullToRefresh component
 */
export interface PullToRefreshProps extends PullToRefreshConfig {
  /** 
   * Callback function called when the user triggers a refresh.
   * Can return a Promise for async operations.
   */
  onRefresh: () => Promise<void> | void;
  
  /** 
   * The content to be wrapped by the pull-to-refresh component
   */
  children: ReactNode;
  
  /** 
   * Optional ref to a scrollable container element.
   * If not provided, the component will automatically detect the scrollable parent.
   */
  containerRef?: React.RefObject<HTMLElement>;
  
  /** 
   * Disables the pull-to-refresh functionality when true
   */
  disabled?: boolean;

}

/**
 * Ref handle methods for programmatically controlling the pull-to-refresh component
 */
export interface PullToRefreshHandle {
  /** 
   * Programmatically triggers a refresh action
   */
  refresh: () => void;
  
  /** 
   * Resets the component to the idle state
   */
  reset: () => void;
}
