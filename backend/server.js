import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import analysisRoutes from './routes/analysis.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow multiple localhost ports for development
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Allow all localhost ports
        if (origin.match(/^http:\/\/localhost:\d+$/)) {
            return callback(null, true);
        }
        
        // Check against FRONTEND_URL env variable
        if (origin === process.env.FRONTEND_URL) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'MindMirror API'
    });
});

// API routes
app.use('/api', analysisRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    // Multer error handling
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large',
            details: 'Maximum file size is 10MB'
        });
    }

    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║          🧠 MindMirror API Server              ║
╠════════════════════════════════════════════════╣
║  Status:  Running                              ║
║  Port:    ${PORT}                                  ║
║  Time:    ${new Date().toLocaleTimeString()}                           ║
╚════════════════════════════════════════════════╝
  `);
    console.log('Endpoints:');
    console.log('  POST /api/upload-audio    - Upload audio file');
    console.log('  POST /api/analyze-daily   - Analyze daily reflection');
    console.log('  POST /api/analyze-weekly  - Analyze weekly patterns');
    console.log('  GET  /api/reflections/:userId - Get user reflections');
    console.log('  GET  /api/reflection/:userId/:date - Get specific reflection');
    console.log('  GET  /api/health          - Health check');
    console.log('');
});
