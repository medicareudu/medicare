import axios from 'axios';

async function check() {
  try {
    const { data: html } = await axios.get('https://medicareudu.netlify.app/');
    
    // Find the JS script tag
    const scriptMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (!scriptMatch) {
      console.log('No JS bundle found in HTML');
      return;
    }
    
    const jsUrl = 'https://medicareudu.netlify.app' + scriptMatch[1];
    console.log('Fetching JS bundle:', jsUrl);
    
    const { data: js } = await axios.get(jsUrl);
    
    if (js.includes('https://medicare-production-ff91.up.railway.app/api')) {
      console.log('SUCCESS: API URL is perfectly baked into the frontend bundle!');
    } else {
      console.log('ERROR: API URL is completely MISSING from the frontend bundle!');
      // Check if it's using the default '/api'
      if (js.includes('"/api"')) {
        console.log('It is falling back to "/api"');
      }
    }
  } catch (err) {
    console.error('Failed to fetch:', err.message);
  }
}
check();
