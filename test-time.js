const rawNow = new Date();
const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });
const parts = formatter.formatToParts(rawNow);
const hour = parts.find(p => p.type === 'hour')?.value;
const min = parts.find(p => p.type === 'minute')?.value;
const hhmm = `${hour}:${min}`;
console.log(hhmm);
console.log(hhmm.replace(/^24:/, "00:"));
