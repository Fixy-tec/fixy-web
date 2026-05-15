export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function isHttpError(error: unknown, status?: number): error is HttpError {
  if (!(error instanceof HttpError)) return false;
  if (status == null) return true;
  return error.status === status;
}
