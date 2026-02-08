import { Request, Response } from 'express';
import Person from '../models/Person';

// Получить всех людей
export const getAllPersons = async (req: Request, res: Response): Promise<void> => {
  try {
    const persons = await Person.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json({
      success: true,
      count: persons.length,
      data: persons,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных',
      error: error.message,
    });
  }
};

// Получить человека по ID
export const getPersonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const person = await Person.findByPk(id);
    
    if (!person) {
      res.status(404).json({
        success: false,
        message: 'Человек не найден',
      });
      return;
    }
    
    res.json({
      success: true,
      data: person,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения данных',
      error: error.message,
    });
  }
};

// Создать нового человека
export const createPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const personData = req.body;
    
    // Проверяем обязательные поля
    if (!personData.firstName || !personData.lastName) {
      res.status(400).json({
        success: false,
        message: 'Имя и фамилия обязательны',
      });
      return;
    }
    
    const person = await Person.create(personData);
    
    res.status(201).json({
      success: true,
      message: 'Человек создан успешно',
      data: person,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Ошибка создания человека',
      error: error.message,
    });
  }
};

// Обновить человека
export const updatePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('🔄 Обновление человека ID:', id, 'Данные:', updateData);
    
    const person = await Person.findByPk(id);
    
    if (!person) {
      res.status(404).json({
        success: false,
        message: 'Человек не найден',
      });
      return;
    }
    
    // Обновляем поля
    await person.update(updateData);
    
    // Получаем обновленную запись
    const updatedPerson = await Person.findByPk(id);
    
    res.json({
      success: true,
      message: 'Данные обновлены успешно',
      data: updatedPerson,
    });
  } catch (error: any) {
    console.error('❌ Ошибка обновления:', error.message);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления данных',
      error: error.message,
    });
  }
};

// Удалить человека
export const deletePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const person = await Person.findByPk(id);
    
    if (!person) {
      res.status(404).json({
        success: false,
        message: 'Человек не найден',
      });
      return;
    }
    
    await person.destroy();
    
    res.json({
      success: true,
      message: 'Человек удален успешно',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления',
      error: error.message,
    });
  }
};
