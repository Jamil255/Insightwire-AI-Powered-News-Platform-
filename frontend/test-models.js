
const key = 'AIzaSyAXlynygSmzTgvFllJuVRx98XuGmeGm640';
const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + key;
fetch(url).then(r => r.json()).then(d => console.log(d.models.map(m=>m.name).join('\n'))).catch(console.error);

