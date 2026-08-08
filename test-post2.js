import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://medicare-production-ff91.up.railway.app/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const cookie = res.headers['set-cookie'];
    
    const postRes = await axios.post('https://medicare-production-ff91.up.railway.app/api/prescriptions/direct-purchase', {
      patientName: "John",
      patientNo: "0771234567",
      medicines: [{ medicineId: "MED-001", name: "MED-001", qty: 1, price: 13, unit: "tablets" }],
      totalAmount: 13,
      discount: 0
    }, {
      headers: { Cookie: cookie }
    });
    console.log(postRes.data);
  } catch (err) {
    if (err.response) {
      console.error(err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}
test();
