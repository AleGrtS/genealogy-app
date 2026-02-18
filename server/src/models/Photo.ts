import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Person from './Person';

class Photo extends Model {
  public id!: string;
  public personId!: number;
  public filename!: string;
  public originalName!: string;
  public path!: string;
  public thumbnailPath!: string;
  public size!: number;
  public mimeType!: string;
  public isMain!: boolean;
  public caption?: string;
  public uploadedAt!: Date;
}

Photo.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  personId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'persons',  // Используем строку вместо Person
      key: 'id',
    },
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  thumbnailPath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isMain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  caption: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  tableName: 'photos',
  timestamps: true,
});

export default Photo;
