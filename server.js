const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8013;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for results (in production, use a database)
let results = [];

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get test configuration
app.get('/api/config', (req, res) => {
    // Generate audio groups dynamically
    const audioGroups = [];
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
    res.json({ audioGroups });
});

// Submit results
app.post('/api/results', (req, res) => {
    const { userId, testResults } = req.body;

    if (!userId || !testResults) {
        return res.status(400).json({ error: 'Missing userId or testResults' });
    }

    // Add timestamp and user ID to results
    const resultEntry = {
        id: uuidv4(),
        userId: userId,
        timestamp: new Date().toISOString(),
        results: testResults
    };

    results.push(resultEntry);

    // Save to file (in production, save to database)
    saveResultsToFile();

    res.json({ success: true, id: resultEntry.id });
});

// Get all results (admin endpoint)
app.get('/api/results', (req, res) => {
    res.json(results);
});

// Generate unique user ID
app.get('/api/user-id', (req, res) => {
    res.json({ userId: uuidv4() });
});

app.get('/health', (req, res)  => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        resultsCount: results.length
    });
});

// Helper function to save results to file
function saveResultsToFile() {
    const filePath = path.join(__dirname, 'results.json');
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
}

// Load existing results on startup
function loadResultsFromFile() {
    const filePath = path.join(__dirname, 'results.json');
    if (fs.existsSync(filePath)) {
        try {
            results = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error('Error loading results:', error);
        }
    }
}

// Initialize
loadResultsFromFile();

app.listen(PORT, '0.0.0.0',() => {
    console.log(`MOS Test server running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
});
