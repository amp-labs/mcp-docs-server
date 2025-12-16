/**
 * Logger utility that writes to stderr to avoid interfering with stdio transport
 */
class Logger {
  private write(level: string, ...args: unknown[]): void {
    const timestamp = new Date().toISOString();
    const message = args
      .map((arg) =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
      )
      .join(' ');
    process.stderr.write(`[${timestamp}] [${level}] ${message}\n`);
  }

  log(...args: unknown[]): void {
    this.write('INFO', ...args);
  }

  info(...args: unknown[]): void {
    this.write('INFO', ...args);
  }

  error(...args: unknown[]): void {
    this.write('ERROR', ...args);
  }

  warn(...args: unknown[]): void {
    this.write('WARN', ...args);
  }

  debug(...args: unknown[]): void {
    this.write('DEBUG', ...args);
  }
}

export const logger = new Logger();
