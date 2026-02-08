import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== ТИПЫ =====
export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  biography?: string;
  isAlive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RelationshipType = 'parent' | 'spouse' | 'child' | 'sibling';

export interface Relationship {
  id: number;
  person1Id: number;
  person2Id: number;
  type: RelationshipType;
  startDate?: string;
  endDate?: string;
  notes?: string;
  person2?: Person;
  person1?: Person;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

// ===== API ДЛЯ ЛЮДЕЙ =====
export const personApi = {
  getAll: () => api.get<ApiResponse<Person[]>>('/persons'),
  getById: (id: number) => api.get<ApiResponse<Person>>(`/persons/${id}`),
  create: (personData: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Person>>('/persons', personData),
  update: (id: number, personData: Partial<Person>) => 
    api.put<ApiResponse<Person>>(`/persons/${id}`, personData),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/persons/${id}`),
};

// ===== API ДЛЯ ОТНОШЕНИЙ =====
export const relationshipApi = {
  getAll: () => api.get<ApiResponse<Relationship[]>>('/relationships'),
  getByPersonId: (personId: number) => 
    api.get<ApiResponse<Relationship[]>>(`/relationships/person/${personId}`),
  create: (relationshipData: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Relationship>>('/relationships', relationshipData),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/relationships/${id}`),
};

// Экспортируем всё явно для избежания ошибок
export default api;
export type { Person, Relationship, RelationshipType, ApiResponse };
