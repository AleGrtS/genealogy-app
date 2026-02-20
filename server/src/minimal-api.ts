import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';

const app = express();
const PORT = 3001;

// Простая база в памяти для теста
const sequelize = new Sequelize('sqlite::memory:');

const Person = sequelize.define('Person', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING
});

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ 
      status: 'OK', 
      database: 'connected',
      message: 'Minimal API working' 
    });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', error: String(error) });
  }
});

app.get('/api/persons', async (req, res) => {
  try {
    const persons = await Person.findAll();
    res.json({ success: true, data: persons });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.listen(PORT, async () => {
  await sequelize.sync();
  console.log(`✅ Minimal API running on http://localhost:${PORT}`);
});
