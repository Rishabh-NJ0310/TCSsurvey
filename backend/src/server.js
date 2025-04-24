"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow both localhost variations
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/documents', documentRoutes_1.default);
app.use('/api/applications', documentRoutes_1.default);
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
