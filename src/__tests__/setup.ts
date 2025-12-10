import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Touch and TouchEvent for jsdom
class Touch {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;

  constructor(touchInitDict: {
    identifier: number;
    target: EventTarget;
    clientX?: number;
    clientY?: number;
    pageX?: number;
    pageY?: number;
    screenX?: number;
    screenY?: number;
    radiusX?: number;
    radiusY?: number;
    rotationAngle?: number;
    force?: number;
  }) {
    this.identifier = touchInitDict.identifier;
    this.target = touchInitDict.target;
    this.clientX = touchInitDict.clientX ?? 0;
    this.clientY = touchInitDict.clientY ?? 0;
    this.pageX = touchInitDict.pageX ?? 0;
    this.pageY = touchInitDict.pageY ?? 0;
    this.screenX = touchInitDict.screenX ?? 0;
    this.screenY = touchInitDict.screenY ?? 0;
    this.radiusX = touchInitDict.radiusX ?? 0;
    this.radiusY = touchInitDict.radiusY ?? 0;
    this.rotationAngle = touchInitDict.rotationAngle ?? 0;
    this.force = touchInitDict.force ?? 0;
  }
}

(global as any).Touch = Touch;

