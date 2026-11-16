// Access token хранится только в памяти страницы, refresh token — в HttpOnly-cookie
let accessToken = null;
let refreshing = null;

async function request(path, body, method) {
  const isBlob = body instanceof Blob;
  const headers = {};
  if (body) headers['Content-Type'] = isBlob ? body.type : 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`/api/admin${path}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers,
    body: body ? (isBlob ? body : JSON.stringify(body)) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

export function setAccessToken(token) {
  accessToken = token;
}

export function refresh() {
  refreshing ||= request('/refresh', {})
    .then((res) => {
      accessToken = res.ok ? res.data.accessToken : null;
      return res;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// Если access token истёк, получаем новый по refresh token и повторяем запрос
export async function api(path, body, method) {
  const res = await request(path, body, method);
  if (res.status !== 401 || ['/login', '/refresh', '/logout'].includes(path)) return res;
  const renewed = await refresh();
  return renewed.ok ? request(path, body, method) : res;
}
