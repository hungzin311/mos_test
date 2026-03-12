# MOS Test Application

A web-based Mean Opinion Score (MOS) test for evaluating audio quality with multi-user support.

## Features

- **Multi-user concurrent testing** - Unlimited simultaneous participants
- **30 original audio samples** with 4 test variants each (120 total)
- **Two evaluation criteria**: Naturalness (1-5) and Similarity (1-5)
- **Randomized test order** within each audio group
- **Server-side result storage** with unique user tracking
- **RESTful API** for easy integration and administration
- **Responsive web interface** that works on desktop and mobile

## Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd mos_test
   npm install
   ```

2. **Add audio files:**
   Place your audio files in `public/audio/` following this naming convention:
   - Originals: `original1.mp3` through `original30.mp3`
   - Tests: `test1_1.mp3` to `test1_4.mp3` (for original1), up to `test30_4.mp3`

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to various hosting platforms.

## API Documentation

### Endpoints

- `GET /` - Main application interface
- `GET /api/config` - Test configuration (audio groups)
- `GET /api/user-id` - Generate unique user ID
- `POST /api/results` - Submit test results
- `GET /api/results` - Retrieve all results (admin)

### Result Format

Results are stored as JSON with this structure:
```json
{
  "id": "unique-result-id",
  "userId": "user-uuid",
  "timestamp": "2026-03-12T10:00:00.000Z",
  "results": [
    {
      "audioId": "test1_1",
      "natural": 4,
      "similarity": 3
    }
  ]
}
```

## Project Structure

```
mos_test/
├── server.js           # Express server
├── package.json        # Dependencies and scripts
├── public/
│   ├── index.html      # Main HTML interface
│   ├── style.css       # Application styling
│   ├── script.js       # Client-side logic
│   └── audio/          # Audio files directory
├── results.json        # Stored test results
├── DEPLOYMENT.md       # Deployment guide
└── README.md          # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: JSON file (easily replaceable with database)
- **Audio**: HTML5 Audio API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Please check the license file for details.