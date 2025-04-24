import express from 'express';
import cors from 'cors';
import path from 'path';
import documentRoutes from './routes/documentRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow both localhost variations
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/applications', documentRoutes);

// Test route for connectivity checking
app.get('/api/test', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is working properly!' });
});

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});