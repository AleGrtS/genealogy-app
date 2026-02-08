import { Sequelize } from 'sequelize';
import path from 'path';

// Определяем интерфейс для человека
interface Person {
  id: number;
  firstName: string;
  lastName: string;
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: console.log
});

async function addRelationshipTypes() {
  try {
    console.log('🔄 Обновление типов отношений...');

    // Проверяем текущие типы
    const [results] = await sequelize.query(
      "SELECT DISTINCT type FROM relationships;"
    );
    console.log('Текущие типы:', (results as any[]).map(r => r.type));

    // Получаем список людей с правильной типизацией
    const [peopleRows] = await sequelize.query(
      "SELECT id, firstName, lastName FROM persons ORDER BY id LIMIT 20;"
    );
    const people = peopleRows as Person[];

    if (people.length < 5) {
      console.log('❌ Недостаточно людей в базе. Нужно минимум 5 человек.');
      console.log('Сейчас людей:', people.length);
      
      // Добавим тестовых людей если их мало
      console.log('\n📌 Добавляем тестовых людей...');
      for (let i = 1; i <= 8; i++) {
        await sequelize.query(
          "INSERT INTO persons (firstName, lastName, gender, isAlive, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'));",
          { replacements: [`Имя${i}`, `Фамилия${i}`, i % 2 ? 'male' : 'female', 1] }
        );
      }
      console.log('✅ Тестовые люди добавлены');
      
      // Снова получаем список людей
      const [newPeopleRows] = await sequelize.query(
        "SELECT id, firstName, lastName FROM persons ORDER BY id LIMIT 20;"
      );
      people.push(...(newPeopleRows as Person[]));
    }

    console.log('\n📌 Доступные люди:');
    people.forEach((p: Person) => {
      console.log(`   ID: ${p.id} - ${p.firstName} ${p.lastName}`);
    });

    // Проверяем, есть ли уже такие отношения
    const [existingTypesRows] = await sequelize.query(
      "SELECT DISTINCT type FROM relationships;"
    );
    const existingTypes = (existingTypesRows as any[]).map(r => r.type);
    console.log('\n📌 Существующие типы:', existingTypes);

    // Добавляем отношения parent (если нет)
    if (!existingTypes.includes('parent') && people.length >= 4) {
      console.log('\n📌 Добавляем parent отношения...');
      const parent1 = people[0];
      const parent2 = people[1];
      const child1 = people[2];
      const child2 = people[3];

      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [parent1.id, child1.id, 'parent'] }
      );
      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [parent2.id, child2.id, 'parent'] }
      );
      console.log('   ✅ parent отношения добавлены');
    }

    // Добавляем отношения spouse (если нет)
    if (!existingTypes.includes('spouse') && people.length >= 2) {
      console.log('\n📌 Добавляем spouse отношения...');
      const spouse1 = people[0];
      const spouse2 = people[1];

      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [spouse1.id, spouse2.id, 'spouse'] }
      );
      console.log('   ✅ spouse отношения добавлены');
    }

    // Добавляем отношения grandparent
    if (!existingTypes.includes('grandparent') && people.length >= 6) {
      console.log('\n📌 Добавляем grandparent отношения...');
      const grandparent1 = people[0];
      const grandparent2 = people[1];
      const grandchild1 = people[4];
      const grandchild2 = people[5];

      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [grandparent1.id, grandchild1.id, 'grandparent'] }
      );
      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [grandparent2.id, grandchild2.id, 'grandparent'] }
      );
      console.log('   ✅ grandparent отношения добавлены');
    }

    // Добавляем отношения aunt_uncle
    if (!existingTypes.includes('aunt_uncle') && people.length >= 8) {
      console.log('\n📌 Добавляем aunt_uncle отношения...');
      const aunt1 = people[2];
      const aunt2 = people[3];
      const nephew1 = people[6];
      const nephew2 = people[7];

      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [aunt1.id, nephew1.id, 'aunt_uncle'] }
      );
      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [aunt2.id, nephew2.id, 'aunt_uncle'] }
      );
      console.log('   ✅ aunt_uncle отношения добавлены');
    }

    // Добавляем отношения cousin
    if (!existingTypes.includes('cousin') && people.length >= 8) {
      console.log('\n📌 Добавляем cousin отношения...');
      const cousin1 = people[2];
      const cousin2 = people[3];
      const cousin3 = people[4];
      const cousin4 = people[5];

      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [cousin1.id, cousin3.id, 'cousin'] }
      );
      await sequelize.query(
        "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
        { replacements: [cousin2.id, cousin4.id, 'cousin'] }
      );
      console.log('   ✅ cousin отношения добавлены');
    }

    // Проверяем итоговые типы
    const [finalTypesRows] = await sequelize.query(
      "SELECT DISTINCT type FROM relationships;"
    );
    const finalTypes = (finalTypesRows as any[]).map(r => r.type);
    console.log('\n✅ Итоговые типы отношений:', finalTypes);

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

addRelationshipTypes();
