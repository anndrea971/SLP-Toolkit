// ==========================================
// 1. UTILITY MODULE: Clinical Timer
// ==========================================
let timerInterval;
let seconds = 0;
let isRunning = false;

const timerDisplay = document.getElementById('timer-display');

function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

document.getElementById('start-timer').addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(() => {
            seconds++;
            timerDisplay.innerText = formatTime(seconds);
        }, 1000);
    }
});

document.getElementById('pause-timer').addEventListener('click', () => {
    isRunning = false;
    clearInterval(timerInterval);
});

document.getElementById('reset-timer').addEventListener('click', () => {
    isRunning = false;
    clearInterval(timerInterval);
    seconds = 0;
    timerDisplay.innerText = "00:00";
});

// ==========================================
// 2. UTILITY MODULE: Decibel Meter Logic
// ==========================================
let audioContext;
let analyser;
let microphone;
const needle = document.getElementById('meter-needle');
const dbLevelDisplay = document.getElementById('db-level');
const dbStatus = document.getElementById('db-status');

document.getElementById('start-mic').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;

document.getElementById('start-mic').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function updateMeter() {
            requestAnimationFrame(updateMeter);
            analyser.getByteFrequencyData(dataArray);
            
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            let average = sum / bufferLength;
            
    let degrees = (average * 1.8) - 90; 
            if (degrees > 90) degrees = 90; // Cap it
            
            needle.style.transform = `rotate(${degrees}deg)`;
            dbLevelDisplay.innerText = Math.round(average);

            if (average < 30) dbStatus.innerText = "Quiet";
            else if (average < 65) dbStatus.innerText = "Normal";
            else dbStatus.innerText = "Loud";

updateMeter();
        document.getElementById('start-mic').style.display = 'none'; // Hide button after access
    } catch (err) {
console.error("Microphone access denied or error:", err);
        alert("Microphone access is required for the Decibel Meter to function.");
    }
});
        
// ==========================================
// 3. Square API (Commerce)
// ==========================================

async function generateSquareInvoice(clientName, amount) {
    try {
        // Mock payload pointing to a hypothetical backend endpoint
        const response = await fetch('https://your-backend-url.com/api/create-invoice', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client: clientName,
                cost: amount,
                currency: 'USD'
            })
        });

        if (!response.ok) throw new Error('Square API Network response was not ok');
        
        const invoiceData = await response.json();
        console.log("Invoice Generated:", invoiceData.invoice_id); // [cite: 56]
        return invoiceData.payment_url; // Link for client [cite: 57]
        
    } catch (error) {
        // Error Handling
        console.error("Square API Error. The invoicing service might be down:", error);
        return null;
    }
}
// ==========================================
// 4. DATA MANAGEMENT: Word Bank Search & Filter
// ==========================================
let wordData = [];

// Fetch data structure (JSON)
async function loadWords() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        wordData = data.articulationWords;
        displayWords(wordData);
    } catch (error) { // Error handling
        console.error("Error loading word bank:", error);
    }
}

function displayWords(words) {
    const container = document.getElementById('word-results');
    container.innerHTML = ''; // Clear current
    words.forEach(item => {
        const div = document.createElement('div');
        div.className = 'word-card';
        div.innerText = `${item.word} (${item.position})`;
        container.appendChild(div);
    });
}

// Write the JavaScript function to filter the word list based on user input and position
function filterWords() {
    const searchText = document.getElementById('word-search').value.toLowerCase();
    const position = document.getElementById('position-filter').value;

    const filtered = wordData.filter(item => {
        const matchesText = item.word.toLowerCase().includes(searchText) || item.phoneme.toLowerCase().includes(searchText);
        const matchesPosition = position === 'All' || item.position === position;
        return matchesText && matchesPosition;
    });

    displayWords(filtered);
}

document.getElementById('search-btn').addEventListener('click', filterWords);
document.getElementById('position-filter').addEventListener('change', filterWords);

// ==========================================
// 5 API MODULE: TinyURL & Local Storage
// ==========================================
const sessionForm = document.getElementById('session-form');

// Create an asynchronous function to send session reports to TinyURL
async function generateShortLink(longUrl) {
    try {
        // Using TinyURL's simple API for vanilla JS
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const shortUrl = await response.text();
        return shortUrl;
    } catch (error) { // Implement try...catch blocks for all API calls
        console.error("TinyURL API Error:", error);
        return null;
    }
}

sessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const studentName = document.getElementById('student-name').value;
    const goals = document.getElementById('session-goals').value;
    const notes = document.getElementById('session-notes').value;
    
    // Local Storage Integration: Stores the generated session summaries locally
    const sessionData = { studentName, goals, notes, date: new Date().toISOString() };
    let history = JSON.parse(localStorage.getItem('sessionHistory')) || [];
    history.push(sessionData);
    if(history.length > 5) history.shift(); // Stores the last 5 [cite: 59]
    localStorage.setItem('sessionHistory', JSON.stringify(history));

    // For the URL, we create a fake long URL containing the report data
    const fakeLongUrl = `https://your-slp-toolkit.com/report?student=${encodeURIComponent(studentName)}`;
    
    const shortLink = await generateShortLink(fakeLongUrl);
    
    if (shortLink) {
        document.getElementById('link-result').classList.remove('hidden');
        document.getElementById('short-link-display').innerText = shortLink;
    }
});

// Build the UI component that allows the user to copy it to their clipboard
document.getElementById('copy-link-btn').addEventListener('click', () => {
    const linkText = document.getElementById('short-link-display').innerText;
    navigator.clipboard.writeText(linkText).then(() => {
        alert('Link copied to clipboard!');
    });
});

// Initialize app data
loadWords();
