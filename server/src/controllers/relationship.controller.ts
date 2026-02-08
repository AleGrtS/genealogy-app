import { Request, Response } from 'express';
import Relationship from '../models/Relationship';
import Person from '../models/Person';
import { Op } from 'sequelize';

export const createRelationship = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Создание отношения:', req.body);
    const { person1Id, person2Id, type, startDate, endDate, notes } = req.body;

    // Проверяем обязательные поля
    if (!person1Id || !person2Id || !type) {
      res.status(400).json({
        success: false,
        message: 'Необходимо указать person1Id, person2Id и type'
      });
      return;
    }

    // Проверяем что люди существуют
    const person1 = await Person.findByPk(person1Id);
    const person2 = await Person.findByPk(person2Id);

    if (!person1 || !person2) {
      res.status(404).json({
        success: false,
        message: 'Один или оба человека не найдены'
      });
      return;
    }

    // Проверяем что это не одна и та же персона
    if (person1Id === person2Id) {
      res.status(400).json({
        success: false,
        message: 'Нельзя создать отношение человека с самим собой'
      });
      return;
    }

    // Проверяем что отношение еще не существует
    const existingRelationship = await Relationship.findOne({
      where: {
        [Op.or]: [
          { person1Id, person2Id, type },
          { person1Id: person2Id, person2Id: person1Id, type }
        ]
      }
    });

    if (existingRelationship) {
      res.status(400).json({
        success: false,
        message: 'Такое отношение уже существует'
      });
      return;
    }

    // Создаем основное отношение
    const relationship = await Relationship.create({
      person1Id,
      person2Id,
      type,
      startDate,
      endDate,
      notes,
    });

    console.log('✅ Создано отношение:', relationship.id);

    // Создаем обратное отношение для некоторых типов
    let reverseRelationship = null;
    if (type === 'parent') {
      reverseRelationship = await Relationship.create({
        person1Id: person2Id,
        person2Id: person1Id,
        type: 'child',
        startDate,
        endDate,
        notes,
      });
      console.log('✅ Создано обратное отношение (child):', reverseRelationship.id);
    } else if (type === 'spouse' || type === 'sibling') {
      // Для супругов и братьев/сестер создаем двустороннее отношение
      reverseRelationship = await Relationship.create({
        person1Id: person2Id,
        person2Id: person1Id,
        type: type,
        startDate,
        endDate,
        notes,
      });
      console.log(`✅ Создано обратное отношение (${type}):`, reverseRelationship.id);
    }

    res.status(201).json({
      success: true,
      message: 'Отношение создано успешно',
      data: relationship,
      reverse: reverseRelationship
    });
  } catch (error: any) {
    console.error('❌ Ошибка создания отношения:', error.message);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания отношения',
      error: error.message
    });
  }
};

export const getPersonRelationships = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('🔍 Получение отношений для человека ID:', id);

    const person = await Person.findByPk(id);
    if (!person) {
      res.status(404).json({
        success: false,
        message: 'Человек не найден'
      });
      return;
    }

    // Получаем все отношения где человек участвует
    const relationships = await Relationship.findAll({
      where: {
        person1Id: id,
      },
      include: [
        {
          model: Person,
          as: 'person2',
          attributes: ['id', 'firstName', 'lastName', 'gender', 'birthDate'],
        },
      ],
      order: [['type', 'ASC'], ['createdAt', 'DESC']],
    });

    console.log('✅ Найдено отношений:', relationships.length);

    res.json({
      success: true,
      count: relationships.length,
      data: relationships,
    });
  } catch (error: any) {
    console.error('❌ Ошибка получения отношений:', error.message);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения отношений',
      error: error.message
    });
  }
};

export const deleteRelationship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log('🗑️ Удаление отношения ID:', id);

    const relationship = await Relationship.findByPk(id);
    if (!relationship) {
      res.status(404).json({
        success: false,
        message: 'Отношение не найдено'
      });
      return;
    }

    // Удаляем и обратное отношение если нужно
    if (relationship.type === 'parent') {
      await Relationship.destroy({
        where: {
          person1Id: relationship.person2Id,
          person2Id: relationship.person1Id,
          type: 'child',
        },
      });
      console.log('✅ Удалено обратное отношение (child)');
    } else if (relationship.type === 'spouse' || relationship.type === 'sibling') {
      await Relationship.destroy({
        where: {
          person1Id: relationship.person2Id,
          person2Id: relationship.person1Id,
          type: relationship.type,
        },
      });
      console.log(`✅ Удалено обратное отношение (${relationship.type})`);
    }

    await relationship.destroy();
    console.log('✅ Отношение удалено');

    res.json({
      success: true,
      message: 'Отношение удалено успешно',
    });
  } catch (error: any) {
    console.error('❌ Ошибка удаления отношения:', error.message);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления отношения',
      error: error.message
    });
  }
};

export const getAllRelationships = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📋 Получение всех отношений');
    
    const relationships = await Relationship.findAll({
      include: [
        {
          model: Person,
          as: 'person1',
          attributes: ['id', 'firstName', 'lastName', 'gender'],
        },
        {
          model: Person,
          as: 'person2',
          attributes: ['id', 'firstName', 'lastName', 'gender'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100, // Ограничим вывод
    });

    console.log('✅ Всего отношений в базе:', relationships.length);

    res.json({
      success: true,
      count: relationships.length,
      data: relationships,
      message: 'Отношения загружены успешно'
    });
  } catch (error: any) {
    console.error('❌ Ошибка получения отношений:', error.message);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения отношений',
      error: error.message
    });
  }
};
