const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Правильный путь
const dbPath = path.join(__dirname, '..', 'database.sqlite');
console.log('Testing database path:', dbPath);
console.log('Directory:', path.dirname(dbPath));
console.log('Parent exists:', fs.existsSync(path.dirname(dbPath)));

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: true,
});

const Person = sequelize.define('Person', {
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'persons' });

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    await sequelize.sync({ force: true });
    console.log('✅ Tables created');
    
    const person = await Person.create({
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ Person created:', person.toJSON());
    
    const count = await Person.count();
    console.log('📊 Total persons:', count);
    
    // Проверим файл
    if (fs.existsSync(dbPath)) {
      console.log('✅ Database file created at:', dbPath);
      console.log('File size:', fs.statSync(dbPath).size, 'bytes');
    } else {
      console.log('❌ Database file NOT created!');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
