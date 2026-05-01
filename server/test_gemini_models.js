const fetch = require('node-fetch'); // Ensure node-fetch or native fetch is available. Node 18+ has native fetch.

async function loadModels() {
  const API_KEY = 'AIzaSyBR4k6hFxZ--4TOM-lYGMtYUmADmXme7Lw';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    if (data.models) {
      console.log('\n🌟 --- AVAILABLE GEMINI AI MODELS --- 🌟');
      data.models.forEach((m) => {
        if (m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`✅ ${m.name}`);
        }
      });
      console.log('------------------------------------------\n');
    } else {
      console.log("No models returned or API key invalid.", data);
    }
  } catch (error) {
    console.log('Error fetching models:', error);
  }
}

loadModels();
