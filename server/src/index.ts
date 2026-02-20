import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import sequelize from './config/database';
import './models/Person';
import './models/Relationship';
import './models/Photo';
import personRoutes from './routes/person.routes';
import relationshipRoutes from './routes/relationship.routes';
import photoRoutes from './routes/photo.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/persons', personRoutes);
app.use('/api/relationships', relationshipRoutes);
app.use('/api/photos', photoRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Genealogy API',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    features: ['Persons CRUD', 'Relationships', 'Photos'],
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Просто проверяем подключение, НЕ синхронизируем
    console.log('📊 Tables are managed manually');
    
    app.listen(PORT, () => {
      console.log(`
      ===============================
      🌳 GENEALOGY API
      ===============================
      ✅ Server: http://localhost:${PORT}
      📊 Endpoints:
         Persons:    /api/persons
         Relationships: /api/relationships
         Photos:     /api/photos
         Health:     /api/health
      ===============================
      `);
    });
  } catch (error: any) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
