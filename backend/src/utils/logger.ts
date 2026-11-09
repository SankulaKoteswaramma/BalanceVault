export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, ...meta }));
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const errorDetails = error instanceof Error 
      ? { errorMessage: error.message, stack: error.stack }
      : { rawError: error };
    console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message, ...errorDetails, ...meta }));
  },
};
