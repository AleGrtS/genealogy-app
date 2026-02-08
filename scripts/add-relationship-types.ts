import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';

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
    console.log('Текущие типы:', results.map((r: any) => r.type));

    // Создаем новые отношения для примера
    // Найдем несколько людей, чтобы создать связи
    const [people] = await sequelize.query(
      "SELECT id, firstName, lastName FROM persons LIMIT 10;"
    );

    if (people.length < 5) {
      console.log('❌ Недостаточно людей в базе');
      return;
    }

    // Создаем отношения grandparent (дедушка/бабушка - внуки)
    console.log('\n📌 Создаем отношения grandparent...');
    for (let i = 0; i < 3; i++) {
      const grandparent = people[i];
      const grandchild = people[i + 3];
      if (grandparent && grandchild) {
        await sequelize.query(
          "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
          { replacements: [grandparent.id, grandchild.id, 'grandparent'] }
        );
        console.log(`   + ${grandparent.firstName} -> ${grandchild.firstName} (grandparent)`);
      }
    }

    // Создаем отношения aunt_uncle (тетя/дядя - племянники)
    console.log('\n📌 Создаем отношения aunt_uncle...');
    for (let i = 2; i < 5; i++) {
      const aunt = people[i];
      const nephew = people[i + 2];
      if (aunt && nephew) {
        await sequelize.query(
          "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
          { replacements: [aunt.id, nephew.id, 'aunt_uncle'] }
        );
        console.log(`   + ${aunt.firstName} -> ${nephew.firstName} (aunt_uncle)`);
      }
    }

    // Создаем отношения cousin (двоюродные)
    console.log('\n📌 Создаем отношения cousin...');
    for (let i = 0; i < 4; i++) {
      const cousin1 = people[i];
      const cousin2 = people[i + 4];
      if (cousin1 && cousin2) {
        await sequelize.query(
          "INSERT OR IGNORE INTO relationships (person1Id, person2Id, type, createdAt, updatedAt) VALUES (?, ?, ?, datetime('now'), datetime('now'));",
          { replacements: [cousin1.id, cousin2.id, 'cousin'] }
        );
        console.log(`   + ${cousin1.firstName} -> ${cousin2.firstName} (cousin)`);
      }
    }

    // Проверяем итоговые типы
    const [finalTypes] = await sequelize.query(
      "SELECT DISTINCT type FROM relationships;"
    );
    console.log('\n✅ Итоговые типы отношений:', finalTypes.map((t: any) => t.type));

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await sequelize.close();
  }
}

addRelationshipTypes();
