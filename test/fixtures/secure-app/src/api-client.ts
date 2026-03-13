// Proper tenant and user scope
async function fetchData() {
  const res = await flowstackFetch('/api/data', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-User-ID': userId,
    },
  });
  return res.json();
}

export { fetchData };
