async function test() {
  const data = {
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    displayName: 'Test User'
  };

  try {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    console.log(`Status: ${res.status}`);
    console.log(await res.text());
  } catch (error) {
    console.error(error);
  }
}
test();
