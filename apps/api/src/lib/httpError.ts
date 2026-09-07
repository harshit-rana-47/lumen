export function httpError(status: number, message: string): Error {
  return Object.assign(new Error(message), { status });
}
