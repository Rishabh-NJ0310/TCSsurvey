"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.client = exports.COLLECTIONS = void 0;
exports.connectToDatabase = connectToDatabase;
exports.closeConnection = closeConnection;
const mongodb_1 = require("mongodb");
// Database name
const dbName = "TCSsurvey";
// Collection names - strictly defined to ensure consistency
exports.COLLECTIONS = Object.freeze({
    UPLOADED_DOCUMENTS: "uploadedDocumentsJson"
});
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new mongodb_1.MongoClient(uri);
exports.client = client;
// Database reference
let db;
/**
 * Connect to MongoDB
 */
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to MongoDB
            yield client.connect();
            console.log('Connected successfully to MongoDB server');
            // Get database reference
            exports.db = db = client.db(dbName);
            return db;
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    });
}
/**
 * Close the database connection
 */
function closeConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.close();
            console.log('Database connection closed');
        }
        catch (error) {
            console.error('Error closing database connection:', error);
            throw error;
        }
    });
}
// Handle application shutdown gracefully
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield closeConnection();
    process.exit(0);
}));
