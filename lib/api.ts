export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl().replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};
