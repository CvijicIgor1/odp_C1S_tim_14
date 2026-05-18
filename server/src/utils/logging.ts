export type LogError = Error | string | number | boolean | null;

export const toLogError = (err: Error | string | number | boolean | object | null): LogError => {
  if (err === null) return null;
  if (err instanceof Error) return err;
  return String(err);
};
