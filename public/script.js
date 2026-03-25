// Audio data structure
const audioGroups = [];

//This allows you to map ratings back to specific audio files for analysis.- `similarity`: Similarity rating (1-5)- `natural`: Naturalness rating (1-5)- `audioId`: Identifier for each test audio (e.g., "test1_1")After completing all 30 screens, users can download results as a JSON file containing:## Results```    └── ...    ├── test2_1.mp3    ├── test1_4.mp3    ├── test1_3.mp3    ├── test1_2.mp3    ├── test1_1.mp3    ├── original30.mp3    ├── ...    ├── original2.mp3    ├── original1.mp3└── audio/├── README.md├── script.js├── style.css├── index.htmlmos_test/```## File Structure- Results are saved with audio IDs for analysis- Test audios are randomized within each group  - Similarity (how close to the original): 1-5 scale  - Naturalness (how human-like the audio sounds): 1-5 scale- Users rate 4 test audio samples on two criteria:- Each screen presents one original audio sample## How It Works3. Open your browser and navigate to `http://localhost:8000`   ```   python -m http.server 8000   ```bash2. Start a local web server (required for audio files to load):   - Test audios: `test1_1.mp3`, `test1_2.mp3`, `test1_3.mp3`, `test1_4.mp3` for original1, and so on up to `test30_4.mp3`   - Original audios: `original1.mp3` through `original30.mp3`1. Place your audio files in the `audio/` directory following this naming convention:## SetupA web-based Mean Opinion Score (MOS) test for evaluating audio quality.
for (let i = 1; i <= 30; i++) {
    const tests = [];
    for (let j = 1; j <= 4; j++) {
        tests.push({ id: `test${i}_${j}`, file: `audio/test${i}_${j}.mp3` });
    }
    audioGroups.push({
        original: `audio/original${i}.mp3`,
        tests: tests
    });
}

// Shuffle array function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Global variables
let currentScreen = 0;
let totalScreens = 30;
let results = [];
let userId = null;
// let audioGroups = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    // Get unique user ID
    try {
        const response = await fetch('/api/user-id');
        const data = await response.json();
        userId = data.userId;
    } catch (error) {
        console.error('Error getting user ID:', error);
        userId = 'anonymous-' + Date.now();
    }

    // Load audio configuration
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        audioGroups = data.audioGroups;
        totalScreens = audioGroups.length;
    } catch (error) {
        console.error('Error loading config:', error);
        // Fallback to local generation
        for (let i = 1; i <= 30; i++) {
            const tests = [];
            for (let j = 1; j <= 4; j++) {
                tests.push({ id: `test${i}_${j}`, file: `audio/test${i}_${j}.mp3` });
            }
            audioGroups.push({
                original: `audio/original${i}.mp3`,
                tests: tests
            });
        }
    }

    // Shuffle the test audios within each group
    audioGroups.forEach(group => {
        group.tests = shuffleArray(group.tests);
    });

    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startTest);
    document.getElementById('prev-btn').addEventListener('click', prevScreen);
    document.getElementById('next-btn').addEventListener('click', nextScreen);
    document.getElementById('download-btn').addEventListener('click', downloadResults);
});

// Start the test
function startTest() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('test-screen').classList.remove('hidden');
    loadScreen(0);
}

// Load a specific screen
function loadScreen(screenIndex) {
    currentScreen = screenIndex;
    const group = audioGroups[screenIndex];
    
    // Update screen number
    document.getElementById('screen-number').textContent = (screenIndex + 1) + ' of ' + totalScreens;
    
    // Load original audio
    const originalPlayer = document.getElementById('original-player');
    originalPlayer.src = group.original;
    
    // Load test audios
    const testAudiosDiv = document.getElementById('test-audios');
    testAudiosDiv.innerHTML = '';
    
    group.tests.forEach((test, index) => {
        const audioSection = document.createElement('div');
        audioSection.className = 'audio-section';
        audioSection.innerHTML = `
            <h3>Test Audio ${index + 1}</h3>
            <audio controls class="audio-player" data-id="${test.id}"></audio>
            <div class="questions">
                <div class="question">
                    <label>How naturally (human-like) does this audio sound? (1-5)</label>
                    <div class="rating">
                        <label><input type="radio" name="natural_${test.id}" value="1">1</label>
                        <label><input type="radio" name="natural_${test.id}" value="2">2</label>
                        <label><input type="radio" name="natural_${test.id}" value="3">3</label>
                        <label><input type="radio" name="natural_${test.id}" value="4">4</label>
                        <label><input type="radio" name="natural_${test.id}" value="5">5</label>
                    </div>
                </div>
                <div class="question">
                    <label>How close is this audio to the original? (1-5)</label>
                    <div class="rating">
                        <label><input type="radio" name="similarity_${test.id}" value="1">1</label>
                        <label><input type="radio" name="similarity_${test.id}" value="2">2</label>
                        <label><input type="radio" name="similarity_${test.id}" value="3">3</label>
                        <label><input type="radio" name="similarity_${test.id}" value="4">4</label>
                        <label><input type="radio" name="similarity_${test.id}" value="5">5</label>
                    </div>
                </div>
            </div>
        `;
        testAudiosDiv.appendChild(audioSection);
        
        // Set audio source
        const audioPlayer = audioSection.querySelector('.audio-player');
        audioPlayer.src = test.file;
    });
    
    // Update navigation buttons
    document.getElementById('prev-btn').disabled = screenIndex === 0;
    document.getElementById('next-btn').textContent = screenIndex === totalScreens - 1 ? 'Finish' : 'Next';
    
    // Scroll to top of page
    window.scrollTo(0, 0);
}

// Go to previous screen
function prevScreen() {
    if (currentScreen > 0) {
        saveCurrentScreenResults();
        loadScreen(currentScreen - 1);
    }
}

// Go to next screen
function nextScreen() {
    // Validate that all ratings are completed
    if (!validateCurrentScreen()) {
        return;
    }
    
    saveCurrentScreenResults();
    if (currentScreen < totalScreens - 1) {
        loadScreen(currentScreen + 1);
    } else {
        // Test complete - submit results to server
        submitResults();
    }
}

// Validate that all ratings are completed for current screen
function validateCurrentScreen() {
    const group = audioGroups[currentScreen];
    let allRated = true;
    let missingRatings = [];
    
    group.tests.forEach((test, index) => {
        const naturalRating = document.querySelector(`input[name="natural_${test.id}"]:checked`);
        const similarityRating = document.querySelector(`input[name="similarity_${test.id}"]:checked`);
        
        if (!naturalRating) {
            missingRatings.push(`Test Audio ${index + 1} - Naturalness rating`);
        }
        if (!similarityRating) {
            missingRatings.push(`Test Audio ${index + 1} - Similarity rating`);
        }
    });
    
    if (missingRatings.length > 0) {
        alert(`Please complete all ratings before proceeding:\n\n${missingRatings.join('\n')}`);
        return false;
    }
    
    return true;
}

// Submit results to server
async function submitResults() {
    try {
        const response = await fetch('/api/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                testResults: results
            })
        });
        
        if (response.ok) {
            // Show completion screen
            document.getElementById('test-screen').classList.add('hidden');
            document.getElementById('end-screen').classList.remove('hidden');
        } else {
            alert('Error submitting results. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting results:', error);
        alert('Network error. Please check your connection and try again.');
    }
}

// Save results for current screen
function saveCurrentScreenResults() {
    const group = audioGroups[currentScreen];
    group.tests.forEach(test => {
        const naturalRating = document.querySelector(`input[name="natural_${test.id}"]:checked`);
        const similarityRating = document.querySelector(`input[name="similarity_${test.id}"]:checked`);
        
        if (naturalRating && similarityRating) {
            results.push({
                audioId: test.id,
                natural: parseInt(naturalRating.value),
                similarity: parseInt(similarityRating.value)
            });
        }
    });
}

// Download results as JSON
function downloadResults() {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'mos_test_results.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}