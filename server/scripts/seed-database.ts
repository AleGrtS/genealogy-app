import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';

// Настройка базы данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: console.log
});

// Модель Person (таблица persons)
const Person = sequelize.define('Person', {
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  middleName: { type: DataTypes.STRING },
  gender: { type: DataTypes.STRING },
  birthDate: { type: DataTypes.DATEONLY },
  birthPlace: { type: DataTypes.TEXT },
  deathDate: { type: DataTypes.DATEONLY },
  deathPlace: { type: DataTypes.TEXT },
  biography: { type: DataTypes.TEXT },
  isAlive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'persons',
  timestamps: true
});

// Модель Relationship (таблица relationships)
const Relationship = sequelize.define('Relationship', {
  person1Id: { type: DataTypes.INTEGER, allowNull: false },
  person2Id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  notes: { type: DataTypes.TEXT }
}, {
  tableName: 'relationships',
  timestamps: true
});

// Модель Photo (таблица photos)
const Photo = sequelize.define('Photo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  personId: { type: DataTypes.INTEGER, allowNull: false },
  filename: { type: DataTypes.STRING, allowNull: false },
  originalName: { type: DataTypes.STRING, allowNull: false },
  path: { type: DataTypes.STRING, allowNull: false },
  thumbnailPath: { type: DataTypes.STRING, allowNull: false },
  size: { type: DataTypes.INTEGER, allowNull: false },
  mimeType: { type: DataTypes.STRING, allowNull: false },
  isMain: { type: DataTypes.BOOLEAN, defaultValue: false },
  caption: { type: DataTypes.STRING }
}, {
  tableName: 'photos',
  timestamps: true
});

// Связи
Person.hasMany(Relationship, { foreignKey: 'person1Id' });
Person.hasMany(Relationship, { foreignKey: 'person2Id' });
Relationship.belongsTo(Person, { foreignKey: 'person1Id', as: 'person1' });
Relationship.belongsTo(Person, { foreignKey: 'person2Id', as: 'person2' });

Person.hasMany(Photo, { foreignKey: 'personId' });
Photo.belongsTo(Person, { foreignKey: 'personId' });

// Данные для генерации
const FAMILY_NAMES = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов'];
const MALE_NAMES = ['Иван', 'Петр', 'Сидор', 'Алексей', 'Дмитрий', 'Николай', 'Михаил', 'Андрей'];
const FEMALE_NAMES = ['Мария', 'Анна', 'Елена', 'Ольга', 'Татьяна', 'Наталья', 'Ирина', 'Екатерина'];
const CITIES = ['Москва', 'Питер', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород'];

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    .toISOString().split('T')[0];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function seedDatabase() {
  try {
    console.log('🌱 Начинаем наполнение базы данных...');
    
    // Синхронизируем модели (создаем таблицы)
    await sequelize.sync({ force: true });
    console.log('✅ Таблицы созданы: persons, relationships, photos');

    // === 1 ПОКОЛЕНИЕ ===
    console.log('\n📌 Создаем 1 поколение (прадеды)...');
    const gen1 = [];
    
    for (let i = 0; i < 4; i++) {
      const husband = await Person.create({
        firstName: randomItem(MALE_NAMES),
        lastName: randomItem(FAMILY_NAMES),
        middleName: randomItem(MALE_NAMES) + 'ович',
        gender: 'male',
        birthDate: randomDate(new Date(1880, 0, 1), new Date(1900, 11, 31)),
        birthPlace: randomItem(CITIES),
        deathDate: randomDate(new Date(1950, 0, 1), new Date(1970, 11, 31)),
        isAlive: false,
        biography: 'Ветеран труда.'
      });
      
      const wife = await Person.create({
        firstName: randomItem(FEMALE_NAMES),
        lastName: husband.get('lastName') + 'а',
        middleName: randomItem(FEMALE_NAMES) + 'овна',
        gender: 'female',
        birthDate: randomDate(new Date(1885, 0, 1), new Date(1905, 11, 31)),
        birthPlace: randomItem(CITIES),
        deathDate: randomDate(new Date(1960, 0, 1), new Date(1980, 11, 31)),
        isAlive: false,
        biography: 'Домохозяйка.'
      });
      
      gen1.push(husband, wife);
      
      await Relationship.create({
        person1Id: husband.get('id'),
        person2Id: wife.get('id'),
        type: 'spouse'
      });
      
      console.log(`   💑 ${husband.get('firstName')} + ${wife.get('firstName')}`);
    }

    // === 2 ПОКОЛЕНИЕ ===
    console.log('\n📌 Создаем 2 поколение (деды)...');
    const gen2 = [];
    
    for (let i = 0; i < gen1.length; i += 2) {
      const father = gen1[i];
      const mother = gen1[i + 1];
      
      for (let j = 0; j < 2; j++) {
        const isMale = Math.random() > 0.5;
        const child = await Person.create({
          firstName: isMale ? randomItem(MALE_NAMES) : randomItem(FEMALE_NAMES),
          lastName: father.get('lastName'),
          middleName: isMale ? father.get('firstName') + 'ович' : father.get('firstName') + 'овна',
          gender: isMale ? 'male' : 'female',
          birthDate: randomDate(new Date(1920, 0, 1), new Date(1940, 11, 31)),
          birthPlace: randomItem(CITIES),
          deathDate: randomDate(new Date(1990, 0, 1), new Date(2010, 11, 31)),
          isAlive: false,
          biography: 'Рабочий.'
        });
        
        gen2.push(child);
        
        await Relationship.create({ person1Id: father.get('id'), person2Id: child.get('id'), type: 'parent' });
        await Relationship.create({ person1Id: mother.get('id'), person2Id: child.get('id'), type: 'parent' });
        
        console.log(`   + ${child.get('firstName')} ${child.get('lastName')}`);
      }
    }

    // === 3 ПОКОЛЕНИЕ ===
    console.log('\n📌 Создаем 3 поколение (родители)...');
    const gen3 = [];
    
    for (let i = 0; i < gen2.length; i += 2) {
      if (i + 1 < gen2.length) {
        const father = gen2[i];
        const mother = gen2[i + 1];
        
        for (let j = 0; j < 2; j++) {
          const isMale = Math.random() > 0.5;
          const child = await Person.create({
            firstName: isMale ? randomItem(MALE_NAMES) : randomItem(FEMALE_NAMES),
            lastName: father.get('lastName'),
            middleName: isMale ? father.get('firstName') + 'ович' : father.get('firstName') + 'овна',
            gender: isMale ? 'male' : 'female',
            birthDate: randomDate(new Date(1960, 0, 1), new Date(1980, 11, 31)),
            birthPlace: randomItem(CITIES),
            isAlive: true,
            biography: 'Современный работник.'
          });
          
          gen3.push(child);
          
          await Relationship.create({ person1Id: father.get('id'), person2Id: child.get('id'), type: 'parent' });
          await Relationship.create({ person1Id: mother.get('id'), person2Id: child.get('id'), type: 'parent' });
          
          console.log(`   + ${child.get('firstName')} ${child.get('lastName')}`);
        }
      }
    }

    // === 4 ПОКОЛЕНИЕ ===
    console.log('\n📌 Создаем 4 поколение (дети)...');
    
    for (let i = 0; i < gen3.length; i++) {
      const parent = gen3[i];
      const child = await Person.create({
        firstName: randomItem(MALE_NAMES),
        lastName: parent.get('lastName'),
        middleName: parent.get('firstName') + 'ович',
        gender: 'male',
        birthDate: randomDate(new Date(2000, 0, 1), new Date(2010, 11, 31)),
        birthPlace: randomItem(CITIES),
        isAlive: true,
        biography: 'Ребенок.'
      });
      
      await Relationship.create({ person1Id: parent.get('id'), person2Id: child.get('id'), type: 'parent' });
      console.log(`   + ${child.get('firstName')} ${child.get('lastName')}`);
    }

    // === ИТОГИ ===
    const personsCount = await Person.count();
    const relationshipsCount = await Relationship.count();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 ИТОГИ НАПОЛНЕНИЯ БАЗЫ');
    console.log('='.repeat(50));
    console.log(`👥 Всего людей: ${personsCount}`);
    console.log(`🔗 Всего отношений: ${relationshipsCount}`);
    console.log('='.repeat(50));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
}

seedDatabase();
