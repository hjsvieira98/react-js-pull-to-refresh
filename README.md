# react-easy-pull-refresh

![npm version](https://img.shields.io/npm/v/react-easy-pull-refresh)
![npm downloads](https://img.shields.io/npm/dm/react-easy-pull-refresh)
![License](https://img.shields.io/npm/l/react-easy-pull-refresh)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)

A lightweight, customizable pull-to-refresh component for React with TypeScript support. Works seamlessly with touch and mouse events, supports any scrollable container, and is optimized for performance.

## ✨ Features

- 🎯 **TypeScript Support** - Full TypeScript support with exported types
- 📱 **Touch & Mouse** - Works with both touch events and mouse drag
- 🎨 **Customizable** - Extensive customization options via props
- 🌐 **Global Configuration** - Use `PullToRefreshProvider` for global defaults
- ⚡ **Performance Optimized** - Uses React.memo and optimized event handling
- 📦 **Container Agnostic** - Works with any scrollable container, not just window
- 🎭 **Visual States** - Clear visual feedback for pulling, refreshing, complete, and error states
- 🎪 **Custom Indicator** - Use your own indicator component
- 🚫 **Non-Intrusive** - Doesn't interfere with normal scroll behavior
- ✅ **Tested** - Comprehensive test suite with Jest and React Testing Library
- ♿ **Accessible** - Fully configurable ARIA attributes via props
- 📳 **Haptic Feedback** - Optional haptic feedback on supported devices
- 🔔 **Event Callbacks** - onStateChange, onPullStart, onPullEnd, onError
- 🛡️ **Error Handling** - Built-in error state and error callback
- 🎮 **Imperative Handle** - Programmatic control via ref

## 📦 Installation

```bash
npm install react-easy-pull-refresh
```

or

```bash
yarn add react-easy-pull-refresh
```

or

```bash
pnpm add react-easy-pull-refresh
```

## 🚀 Quick Start

### Basic Usage

```tsx
import React, { useState } from 'react';
import { PullToRefresh } from 'react-easy-pull-refresh';

function App() {
  const [data, setData] = useState(['Item 1', 'Item 2', 'Item 3']);

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setData(['New Item 1', 'New Item 2', 'New Item 3']);
  };

  const indicator = <div>Loading...</div>;

  return (
    <PullToRefresh onRefresh={handleRefresh} indicator={indicator}>
      <div>
        {data.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </PullToRefresh>
  );
}
```

### Using Provider (Recommended)

```tsx
import React, { useState } from 'react';
import { PullToRefreshProvider, PullToRefresh } from 'react-easy-pull-refresh';

function App() {
  const [data, setData] = useState(['Item 1', 'Item 2', 'Item 3']);

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    setData(['New Item 1', 'New Item 2', 'New Item 3']);
  };

  const indicator = <div>Loading...</div>;

  return (
    <PullToRefreshProvider
      config={{
        indicator,
        threshold: 80,
      }}
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <div>
          {data.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
        </div>
      </PullToRefresh>
    </PullToRefreshProvider>
  );
}
```

## 📖 Examples

### Complete Example with All Features

This example demonstrates all major features including custom render indicator, event callbacks, haptic feedback, accessibility, error handling, and imperative API.

```tsx
import React, { useState, useRef } from 'react';
import { PullToRefresh, PullToRefreshProvider, PullToRefreshHandle } from 'react-easy-pull-refresh';

const MySpinner = () => (
  <div className="spinner">⏳</div>
);

function App() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const newData = await response.json();
      setData(newData);
    } catch (error) {
      console.error('Error:', error);
      throw error; // Component will handle error state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PullToRefreshProvider
      config={{
        indicator: <MySpinner />,
        threshold: 80,
        hapticFeedback: { enabled: true },
        accessibility: {
          role: "region",
          ariaLabel: (state) => {
            switch (state) {
              case "refreshing": return "Refreshing content";
              case "complete": return "Refresh completed";
              case "error": return "Error refreshing";
              default: return "Pull to refresh";
            }
          },
          ariaLive: (state) => {
            return state === "refreshing" || state === "complete" || state === "error" 
              ? "polite" 
              : "off";
          },
          ariaBusy: (state) => state === "refreshing"
        }
      }}
    >
      <PullToRefresh
        ref={pullToRefreshRef}
        onRefresh={handleRefresh}
        disabled={isLoading}
        onStateChange={(state) => {
          console.log('State changed to:', state);
          // Track analytics, update UI, etc.
        }}
        onPullStart={() => {
          console.log('User started pulling');
        }}
        onPullEnd={() => {
          console.log('User ended pulling');
        }}
        onError={(error) => {
          console.error('Refresh error:', error);
          // Show error toast, log to service, etc.
        }}
        renderIndicator={({ indicator, state, opacity, progress, height }) => {
          const getStateColor = () => {
            switch (state) {
              case 'pulling': return '#666';
              case 'canRelease': return '#4CAF50';
              case 'refreshing': return '#2196F3';
              case 'complete': return '#4CAF50';
              case 'error': return '#F44336';
              default: return '#666';
            }
          };

          return (
            <div
              style={{
                opacity,
                width: '100%',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: getStateColor()
              }}
            >
              {/* Progress Bar */}
              <div
                style={{
                  width: '200px',
                  height: '4px',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${progress * 100}%`,
                    height: '100%',
                    backgroundColor: getStateColor(),
                    transition: 'width 0.1s ease'
                  }}
                />
              </div>

              {/* Indicator with state-based styling */}
              <div
                style={{
                  transform: `scale(${Math.min(progress * 1.2, 1)})`,
                  transition: state === 'idle' ? 'all 0.3s ease' : 'none'
                }}
              >
                {indicator}
              </div>

              {/* State messages */}
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: state === 'canRelease' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }}
              >
                {state === 'pulling' && `Pull more ${Math.round((1 - progress) * 100)}%`}
                {state === 'canRelease' && '✓ Release to refresh'}
                {state === 'refreshing' && 'Refreshing...'}
                {state === 'complete' && '✓ Complete!'}
                {state === 'error' && '✗ Error refreshing'}
              </div>

              {/* Height indicator (optional) */}
              {state === 'pulling' && (
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {height.toFixed(0)}px
                </div>
              )}
            </div>
          );
        }}
      >
        <div>
          {data.map((item, index) => (
            <div key={index}>{item.name}</div>
          ))}
        </div>
      </PullToRefresh>
    </PullToRefreshProvider>
  );
}
```

### Custom Container

Use a custom scrollable container instead of the default window scroll:

```tsx
import { useRef } from 'react';

const containerRef = useRef<HTMLDivElement>(null);

<div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
  <PullToRefresh
    onRefresh={handleRefresh}
    indicator={<MyIndicator />}
    containerRef={containerRef}
  >
    <YourContent />
  </PullToRefresh>
</div>
```

### Custom Configuration

Configure threshold, resistance, and release threshold:

```tsx
<PullToRefresh
  onRefresh={handleRefresh}
  indicator={<MyIndicator />}
  threshold={100}              // Distance in pixels to trigger refresh
  resistance={0.3}             // Resistance factor (0-1) when pulling beyond threshold
  canReleaseThreshold={0.7}    // Progress (0-1) to show "can release" state
  completeDuration={1500}       // Duration to show complete state (ms)
>
  <YourContent />
</PullToRefresh>
```

### Using PullToRefreshHandle (Imperative API)

Programmatically control the component:

```tsx
import { useRef } from 'react';
import { PullToRefresh, PullToRefreshHandle } from 'react-easy-pull-refresh';

function MyComponent() {
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

  const handleButtonRefresh = () => {
    // Programmatically trigger refresh
    pullToRefreshRef.current?.refresh();
  };

  const handleReset = () => {
    // Reset component to idle state
    pullToRefreshRef.current?.reset();
  };

  return (
    <>
      <button onClick={handleButtonRefresh}>Refresh</button>
      <button onClick={handleReset}>Reset</button>
      <PullToRefresh
        ref={pullToRefreshRef}
        onRefresh={handleRefresh}
        indicator={<MyIndicator />}
      >
        <YourContent />
      </PullToRefresh>
    </>
  );
}
```

### Haptic Feedback Configuration

Configure haptic feedback for iOS and Android devices:

```tsx
<PullToRefresh
  onRefresh={handleRefresh}
  indicator={<MyIndicator />}
  hapticFeedback={{
    enabled: true,
    // iOS: 'light' | 'medium' | 'heavy'
    // Android: number (vibration duration in milliseconds)
    light: 'light',      // Default: 'light' for iOS, 15ms for Android
    medium: 'medium',    // Default: 'medium' for iOS, 20ms for Android
    heavy: 'heavy'       // Default: 'heavy' for iOS, 30ms for Android
  }}
>
  <YourContent />
</PullToRefresh>

// Android custom vibration duration
<PullToRefresh
  onRefresh={handleRefresh}
  indicator={<MyIndicator />}
  hapticFeedback={{
    enabled: true,
    light: 15,    // 15ms vibration
    medium: 25,  // 25ms vibration
    heavy: 50    // 50ms vibration
  }}
>
  <YourContent />
</PullToRefresh>
```

### Accessibility Configuration

Configure ARIA attributes for screen readers:

```tsx
<PullToRefresh
  onRefresh={handleRefresh}
  indicator={<MyIndicator />}
  accessibility={{
    role: "region",
    // Function that receives state and returns label
    ariaLabel: (state) => {
      switch (state) {
        case "refreshing": return "Refreshing content";
        case "complete": return "Refresh completed";
        case "error": return "Error refreshing";
        default: return "Pull to refresh";
      }
    },
    // Function that receives state and returns aria-live value
    ariaLive: (state) => {
      return state === "refreshing" || state === "complete" || state === "error" 
        ? "polite" 
        : "off";
    },
    // Function that receives state and returns boolean
    ariaBusy: (state) => state === "refreshing"
  }}
>
  <YourContent />
</PullToRefresh>

// Or use simple string/boolean values
<PullToRefresh
  onRefresh={handleRefresh}
  indicator={<MyIndicator />}
  accessibility={{
    role: "button",
    ariaLabel: "Refresh list",
    ariaLive: "polite",
    ariaBusy: false
  }}
>
  <YourContent />
</PullToRefresh>
```

### With React Query

Integrate with React Query for data fetching:

```tsx
import { useQueryClient } from 'react-query';
import { PullToRefreshProvider, PullToRefresh } from 'react-easy-pull-refresh';

function QueryExample() {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    await queryClient.invalidateQueries('myData');
  };

  const indicator = <div>Loading...</div>;

  return (
    <PullToRefreshProvider config={{ indicator }}>
      <PullToRefresh onRefresh={handleRefresh}>
        <YourContent />
      </PullToRefresh>
    </PullToRefreshProvider>
  );
}
```

### Creating a Reusable Indicator Component

Create a custom indicator component:

```tsx
// Indicator.tsx
import React from 'react';

interface IndicatorProps {
  size?: number;
  color?: string;
}

export const Indicator: React.FC<IndicatorProps> = ({ size = 24, color = '#007AFF' }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}33`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Usage
import { Indicator } from './Indicator';
import { PullToRefreshProvider, PullToRefresh } from 'react-easy-pull-refresh';

function App() {
  return (
    <PullToRefreshProvider
      config={{
        indicator: <Indicator size={32} color="#FF6B6B" />
      }}
    >
      <PullToRefresh onRefresh={handleRefresh}>
        <YourContent />
      </PullToRefresh>
    </PullToRefreshProvider>
  );
}
```

## 📚 API Reference

### PullToRefreshProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `PullToRefreshConfig` | `{}` | Global configuration for all child PullToRefresh components |
| `children` | `ReactNode` | **required** | Child components |

### PullToRefreshConfig

```tsx
{
  threshold?: number;
  canReleaseThreshold?: number;
  indicator?: ReactNode;
  completeDuration?: number;
  resistance?: number;
  className?: string;
  style?: CSSProperties;
  indicatorClassName?: string;
  indicatorStyle?: CSSProperties;
  onStateChange?: (state: PullToRefreshState) => void;
  onPullStart?: () => void;
  onPullEnd?: () => void;
  onError?: (error: Error) => void;
  hapticFeedback?: HapticFeedbackConfig;
  accessibility?: AccessibilityConfig;
  renderIndicator?: (props: {
    indicator: ReactNode | undefined;
    state: PullToRefreshState;
    opacity: number;
    height: number;
    progress: number;
  }) => ReactNode;
}
```

### PullToRefresh Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onRefresh` | `() => Promise<void> \| void` | **required** | Callback function called when pull-to-refresh is triggered |
| `children` | `ReactNode` | **required** | Content to be rendered inside the component |
| `indicator` | `ReactNode` | **required*** | Custom indicator component. *Required if not provided via Provider |
| `threshold` | `number` | `80` (or from Provider) | Distance in pixels that must be pulled before refresh is triggered |
| `containerRef` | `RefObject<HTMLElement>` | `undefined` | Custom container element. If not provided, uses the component's parent |
| `disabled` | `boolean` | `false` | Disable pull-to-refresh functionality |
| `canReleaseThreshold` | `number` | `0.8` (or from Provider) | Custom pull distance (0-1) to show can release state |
| `completeDuration` | `number` | `1000` (or from Provider) | Duration in milliseconds to show complete state before hiding |
| `className` | `string` | `undefined` (or from Provider) | Custom class name for the container |
| `style` | `CSSProperties` | `undefined` (or from Provider) | Custom styles for the container |
| `indicatorClassName` | `string` | `undefined` (or from Provider) | Custom class name for the pull indicator |
| `indicatorStyle` | `CSSProperties` | `undefined` (or from Provider) | Custom styles for the pull indicator |
| `resistance` | `number` | `0.5` (or from Provider) | Resistance factor when pulling beyond threshold |
| `onStateChange` | `(state: PullToRefreshState) => void` | `undefined` | Callback fired when component state changes |
| `onPullStart` | `() => void` | `undefined` | Callback fired when user starts pulling |
| `onPullEnd` | `() => void` | `undefined` | Callback fired when user ends pulling (releases) |
| `onError` | `(error: Error) => void` | `undefined` | Callback fired when an error occurs during refresh |
| `hapticFeedback` | `HapticFeedbackConfig` | `{enabled: true}` | Haptic feedback configuration for supported devices |
| `accessibility` | `AccessibilityConfig` | `undefined` | Accessibility configuration for ARIA attributes |
| `renderIndicator` | `(props) => ReactNode` | `undefined` | Custom render function for complete control over indicator rendering |

**Note:** Props passed directly to `PullToRefresh` will override values from `PullToRefreshProvider`.

### renderIndicator Function

The `renderIndicator` prop receives an object with the following properties:

```tsx
renderIndicator?: (props: {
  indicator: ReactNode | undefined;  // The indicator component (if provided)
  state: PullToRefreshState;         // Current state: 'idle' | 'pulling' | 'canRelease' | 'refreshing' | 'complete' | 'error'
  opacity: number;                   // Opacity value (0-1) for fade animations
  height: number;                    // Current pull distance in pixels
  progress: number;                  // Progress value (0-1) based on pull distance relative to threshold
}) => ReactNode;
```

### Types

```tsx
import type {
  PullToRefreshProps,
  PullToRefreshState,
  PullToRefreshHandle,
  PullToRefreshConfig,
  PullToRefreshProviderProps,
  AccessibilityConfig,
  HapticFeedbackConfig
} from 'react-easy-pull-refresh';

// PullToRefreshState: 'idle' | 'pulling' | 'canRelease' | 'refreshing' | 'complete' | 'error'

// AccessibilityConfig
interface AccessibilityConfig {
  role?: string;  // ARIA role (default: "region")
  ariaLabel?: string | ((state: PullToRefreshState) => string);  // ARIA label
  ariaLive?: "polite" | "off" | "assertive" | ((state: PullToRefreshState) => "polite" | "off" | "assertive");  // ARIA live
  ariaBusy?: boolean | ((state: PullToRefreshState) => boolean);  // ARIA busy
}

// HapticFeedbackConfig
interface HapticFeedbackConfig {
  enabled?: boolean;
  light?: 'light' | 'medium' | 'heavy' | number;  // iOS: 'light' | 'medium' | 'heavy', Android: number (ms)
  medium?: 'light' | 'medium' | 'heavy' | number;
  heavy?: 'light' | 'medium' | 'heavy' | number;
}
```

### PullToRefreshHandle

The component supports imperative handle for programmatic control:

```tsx
import { useRef } from 'react';
import { PullToRefresh, PullToRefreshHandle } from 'react-easy-pull-refresh';

function MyComponent() {
  const pullToRefreshRef = useRef<PullToRefreshHandle>(null);

  const handleManualRefresh = () => {
    pullToRefreshRef.current?.refresh();
  };

  const handleReset = () => {
    pullToRefreshRef.current?.reset();
  };

  return (
    <>
      <button onClick={handleManualRefresh}>Refresh</button>
      <button onClick={handleReset}>Reset</button>
      <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} indicator={<Indicator />}>
        <YourContent />
      </PullToRefresh>
    </>
  );
}
```

### Hooks

```tsx
import { usePullToRefreshContext } from 'react-easy-pull-refresh';

// Access the current PullToRefresh context (returns null if not inside a Provider)
const context = usePullToRefreshContext();
```

## 🎯 States

The component has six distinct states:

1. **idle** - Initial state, no interaction
2. **pulling** - User is pulling but hasn't reached the release threshold
3. **canRelease** - User has pulled enough to trigger refresh on release
4. **refreshing** - Refresh is in progress (onRefresh is executing)
5. **complete** - Refresh completed successfully
6. **error** - An error occurred during refresh

## 🎨 Styling

The component uses inline styles by default, but you can override them with custom classes and styles. The component structure is:

```html
<div className={className} style={style}>
  <div className={indicatorClassName} style={indicatorStyle}>
    <!-- Indicator -->
  </div>
  <div>
    <!-- Your content -->
  </div>
</div>
```

## ⚡ Performance

The component is optimized for performance:

- Uses `React.memo` to prevent unnecessary re-renders
- Optimized event handlers with `useCallback`
- Efficient state management
- Minimal DOM manipulation
- No external dependencies (except React)

## 🧪 Testing

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Roadmap

- [ ] Add support for horizontal pull-to-refresh
- [ ] Add more customization options

## 📄 Changelog

### 1.0.0

- Initial release
- Touch and mouse support
- Customizable indicator
- TypeScript support
- Comprehensive test suite
- ✨ `PullToRefreshProvider` for global configuration
- 🎮 Imperative handle API (`PullToRefreshHandle`)
- 🔔 Event callbacks (`onStateChange`, `onPullStart`, `onPullEnd`, `onError`)
- ♿ Fully configurable accessibility (ARIA attributes)
- 📳 Haptic feedback support (iOS and Android)
- 🛡️ Built-in error handling with error state
- 🎨 Custom `renderIndicator` function for complete control
- 📦 Container agnostic (works with any scrollable container)

## 🙏 Acknowledgments

Built with ❤️ using React and TypeScript.
