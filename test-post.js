import axios from 'axios';

async function test() {
  try {
    const res = await axios.post('https://medicare-production-ff91.up.railway.app/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    const cookie = res.headers['set-cookie'];
    
    const postRes = await axios.post('https://medicare-production-ff91.up.railway.app/api/prescriptions', {
      patientName: "John",
      patientNo: "P123",
      doctor: "Dr Smith",
      date: "2026-08-01",
      medicines: [{ medicineId: "MED-001", name: "MED-001", qty: 1, price: 13, unit: "tablets" }],
      consultationFee: 100,
      additionalCharges: [],
      totalAmount: 113,
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
