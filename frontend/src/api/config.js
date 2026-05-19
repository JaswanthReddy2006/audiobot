// API Configuration
// During local development, you can create a 'frontend/.env.local' file and specify:
// VITE_API_URL=http://<YOUR-EC2-PUBLIC-IP>:5000
// If VITE_API_URL is empty or not provided, relative paths will be used (ideal for production where Express serves the frontend).
const VITE_API_URL = import.meta.env.VITE_API_URL || "";

export function getApiUrl(path) {
  const base = VITE_API_URL.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
