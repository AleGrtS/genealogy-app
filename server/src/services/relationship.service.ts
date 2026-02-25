import { Op } from 'sequelize';
import Person from '../models/Person';
import Relationship from '../models/Relationship';

export type RelationType = 
  | 'self'
  | 'parent' | 'child' 
  | 'grandparent' | 'grandchild'
  | 'spouse'
  | 'sibling'
  | 'aunt_uncle' | 'niece_nephew'
  | 'cousin' | 'second_cousin'
  | 'great_grandparent' | 'great_grandchild'
  | 'friend'
  | 'unknown';

export interface RelationInfo {
  type: RelationType;
  degree: number;
  path?: number[];
  description: string;
}

class RelationshipService {
  
  async getAllRelatives(personId: number): Promise<Map<number, RelationInfo>> {
    const relatives = new Map<number, RelationInfo>();
    
    relatives.set(personId, {
      type: 'self',
      degree: 0,
      description: 'Сам человек'
    });
    
    await this.findRelativesBFS(personId, relatives);
    
    return relatives;
  }

  private async findRelativesBFS(startPersonId: number, relatives: Map<number, RelationInfo>): Promise<void> {
    const queue: { personId: number; path: number[] }[] = [{ personId: startPersonId, path: [startPersonId] }];
    const visited = new Set<number>();
    visited.add(startPersonId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      const relationships = await Relationship.findAll({
        where: {
          [Op.or]: [
            { person1Id: current.personId },
            { person2Id: current.personId }
          ]
        }
      });

      for (const rel of relationships) {
        const otherPersonId = rel.person1Id === current.personId ? rel.person2Id : rel.person1Id;
        
        if (!visited.has(otherPersonId)) {
          visited.add(otherPersonId);
          
          const newPath = [...current.path, otherPersonId];
          const relationInfo = await this.determineRelation(startPersonId, otherPersonId, newPath);
          
          if (relationInfo) {
            relatives.set(otherPersonId, relationInfo);
            queue.push({ personId: otherPersonId, path: newPath });
          }
        }
      }
    }
  }

  async determineRelation(person1Id: number, person2Id: number, path?: number[]): Promise<RelationInfo | null> {
    if (person1Id === person2Id) {
      return {
        type: 'self',
        degree: 0,
        description: 'Сам человек'
      };
    }

    let finalPath = path;
    if (!finalPath) {
      const foundPath = await this.findPath(person1Id, person2Id);
      if (foundPath) {
        finalPath = foundPath;
      } else {
        return null;
      }
    }

    const degree = finalPath.length - 1;
    
    // Проверяем, есть ли прямое отношение 'friend'
    const directRel = await this.getRelationship(person1Id, person2Id);
    if (directRel && directRel.type === 'friend') {
      return {
        type: 'friend',
        degree: 1,
        path: finalPath,
        description: 'Знакомый/Знакомая'
      };
    }
    
    const relationType = await this.analyzePath(person1Id, person2Id, finalPath);
    const description = this.generateDescription(relationType, degree, finalPath);
    
    return {
      type: relationType,
      degree,
      path: finalPath,
      description
    };
  }

  private async findPath(startId: number, targetId: number): Promise<number[] | null> {
    const queue: { personId: number; path: number[] }[] = [{ personId: startId, path: [startId] }];
    const visited = new Set<number>();
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      const relationships = await Relationship.findAll({
        where: {
          [Op.or]: [
            { person1Id: current.personId },
            { person2Id: current.personId }
          ]
        }
      });

      for (const rel of relationships) {
        const nextId = rel.person1Id === current.personId ? rel.person2Id : rel.person1Id;
        
        if (nextId === targetId) {
          return [...current.path, targetId];
        }
        
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({ personId: nextId, path: [...current.path, nextId] });
        }
      }
    }
    
    return null;
  }

  private async analyzePath(person1Id: number, person2Id: number, path: number[]): Promise<RelationType> {
    const length = path.length - 1;
    
    if (length === 1) {
      const rel = await this.getRelationship(path[0], path[1]);
      return rel?.type === 'parent' ? 'child' : (rel?.type as RelationType) || 'unknown';
    }
    
    if (length === 2) {
      const rel1 = await this.getRelationship(path[0], path[1]);
      const rel2 = await this.getRelationship(path[1], path[2]);
      
      if (rel1?.type === 'parent' && rel2?.type === 'parent') {
        return 'grandparent';
      }
      if (rel1?.type === 'child' && rel2?.type === 'parent') {
        return 'aunt_uncle';
      }
    }
    
    if (length === 3) {
      const rel1 = await this.getRelationship(path[0], path[1]);
      const rel2 = await this.getRelationship(path[2], path[3]);
      const relMiddle1 = await this.getRelationship(path[1], path[2]);
      const relMiddle2 = await this.getRelationship(path[2], path[1]);
      
      if ((rel1?.type === 'child' || rel1?.type === 'parent') && 
          (rel2?.type === 'child' || rel2?.type === 'parent') &&
          (relMiddle1?.type === 'sibling' || relMiddle2?.type === 'sibling')) {
        return 'cousin';
      }
    }
    
    return 'unknown';
  }

  private async getRelationship(person1Id: number, person2Id: number): Promise<Relationship | null> {
    return await Relationship.findOne({
      where: {
        [Op.or]: [
          { person1Id, person2Id },
          { person1Id: person2Id, person2Id: person1Id }
        ]
      }
    });
  }

  private getReverseType(type: string): string {
    const reverseMap: Record<string, string> = {
      'parent': 'child',
      'child': 'parent',
      'spouse': 'spouse',
      'sibling': 'sibling',
      'grandparent': 'grandchild',
      'grandchild': 'grandparent',
      'aunt_uncle': 'niece_nephew',
      'niece_nephew': 'aunt_uncle',
      'cousin': 'cousin',
      'friend': 'friend'  // Добавили friend
    };
    return reverseMap[type] || type;
  }

  private generateDescription(type: RelationType, degree: number, path: number[]): string {
    switch (type) {
      case 'parent': return 'Родитель';
      case 'child': return 'Ребенок';
      case 'grandparent': return 'Дедушка/Бабушка';
      case 'grandchild': return 'Внук/Внучка';
      case 'spouse': return 'Супруг(а)';
      case 'sibling': return 'Брат/Сестра';
      case 'aunt_uncle': return 'Тетя/Дядя';
      case 'niece_nephew': return 'Племянник/Племянница';
      case 'cousin': return 'Двоюродный(ая) брат/сестра';
      case 'second_cousin': return 'Троюродный(ая) брат/сестра';
      case 'friend': return 'Знакомый/Знакомая';
      default: return `Родственник (${degree} степень)`;
    }
  }
}

export default new RelationshipService();
