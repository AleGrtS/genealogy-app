import { Request, Response } from 'express';
import relationshipService from '../services/relationship.service';
import Person from '../models/Person';

export const getRelatives = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { degree } = req.query; // опционально: степень родства
    
    const person = await Person.findByPk(id);
    if (!person) {
      res.status(404).json({ success: false, message: 'Человек не найден' });
      return;
    }

    const relatives = await relationshipService.getAllRelatives(parseInt(id));
    
    // Конвертируем Map в объект для JSON
    const relativesObj: Record<string, any> = {};
    relatives.forEach((value, key) => {
      // Если указана степень, фильтруем
      if (degree && value.degree > parseInt(degree as string)) {
        return;
      }
      relativesObj[key] = value;
    });

    res.json({
      success: true,
      count: Object.keys(relativesObj).length,
      data: relativesObj
    });

  } catch (error: any) {
    console.error('Ошибка получения родственников:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения родственников',
      error: error.message
    });
  }
};

export const getRelation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { person1Id, person2Id } = req.params;

    const relation = await relationshipService.determineRelation(
      parseInt(person1Id), 
      parseInt(person2Id)
    );

    if (!relation) {
      res.json({
        success: true,
        message: 'Родственная связь не найдена',
        data: null
      });
      return;
    }

    res.json({
      success: true,
      data: relation
    });

  } catch (error: any) {
    console.error('Ошибка определения родства:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка определения родства',
      error: error.message
    });
  }
};

export const findPath = async (req: Request, res: Response): Promise<void> => {
  try {
    const { person1Id, person2Id } = req.params;

    const path = await relationshipService['findPath'](parseInt(person1Id), parseInt(person2Id));

    if (!path) {
      res.json({
        success: true,
        message: 'Путь не найден',
        data: null
      });
      return;
    }

    // Получаем информацию о каждом человеке в пути
    const pathWithPersons = await Promise.all(
      path.map(async (personId) => {
        const person = await Person.findByPk(personId, {
          attributes: ['id', 'firstName', 'lastName']
        });
        return person;
      })
    );

    res.json({
      success: true,
      data: {
        path: pathWithPersons,
        length: path.length - 1
      }
    });

  } catch (error: any) {
    console.error('Ошибка поиска пути:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка поиска пути',
      error: error.message
    });
  }
};
