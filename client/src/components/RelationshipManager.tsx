import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Delete, FamilyRestroom } from '@mui/icons-material';
import { Person, Relationship, relationshipApi, personApi } from '../services/api';

interface RelationshipManagerProps {
  persons: Person[];
  onRelationshipCreated?: () => void;
}

const RelationshipManager: React.FC<RelationshipManagerProps> = ({ persons, onRelationshipCreated }) => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    person1Id: '',
    person2Id: '',
    type: 'parent' as const,
  });

  useEffect(() => {
    loadRelationships();
  }, []);

  const loadRelationships = async () => {
    try {
      setLoading(true);
      const response = await relationshipApi.getAll();
      if (response.data.success) {
        setRelationships(response.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки отношений');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.person1Id || !formData.person2Id) {
      setError('Выберите обоих людей');
      return;
    }

    if (formData.person1Id === formData.person2Id) {
      setError('Нельзя создать отношение человека с самим собой');
      return;
    }

    try {
      setError(null);
      await relationshipApi.create({
        person1Id: parseInt(formData.person1Id),
        person2Id: parseInt(formData.person2Id),
        type: formData.type,
      });
      
      // Сброс формы
      setFormData({
        person1Id: '',
        person2Id: '',
        type: 'parent',
      });
      
      // Обновление списка
      loadRelationships();
      
      if (onRelationshipCreated) {
        onRelationshipCreated();
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка создания отношения');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить это отношение?')) {
      try {
        await relationshipApi.delete(id);
        loadRelationships();
      } catch (err: any) {
        setError(err.message || 'Ошибка удаления');
      }
    }
  };

  const getRelationshipText = (type: string) => {
    switch (type) {
      case 'parent': return 'Родитель → Ребенок';
      case 'child': return 'Ребенок → Родитель';
      case 'spouse': return 'Супруг(а)';
      case 'sibling': return 'Брат/Сестра';
      default: return type;
    }
  };

  const getPersonName = (id: number) => {
    const person = persons.find(p => p.id === id);
    return person ? `${person.firstName} ${person.lastName}` : `ID: ${id}`;
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FamilyRestroom /> Семейные отношения
      </Typography>

      {/* Форма создания отношения */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Добавить новое отношение</Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' }, gap: 2, alignItems: 'end' }}>
            <FormControl fullWidth>
              <InputLabel>Первый человек</InputLabel>
              <Select
                value={formData.person1Id}
                label="Первый человек"
                onChange={(e) => setFormData({ ...formData, person1Id: e.target.value })}
                required
              >
                <MenuItem value="">Выберите человека</MenuItem>
                {persons.map(person => (
                  <MenuItem key={person.id} value={person.id}>
                    {person.firstName} {person.lastName} (ID: {person.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Тип отношения</InputLabel>
              <Select
                value={formData.type}
                label="Тип отношения"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
              >
                <MenuItem value="parent">Родитель → Ребенок</MenuItem>
                <MenuItem value="spouse">Супруг(а)</MenuItem>
                <MenuItem value="sibling">Брат/Сестра</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Второй человек</InputLabel>
              <Select
                value={formData.person2Id}
                label="Второй человек"
                onChange={(e) => setFormData({ ...formData, person2Id: e.target.value })}
                required
              >
                <MenuItem value="">Выберите человека</MenuItem>
                {persons
                  .filter(person => person.id.toString() !== formData.person1Id)
                  .map(person => (
                    <MenuItem key={person.id} value={person.id}>
                      {person.firstName} {person.lastName} (ID: {person.id})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Button type="submit" variant="contained" sx={{ height: '56px' }}>
              Создать
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Список отношений */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Существующие отношения ({relationships.length})
        </Typography>

        {relationships.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Еще нет созданных отношений. Добавьте первое отношение выше.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Первый человек</TableCell>
                  <TableCell>Отношение</TableCell>
                  <TableCell>Второй человек</TableCell>
                  <TableCell>Создано</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relationships.map(relationship => (
                  <TableRow key={relationship.id}>
                    <TableCell>{relationship.id}</TableCell>
                    <TableCell>
                      {relationship.person1 ? 
                        `${relationship.person1.firstName} ${relationship.person1.lastName}` : 
                        getPersonName(relationship.person1Id)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getRelationshipText(relationship.type)} 
                        size="small"
                        color={
                          relationship.type === 'parent' ? 'primary' :
                          relationship.type === 'spouse' ? 'secondary' :
                          relationship.type === 'sibling' ? 'info' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {relationship.person2 ? 
                        `${relationship.person2.firstName} ${relationship.person2.lastName}` : 
                        getPersonName(relationship.person2Id)}
                    </TableCell>
                    <TableCell>
                      {new Date(relationship.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(relationship.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default RelationshipManager;
