export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  static info(message: string, meta?: any) {
    console.log(`[${new Date().toISOString()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static warn(message: string, meta?: any) {
    console.warn(`[${new Date().toISOString()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static error(message: string, error?: any) {
    console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, error ?? '');
  }
}
