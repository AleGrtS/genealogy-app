import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

// Упрощенный класс без сложных интерфейсов
class Person extends Model {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public middleName?: string;
  public gender?: string;
  public birthDate?: Date;
  public birthPlace?: string;
  public deathDate?: Date;
  public deathPlace?: string;
  public biography?: string;
  public isAlive!: boolean;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Person.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  middleName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'unknown',
  },
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  birthPlace: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deathDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  deathPlace: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  biography: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isAlive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  tableName: 'persons',
  timestamps: true,
});

export default Person;
