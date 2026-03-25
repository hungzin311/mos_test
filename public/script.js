const DRAFT_STORAGE_KEY = 'mos_test_draft_v1';

// Global variables
let audioGroups = [];
let currentScreen = 0;
let totalScreens = 30;
let userId = null;
let answersByAudioId = {};

// Initialize the app
document.addEventListener('DOMContentLoaded', async function initializeApp() {
    userId = await fetchUserId();
    const configGroups = await fetchAudioConfig();

    restoreOrInitializeProgress(configGroups);

    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startTest);
    document.getElementById('prev-btn').addEventListener('click', prevScreen);
    document.getElementById('next-btn').addEventListener('click', nextScreen);
    document.getElementById('download-btn').addEventListener('click', downloadResults);

    // Persist the latest state before user leaves the page.
    window.addEventListener('beforeunload', function handleBeforeUnload() {
        if (!document.getElementById('test-screen').classList.contains('hidden')) {
            saveCurrentScreenResults();
        } else {
            saveDraft();
        }
    });
});

async function fetchUserId() {
    try {
        const response = await fetch('/api/user-id');
        const data = await response.json();
        return data.userId;
    } catch (error) {
        console.error('Error getting user ID:', error);
        return `anonymous-${Date.now()}`;
    }
}

async function fetchAudioConfig() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        return data.audioGroups;
    } catch (error) {
        console.error('Error loading config:', error);
        return generateFallbackAudioGroups();
    }
}

function generateFallbackAudioGroups() {
    const groups = [];
    for (let i = 1; i <= 30; i++) {
        const tests = [];
        for (let j = 1; j <= 4; j++) {
            tests.push({ id: `test${i}_${j}`, file: `audio/test${i}_${j}.mp3` });
        }
        groups.push({
            original: `audio/original${i}.mp3`,
            tests: tests
        });
    }
    return groups;
}

function restoreOrInitializeProgress(configGroups) {
    const draft = loadDraft();

    if (draft && Array.isArray(draft.audioGroups) && draft.audioGroups.length > 0) {
        audioGroups = draft.audioGroups;
        currentScreen = Number.isInteger(draft.currentScreen) ? draft.currentScreen : 0;
        userId = draft.userId || userId;
        answersByAudioId = draft.answersByAudioId || {};
    } else {
        audioGroups = configGroups.map(group => ({
            ...group,
            tests: shuffleArray([...(group.tests || [])])
        }));
        currentScreen = 0;
        answersByAudioId = {};
        saveDraft();
    }

    totalScreens = audioGroups.length;
    updateStartScreenForResume();
}

function updateStartScreenForResume() {
    const startButton = document.getElementById('start-btn');
    const hasSavedAnswers = Object.keys(answersByAudioId).length > 0;
    if (hasSavedAnswers || currentScreen > 0) {
        startButton.textContent = 'Resume Test';
    }
}

// Shuffle array function
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start the test
function startTest() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('test-screen').classList.remove('hidden');
    loadScreen(currentScreen);
}

// Load a specific screen
function loadScreen(screenIndex) {
    currentScreen = screenIndex;
    const group = audioGroups[screenIndex];

    // Update screen number
    document.getElementById('screen-number').textContent = `${screenIndex + 1} of ${totalScreens}`;

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

        // Restore existing answers for this audio if available.
        const savedAnswer = answersByAudioId[test.id];
        if (savedAnswer) {
            const naturalInput = audioSection.querySelector(
                `input[name="natural_${test.id}"][value="${savedAnswer.natural}"]`
            );
            const similarityInput = audioSection.querySelector(
                `input[name="similarity_${test.id}"][value="${savedAnswer.similarity}"]`
            );
            if (naturalInput) {
                naturalInput.checked = true;
            }
            if (similarityInput) {
                similarityInput.checked = true;
            }
        }
    });

    // Update navigation buttons
    document.getElementById('prev-btn').disabled = screenIndex === 0;
    document.getElementById('next-btn').textContent = screenIndex === totalScreens - 1 ? 'Finish' : 'Next';

    saveDraft();

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
    const missingRatings = [];

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

// Save results for current screen
function saveCurrentScreenResults() {
    const group = audioGroups[currentScreen];
    group.tests.forEach(test => {
        const naturalRating = document.querySelector(`input[name="natural_${test.id}"]:checked`);
        const similarityRating = document.querySelector(`input[name="similarity_${test.id}"]:checked`);

        if (naturalRating && similarityRating) {
            answersByAudioId[test.id] = {
                audioId: test.id,
                natural: Number.parseInt(naturalRating.value, 10),
                similarity: Number.parseInt(similarityRating.value, 10)
            };
        }
    });

    saveDraft();
}

function getResultsArray() {
    return Object.values(answersByAudioId);
}

// Submit results to server
async function submitResults() {
    try {
        const response = await fetch('/api/results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                testResults: getResultsArray()
            })
        });

        if (response.ok) {
            clearDraft();
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

// Download results as JSON
function downloadResults() {
    const dataStr = JSON.stringify(getResultsArray(), null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = 'mos_test_results.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function saveDraft() {
    const draft = {
        userId,
        currentScreen,
        audioGroups,
        answersByAudioId,
        updatedAt: new Date().toISOString()
    };
    try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
        console.warn('Unable to save draft to localStorage:', error);
    }
}

function loadDraft() {
    try {
        const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!rawDraft) {
            return null;
        }
        return JSON.parse(rawDraft);
    } catch (error) {
        console.warn('Unable to load draft from localStorage:', error);
        return null;
    }
}

function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
        console.warn('Unable to clear draft in localStorage:', error);
    }
}