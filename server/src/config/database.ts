import { Sequelize } from 'sequelize';
import path from 'path';

// Четкий путь к базе
const dbPath = path.resolve('/var/www/genealogy-app/database.sqlite');
console.log('📁 Database:', dbPath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (sql) => console.log(`[SQL] ${sql}`),
});

export default sequelize;
