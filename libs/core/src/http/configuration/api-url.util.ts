export function joinApiUrl(baseUrl: string, endpoint: string): string {
  const normalizedEndpoint = endpoint.trim();

  if (normalizedEndpoint.length === 0) {
    throw new Error('API endpoint must not be empty.');
  }

  const cleanBaseUrl = baseUrl.trim().replace(/\/+$/, '');
  const cleanEndpoint = normalizedEndpoint.replace(/^\/+/, '');

  if (cleanBaseUrl.length === 0) {
    return `/${cleanEndpoint}`;
  }

  return `${cleanBaseUrl}/${cleanEndpoint}`;
}
