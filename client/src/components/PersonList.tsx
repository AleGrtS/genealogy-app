import React, { useState, useEffect } from 'react';
import type { Person } from '../services/api';
import PhotoUpload from './PhotoUpload';

const API_URL = 'http://localhost:3001/api';
const UPLOADS_URL = 'http://localhost:3001/uploads';

interface PersonListProps {
  persons: Person[];
  onEdit: (person: Person) => void;
  onDelete: (id: number) => void;
  onRefresh?: () => void;
}

const PersonList: React.FC<PersonListProps> = ({ 
  persons, 
  onEdit, 
  onDelete,
  onRefresh 
}) => {
  const [selectedPersonForPhoto, setSelectedPersonForPhoto] = useState<Person | null>(null);
  const [personPhotos, setPersonPhotos] = useState<Record<number, { mainPhoto?: string, count: number }>>({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<number, boolean>>({});

  // Загружаем главное фото для каждого человека
  const loadPersonPhoto = async (personId: number) => {
    try {
      setLoadingPhotos(prev => ({ ...prev, [personId]: true }));
      
      const response = await fetch(`${API_URL}/photos/${personId}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const mainPhoto = data.data.find((p: any) => p.isMain) || data.data[0];
        setPersonPhotos(prev => ({
          ...prev,
          [personId]: {
            mainPhoto: mainPhoto.filename,
            count: data.data.length
          }
        }));
      } else {
        setPersonPhotos(prev => ({
          ...prev,
          [personId]: { count: 0 }
        }));
      }
    } catch (error) {
      console.error(`Ошибка загрузки фото для person ${personId}:`, error);
    } finally {
      setLoadingPhotos(prev => ({ ...prev, [personId]: false }));
    }
  };

  // Загружаем фото для всех людей при монтировании и при обновлении списка
  useEffect(() => {
    persons.forEach(person => {
      loadPersonPhoto(person.id);
    });
  }, [persons]);

  // Функция для обновления фото после загрузки
  const handlePhotoUploadComplete = () => {
    if (selectedPersonForPhoto) {
      loadPersonPhoto(selectedPersonForPhoto.id);
    }
    if (onRefresh) {
      onRefresh();
    }
  };

  if (persons.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        background: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <p>Ничего не найдено</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {persons.map(person => {
          const photo = personPhotos[person.id];
          const hasPhoto = photo?.mainPhoto;
          const photoCount = photo?.count || 0;
          const isLoading = loadingPhotos[person.id];

          return (
            <div
              key={person.id}
              style={{
                padding: '15px',
                background: '#f5f5f5',
                borderRadius: '8px',
                border: '1px solid #ddd',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Фото */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: '10px',
                border: '2px solid #4CAF50',
                position: 'relative',
                background: '#e0e0e0'
              }}>
                {isLoading ? (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f0f0'
                  }}>
                    ⏳
                  </div>
                ) : hasPhoto ? (
                  <img
                    src={`${UPLOADS_URL}/photos/${hasPhoto}`}
                    alt={person.firstName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      console.log('Ошибка загрузки изображения, показываем заглушку');
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px;">
                          ${person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: '#999'
                  }}>
                    {person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                  </div>
                )}
                
                {/* Кнопка добавления фото */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Клик по иконке фото для человека:', person);
                    setSelectedPersonForPhoto(person);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  title={photoCount > 0 ? `Добавить еще (${photoCount} фото)` : "Добавить фото"}
                >
                  {photoCount > 0 ? '📸+' : '📸'}
                </button>
                
                {/* Счетчик фото */}
                {photoCount > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: '#ff9800',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {photoCount}
                  </div>
                )}
              </div>

              {/* Кнопки редактирования/удаления */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                display: 'flex',
                gap: '5px'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(person);
                  }}
                  style={{
                    padding: '5px 10px',
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Удалить ${person.firstName} ${person.lastName}?`)) {
                      onDelete(person.id);
                    }
                  }}
                  style={{
                    padding: '5px 10px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>

              <h3 style={{ marginBottom: '10px', paddingRight: '80px' }}>
                {person.firstName} {person.middleName || ''} {person.lastName}
              </h3>
              
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>ID:</strong> {person.id}
                </p>
                
                <p style={{ margin: '5px 0' }}>
                  <strong>Пол:</strong> {
                    person.gender === 'male' ? '♂ Мужской' : 
                    person.gender === 'female' ? '♀ Женский' : 'Не указан'
                  }
                </p>
                
                <p style={{ margin: '5px 0' }}>
                  <strong>Статус:</strong> 
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: person.isAlive ? '#c8e6c9' : '#ffcdd2',
                    color: person.isAlive ? '#2e7d32' : '#c62828',
                    marginLeft: '8px',
                    fontSize: '12px'
                  }}>
                    {person.isAlive ? 'Жив/а' : 'Умер/ла'}
                  </span>
                </p>
                
                {person.birthDate && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>Родился:</strong> {new Date(person.birthDate).toLocaleDateString()}
                  </p>
                )}
                
                {person.birthPlace && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>Место рождения:</strong> {person.birthPlace}
                  </p>
                )}
                
                {person.deathDate && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>Умер:</strong> {new Date(person.deathDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Модальное окно загрузки фото */}
      {selectedPersonForPhoto && (
        <PhotoUpload
          person={selectedPersonForPhoto}
          onClose={() => setSelectedPersonForPhoto(null)}
          onUploadComplete={handlePhotoUploadComplete}
        />
      )}
    </>
  );
};

export default PersonList;
