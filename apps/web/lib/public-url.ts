function firstHeaderValue(value: string | null): string {
  return value?.split(",")[0]?.trim() ?? "";
}

export function getPublicUrl(request: Request, path: string): string {
  const requestUrl = new URL(request.url);
  const proto = firstHeaderValue(request.headers.get("x-forwarded-proto"))
    || requestUrl.protocol.replace(":", "");
  const host = firstHeaderValue(request.headers.get("x-forwarded-host"))
    || firstHeaderValue(request.headers.get("host"))
    || requestUrl.host;

  return new URL(path, `${proto}://${host}`).toString();
}
