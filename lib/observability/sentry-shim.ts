export interface CaptureContext {
  level?: string;
  contexts?: Record<string, any>;
  extra?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface Breadcrumb {
  category?: string;
  message?: string;
  level?: string;
  data?: Record<string, any>;
}

export const SentryShim = {
  init: (_config?: Record<string, unknown>) => {},
  captureException: (_error: unknown, _context?: CaptureContext) => {},
  addBreadcrumb: (_breadcrumb: Breadcrumb) => {},
  replayIntegration: (_options?: Record<string, unknown>) => ({}) as any,
};

export default SentryShim;
