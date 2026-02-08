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
const PORT = Number(process.env.PORT) || 3001; // Явно преобразуем в число
const HOST = '0.0.0.0';

// Разрешаем запросы с любых источников (для мобильных устройств)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
    console.log('📊 Tables are managed manually');
    
    app.listen(PORT, HOST, () => {
      console.log(`
      ===============================
      🌳 GENEALOGY API
      ===============================
      ✅ Server: http://${HOST}:${PORT}
      ✅ Local:  http://localhost:${PORT}
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
