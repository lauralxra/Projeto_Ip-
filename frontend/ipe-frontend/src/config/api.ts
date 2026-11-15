const envApiUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (envApiUrl || 'http://localhost:3000/api').replace(
  /\/+$/,
  '',
);
