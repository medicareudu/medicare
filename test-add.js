import axios from 'axios';

async function run() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const token = loginRes.data.accessToken;

    const payload = {
      id: `MED-1234`,
      name: 'Amoxicillin 500mg (Auto)',
      category: 'Antibiotic',
      qty: 200,
      expiry: '2027-12-31',
      supplier: 'PharmaCo',
      price: 100,
      minThreshold: 50,
    };

    const addRes = await axios.post('http://localhost:5000/api/medicines', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', addRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Error Response:', err.response.data);
    } else {
      console.error('Error:', err.message);
    }
  }
}

run();
