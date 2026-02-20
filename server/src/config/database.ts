import { Sequelize } from 'sequelize';
import path from 'path';

const databasePath = path.join(__dirname, '../../database.sqlite');
console.log('📁 Database:', databasePath);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: databasePath,
  logging: (sql) => console.log('[SQL]', sql),
  define: {
    timestamps: true,
    underscored: false
  }
});

export default sequelize;
