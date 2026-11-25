import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Stub ResizeObserver for Recharts / Leaflet in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Stub scrollTo in jsdom
window.scrollTo = vi.fn();
