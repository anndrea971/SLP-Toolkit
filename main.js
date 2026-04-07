// ==========================================
// 1. UTILITY MODULE: Clinical Timer
// ==========================================
let timerInterval;
let seconds = 0;

function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Example usage to bind to buttons you will add to the Timer section:
// document.getElementById('start-timer').addEventListener('click', () => {
//     timerInterval = setInterval(() => {
//         seconds++;
//         document.getElementById('timer-display').innerText = formatTime(seconds);
//     }, 1000);
// });

// ==========================================
// 2. UTILITY MODULE: Decibel Meter Logic
// ==========================================
let audioContext;
let analyser;
let microphone;

async function startDecibelMeter() {
    try {
        // Handling microphone permissions [cite: 61]
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
            
            // Calculate average volume
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            let average = sum / bufferLength;
            
            // In a full implementation, you'd map this 'average' to your UI
            console.log(`Current DB Level (approx): ${average}`);
        }
        updateMeter();
    } catch (err) { // Error handling
        console.error("Microphone access denied or error:", err);
    }
}

// ==========================================
// 3. DATA MANAGEMENT: Word Bank Search & Filter
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
// 4. API MODULE: TinyURL & Local Storage
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
