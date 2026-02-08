const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

console.log('=== MINIMAL DATABASE TEST ===');

// 1. Определим путь
const dbPath = path.join(__dirname, '..', 'database.test.sqlite');
console.log('1. Database path:', dbPath);

// Удалим старый файл если есть
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('   Old file removed');
}

// 2. Создадим Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (sql) => console.log('   SQL:', sql),
});

// 3. Простейшая модель
const Person = sequelize.define('Person', {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
}, {
  tableName: 'persons',
  timestamps: false, // упростим
});

// 4. Тестируем
(async () => {
  try {
    console.log('\n2. Authenticating...');
    await sequelize.authenticate();
    console.log('   ✅ Connected');
    
    console.log('\n3. Creating table (force: true)...');
    await Person.sync({ force: true });
    console.log('   ✅ Table created');
    
    console.log('\n4. Creating test record...');
    const person = await Person.create({
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('   ✅ Record created, ID:', person.id);
    
    console.log('\n5. Counting records...');
    const count = await Person.count();
    console.log('   📊 Total records:', count);
    
    console.log('\n6. Checking file...');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      console.log('   ✅ File exists, size:', stats.size, 'bytes');
    } else {
      console.log('   ❌ File not created!');
    }
    
    console.log('\n7. Querying directly...');
    const [results] = await sequelize.query('SELECT * FROM persons');
    console.log('   Results:', results);
    
    console.log('\n🎉 TEST COMPLETE!');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
})();
