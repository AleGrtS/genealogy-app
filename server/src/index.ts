import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';
import './models/Person';
import './models/Relationship';
import personRoutes from './routes/person.routes';
import relationshipRoutes from './routes/relationship.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/persons', personRoutes);
app.use('/api/relationships', relationshipRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Genealogy API',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    features: ['Persons CRUD', 'Relationships'],
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized');
    
    app.listen(PORT, () => {
      console.log(`
      ===============================
      🌳 GENEALOGY API
      ===============================
      ✅ Server: http://localhost:${PORT}
      📊 Endpoints:
         Persons:    /api/persons
         Relationships: /api/relationships
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
