# MOS Test Development Guide

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Git

### Installation
```bash
git clone <your-repo-url>
cd mos_test
npm install
```

### Running the Application
```bash
# Production mode
npm start

# Development mode (with auto-restart)
npm run dev
```

The server will start on `http://localhost:3000`

## Testing

### Manual Testing
1. Open multiple browser tabs/windows to `http://localhost:3000`
2. Complete the test in each tab
3. Verify results are saved correctly in `results.json`

### API Testing
Use tools like Postman or curl to test endpoints:

```bash
# Get configuration
curl http://localhost:3000/api/config

# Get user ID
curl http://localhost:3000/api/user-id

# Submit results
curl -X POST http://localhost:3000/api/results \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","testResults":[{"audioId":"test1_1","natural":4,"similarity":3}]}'
```

## Code Structure

### Server (`server.js`)
- Express application setup
- API endpoints
- File-based result storage
- CORS configuration

### Client (`public/script.js`)
- User interface logic
- Audio playback controls
- Result collection and submission
- Navigation between test screens

### Styling (`public/style.css`)
- Responsive design
- Audio player styling
- Rating interface
- Navigation elements

## Audio File Management

### Local Development
Place audio files in `public/audio/`:
- `original1.mp3` - `original30.mp3` (30 originals)
- `test1_1.mp3` - `test30_4.mp3` (120 test variants)

### Production Considerations
For large audio files (>100MB), consider:
- Cloud storage (AWS S3, Cloudflare R2)
- CDN delivery
- Progressive loading

## Database Integration

Currently uses JSON file storage. To upgrade:

### Option 1: SQLite
```bash
npm install sqlite3
```

### Option 2: MongoDB
```bash
npm install mongodb mongoose
```

### Option 3: PostgreSQL
```bash
npm install pg
```

## Security Considerations

### Current Setup
- Basic CORS enabled
- No authentication required
- File-based storage (not suitable for production)

### Production Hardening
- Add user authentication
- Implement rate limiting
- Use proper database
- Add input validation
- Enable HTTPS
- Set up proper logging

## Performance Optimization

### Audio Loading
- Preload critical audio files
- Implement lazy loading for non-critical files
- Use audio compression (MP3, AAC)

### Server Optimization
- Implement caching headers
- Add compression middleware
- Use clustering for multi-core utilization
- Set up monitoring and logging

## Troubleshooting

### Common Issues

**Audio files not loading:**
- Ensure files are in `public/audio/`
- Check file permissions
- Verify MIME types are correct

**Results not saving:**
- Check `results.json` permissions
- Verify server has write access
- Check server logs for errors

**CORS errors:**
- Ensure CORS middleware is enabled
- Check request origins in production

### Debug Mode
Set environment variable for detailed logging:
```bash
DEBUG=* npm start
```

## Contributing

### Code Style
- Use ESLint for JavaScript
- Follow conventional commit messages
- Write descriptive commit messages

### Testing Checklist
- [ ] Multiple users can access simultaneously
- [ ] Audio files load correctly
- [ ] Results save properly
- [ ] Navigation works on all screen sizes
- [ ] Error handling works gracefully

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guides.