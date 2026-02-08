import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Person from './Person';

// Типы отношений
export type RelationshipType = 'parent' | 'spouse' | 'child' | 'sibling';

class Relationship extends Model {
  public id!: number;
  public person1Id!: number;
  public person2Id!: number;
  public type!: RelationshipType;
  public startDate?: Date;
  public endDate?: Date;
  public notes?: string;
  
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Relationship.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  person1Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Person,
      key: 'id',
    },
  },
  person2Id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Person,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('parent', 'spouse', 'child', 'sibling'),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'relationships',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['person1Id', 'person2Id', 'type'],
    },
  ],
});

// Устанавливаем связи между моделями
Person.hasMany(Relationship, { foreignKey: 'person1Id', as: 'outgoingRelationships' });
Person.hasMany(Relationship, { foreignKey: 'person2Id', as: 'incomingRelationships' });
Relationship.belongsTo(Person, { foreignKey: 'person1Id', as: 'person1' });
Relationship.belongsTo(Person, { foreignKey: 'person2Id', as: 'person2' });

export default Relationship;
