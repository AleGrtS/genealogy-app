import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { Person, personApi } from '../services/api';

interface PersonListProps {
  persons: Person[];
  onRefresh: () => void;
}

const PersonList: React.FC<PersonListProps> = ({ persons, onRefresh }) => {
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleAddTestPerson = async () => {
    try {
      await personApi.create({
        firstName: 'Новый',
        lastName: 'Человек',
        gender: 'unknown',
        isAlive: true,
      });
      onRefresh();
    } catch (error) {
      console.error('Error adding person:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить этого человека?')) {
      try {
        setDeleting(id);
        await personApi.delete(id);
        onRefresh();
      } catch (error) {
        console.error('Error deleting person:', error);
      } finally {
        setDeleting(null);
      }
    }
  };

  const getGenderText = (gender?: string) => {
    switch (gender) {
      case 'male': return '♂ Мужской';
      case 'female': return '♀ Женский';
      default: return 'Не указан';
    }
  };

  const getGenderColor = (gender?: string) => {
    switch (gender) {
      case 'male': return 'primary';
      case 'female': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Список людей</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddTestPerson}
          sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
        >
          Добавить тестового
        </Button>
      </Box>

      {persons.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            База данных пуста
          </Typography>
          <Typography color="text.secondary">
            Нажмите кнопку выше, чтобы добавить первого человека
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>ФИО</strong></TableCell>
                <TableCell><strong>Пол</strong></TableCell>
                <TableCell><strong>Дата рождения</strong></TableCell>
                <TableCell><strong>Место рождения</strong></TableCell>
                <TableCell><strong>Статус</strong></TableCell>
                <TableCell><strong>Добавлен</strong></TableCell>
                <TableCell><strong>Действия</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {persons.map((person) => (
                <TableRow key={person.id} hover>
                  <TableCell>{person.id}</TableCell>
                  <TableCell>
                    <Typography fontWeight="medium">
                      {person.lastName} {person.firstName} {person.middleName || ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getGenderText(person.gender)}
                      color={getGenderColor(person.gender) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {person.birthDate ? new Date(person.birthDate).toLocaleDateString('ru-RU') : '-'}
                  </TableCell>
                  <TableCell>{person.birthPlace || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={person.isAlive ? 'Жив' : 'Умер'}
                      color={person.isAlive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(person.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(person.id)}
                      disabled={deleting === person.id}
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
    </Box>
  );
};

export default PersonList;
