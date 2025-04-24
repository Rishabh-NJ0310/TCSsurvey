    import { MongoClient, Db } from 'mongodb';

    // Database name
    const dbName = "TCSsurvey";

    // Collection names - strictly defined to ensure consistency
    export const COLLECTIONS = Object.freeze({
    UPLOADED_DOCUMENTS: "uploadedDocumentsJson"
    });

    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    // Database reference
    let db: Db;

    /**
     * Connect to MongoDB
     */
    async function connectToDatabase(): Promise<Db> {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log('Connected successfully to MongoDB server');
        
        // Get database reference
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
    }

    /**
     * Close the database connection
     */
    async function closeConnection(): Promise<void> {
    try {
        await client.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database connection:', error);
        throw error;
    }
    }

    // Handle application shutdown gracefully
    process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
    });

    export {
    connectToDatabase,
    closeConnection,
    client,
    db
    };
