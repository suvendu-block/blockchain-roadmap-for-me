async function request(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  config: () => request("/api/config"),
  health: () => request("/api/health"),
  stats: () => request("/api/stats"),
  tips: (limit = 30) => request(`/api/tips?limit=${limit}`),
  postTip: (body) =>
    request("/api/tips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
};
