async function test() {
  const res = await fetch('http://localhost:4101/api/v1/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      storeId: 'f9411bc4-3868-450a-9957-226848fc7527', // fake store id
      name: 'Test Category',
      description: 'hi',
      displayOrder: 1,
      isActive: true
    })
  });
  
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
}

test();
