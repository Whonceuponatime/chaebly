import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const testOpenAI = async () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      temperature: 0.7,
      max_tokens: 100
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error:', errorData);
  } else {
    const data = await response.json();
    console.log('Response:', data.choices[0].message.content);
  }
};

testOpenAI();