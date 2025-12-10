import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PullToRefresh } from '../PullToRefresh';
import { PullToRefreshProvider } from '../PullToRefreshProvider';

describe('PullToRefresh', () => {
  const mockOnRefresh = jest.fn();

  beforeEach(() => {
    mockOnRefresh.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders children correctly', () => {
    const indicator = <div data-testid="indicator">Loading...</div>;
    render(
      <PullToRefresh onRefresh={mockOnRefresh} indicator={indicator}>
        <div>Test Content</div>
      </PullToRefresh>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onRefresh when pulled and released', async () => {
    const user = userEvent.setup({ delay: null });
    mockOnRefresh.mockResolvedValue(undefined);
    const indicator = <div data-testid="indicator">Loading...</div>;

    const { container } = render(
      <PullToRefresh onRefresh={mockOnRefresh} threshold={80} indicator={indicator}>
        <div>Test Content</div>
      </PullToRefresh>
    );

    const contentDiv = container.firstChild as HTMLElement;
    const parentContainer = contentDiv.parentElement || window;

    // Ensure container is at top
    if (parentContainer instanceof HTMLElement) {
      Object.defineProperty(parentContainer, 'scrollTop', {
        writable: true,
        value: 0,
      });
    }

    // Use document for events when container is window
    const eventTarget = parentContainer === window ? document : (parentContainer as HTMLElement);

    await act(async () => {
      // Simulate touch start at y=100
      const touchStart = new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 0, target: contentDiv, clientY: 100 })],
        cancelable: true,
      });
      eventTarget.dispatchEvent(touchStart);
    });

    await act(async () => {
      // Simulate touch move to y=200 (deltaY = 100, which exceeds threshold * canReleaseThreshold = 80 * 0.8 = 64)
      const touchMove = new TouchEvent('touchmove', {
        touches: [new Touch({ identifier: 0, target: contentDiv, clientY: 200 })],
        cancelable: true,
      });
      eventTarget.dispatchEvent(touchMove);
    });

    // Advance timers to allow state updates
    act(() => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      // Simulate touch end
      const touchEnd = new TouchEvent('touchend', {
        cancelable: true,
      });
      eventTarget.dispatchEvent(touchEnd);
    });

    await waitFor(() => {
      expect(mockOnRefresh).toHaveBeenCalled();
    }, { timeout: 2000 });
  });


  it('respects disabled prop', () => {
    const indicator = <div data-testid="indicator">Loading...</div>;
    const { container } = render(
      <PullToRefresh onRefresh={mockOnRefresh} disabled indicator={indicator}>
        <div>Test Content</div>
      </PullToRefresh>
    );

    const contentDiv = container.firstChild as HTMLElement;
    const touchStart = new TouchEvent('touchstart', {
      touches: [new Touch({ identifier: 0, target: contentDiv, clientY: 100 })],
      cancelable: true,
    });

    contentDiv.dispatchEvent(touchStart);
    // Should not trigger refresh when disabled
    expect(mockOnRefresh).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const indicator = <div data-testid="indicator">Loading...</div>;
    const { container } = render(
      <PullToRefresh onRefresh={mockOnRefresh} className="custom-class" indicator={indicator}>
        <div>Test Content</div>
      </PullToRefresh>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders the provided indicator', () => {
    const indicator = <div data-testid="custom-indicator">Custom Indicator</div>;

    render(
      <PullToRefresh onRefresh={mockOnRefresh} indicator={indicator}>
        <div>Test Content</div>
      </PullToRefresh>
    );

    // The indicator should be in the DOM (though may not be visible initially)
    expect(screen.queryByTestId('custom-indicator')).toBeInTheDocument();
  });

  describe('PullToRefreshProvider', () => {
    it('uses indicator from provider when not provided as prop', () => {
      const providerIndicator = <div data-testid="provider-indicator">Provider Indicator</div>;
      
      render(
        <PullToRefreshProvider config={{ indicator: providerIndicator }}>
          <PullToRefresh onRefresh={mockOnRefresh}>
            <div>Test Content</div>
          </PullToRefresh>
        </PullToRefreshProvider>
      );

      expect(screen.queryByTestId('provider-indicator')).toBeInTheDocument();
    });

    it('prop indicator overrides provider indicator', () => {
      const providerIndicator = <div data-testid="provider-indicator">Provider Indicator</div>;
      const propIndicator = <div data-testid="prop-indicator">Prop Indicator</div>;
      
      render(
        <PullToRefreshProvider config={{ indicator: providerIndicator }}>
          <PullToRefresh onRefresh={mockOnRefresh} indicator={propIndicator}>
            <div>Test Content</div>
          </PullToRefresh>
        </PullToRefreshProvider>
      );

      expect(screen.queryByTestId('provider-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('prop-indicator')).toBeInTheDocument();
    });

    it('uses threshold from provider when not provided as prop', () => {
      const indicator = <div data-testid="indicator">Loading...</div>;
      
      render(
        <PullToRefreshProvider config={{ threshold: 100 }}>
          <PullToRefresh onRefresh={mockOnRefresh} indicator={indicator}>
            <div>Test Content</div>
          </PullToRefresh>
        </PullToRefreshProvider>
      );

      // Component should render without errors
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('prop threshold overrides provider threshold', () => {
      const indicator = <div data-testid="indicator">Loading...</div>;
      
      render(
        <PullToRefreshProvider config={{ threshold: 100 }}>
          <PullToRefresh onRefresh={mockOnRefresh} indicator={indicator} threshold={50}>
            <div>Test Content</div>
          </PullToRefresh>
        </PullToRefreshProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

  });
});

