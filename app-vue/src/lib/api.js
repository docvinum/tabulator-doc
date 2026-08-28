export async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

export function distinctFromList(list, field) {
  return [...new Set(list.map((r) => r[field]))].sort();
}

export async function distinctFromApi(baseUrl, field) {
  try {
    return await fetchJSON(`${baseUrl}/distinct/${field}`);
  } catch (e) {
    console.warn("distinct fetch failed", field, e);
    return [];
  }
}
