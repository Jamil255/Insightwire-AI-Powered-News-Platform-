
const key = 'AIzaSyAXlynygSmzTgvFllJuVRx98XuGmeGm640';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + key;
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] })
}).then(r => r.json().then(j => ({status: r.status, data: j}))).then(console.log).catch(console.error);

