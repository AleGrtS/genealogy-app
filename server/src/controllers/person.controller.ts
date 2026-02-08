import { Request, Response } from 'express';
import Person from '../models/Person';

export const getAllPersons = async (req: Request, res: Response): Promise<void> => {
  try {
    const persons = await Person.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: persons.length,
      data: persons
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching persons',
      error: error.message
    });
  }
};

export const createPerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, gender, birthDate, birthPlace, biography } = req.body;
    
    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: 'First name and last name are required'
      });
      return;
    }
    
    const person = await Person.create({
      firstName,
      lastName,
      gender: gender || 'unknown',
      birthDate,
      birthPlace,
      biography,
      isAlive: true
    } as any); // Используем as any для обхода проверки типов
    
    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: person
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating person',
      error: error.message
    });
  }
};

export const getPersonById = async (req: Request, res: Response): Promise<void> => {
  try {
    const person = await Person.findByPk(req.params.id);
    
    if (!person) {
      res.status(404).json({
        success: false,
        message: 'Person not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: person
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error fetching person',
      error: error.message
    });
  }
};

export const updatePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const person = await Person.findByPk(req.params.id);
    
    if (!person) {
      res.status(404).json({
        success: false,
        message: 'Person not found'
      });
      return;
    }
    
    await person.update(req.body);
    
    res.json({
      success: true,
      message: 'Person updated successfully',
      data: person
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error updating person',
      error: error.message
    });
  }
};

export const deletePerson = async (req: Request, res: Response): Promise<void> => {
  try {
    const person = await Person.findByPk(req.params.id);
    
    if (!person) {
      res.status(404).json({
        success: false,
        message: 'Person not found'
      });
      return;
    }
    
    await person.destroy();
    
    res.json({
      success: true,
      message: 'Person deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error deleting person',
      error: error.message
    });
  }
};
