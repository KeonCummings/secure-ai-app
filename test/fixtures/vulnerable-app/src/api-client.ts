// Missing tenant and user scope
async function fetchData() {
  const res = await flowstackFetch('/api/data', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

// Console logging credentials
function debugAuth(token: string) {
  console.log('Auth token:', token);
  console.log('Password:', process.env.PASSWORD);
}

export { fetchData, debugAuth };
