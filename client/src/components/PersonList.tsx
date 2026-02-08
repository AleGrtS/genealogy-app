import React, { useState, useEffect } from 'react';
import type { Person } from '../services/api';
import PhotoUpload from './PhotoUpload';
import { useMobile } from '../hooks/useMobile';
import config from '../config';

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
  const { isMobile } = useMobile();

  // Загружаем фото для каждого человека
  useEffect(() => {
    persons.forEach(person => {
      loadPersonPhoto(person.id);
    });
  }, [persons]);

  const loadPersonPhoto = async (personId: number) => {
    try {
      setLoadingPhotos(prev => ({ ...prev, [personId]: true }));
      
      // Используем config.API_URL
      const response = await fetch(`${config.API_URL}/photos/${personId}`);
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
        padding: isMobile ? '30px 15px' : '50px',
        background: '#f5f5f5',
        borderRadius: '8px',
        fontSize: isMobile ? '16px' : '18px'
      }}>
        <p>Ничего не найдено</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: isMobile ? '15px' : '20px',
        padding: isMobile ? '5px' : '0'
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
                padding: isMobile ? '15px' : '20px',
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                ...(isMobile ? { marginBottom: '5px' } : {})
              }}
            >
              {/* Фото профиля */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '15px' : '20px',
                marginBottom: isMobile ? '15px' : '20px'
              }}>
                <div style={{
                  width: isMobile ? '70px' : '90px',
                  height: isMobile ? '70px' : '90px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '3px solid #4CAF50',
                  position: 'relative',
                  background: '#f0f0f0',
                  flexShrink: 0
                }}>
                  {isLoading ? (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f0f0f0',
                      fontSize: isMobile ? '20px' : '24px'
                    }}>
                      ⏳
                    </div>
                  ) : hasPhoto ? (
                    <img
                      // Используем config.UPLOADS_URL
                      src={`${config.UPLOADS_URL}/photos/${hasPhoto}`}
                      alt={person.firstName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '35px' : '45px',
                      color: '#999',
                      background: '#e0e0e0'
                    }}>
                      {person.gender === 'male' ? '👨' : person.gender === 'female' ? '👩' : '👤'}
                    </div>
                  )}
                  
                  {/* Кнопка добавления фото */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonForPhoto(person);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: isMobile ? '28px' : '32px',
                      height: isMobile ? '28px' : '32px',
                      borderRadius: '50%',
                      background: '#4CAF50',
                      color: 'white',
                      border: '2px solid white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '14px' : '16px',
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
                      width: isMobile ? '22px' : '25px',
                      height: isMobile ? '22px' : '25px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: 'bold',
                      border: '2px solid white'
                    }}>
                      {photoCount}
                    </div>
                  )}
                </div>

                {/* Имя и основные кнопки на мобильных */}
                {isMobile ? (
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 5px 0',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {person.firstName} {person.lastName}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(person);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          flex: 1
                        }}
                      >
                        ✏️ Редактировать
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Удалить ${person.firstName} ${person.lastName}?`)) {
                            onDelete(person.id);
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          flex: 1
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>
                      {person.firstName} {person.lastName}
                    </h3>
                  </div>
                )}
              </div>

              {/* Информация о человеке */}
              <div style={{ 
                fontSize: isMobile ? '14px' : '15px', 
                color: '#555',
                borderTop: '1px solid #eee',
                paddingTop: isMobile ? '12px' : '15px'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                  gap: isMobile ? '8px' : '12px'
                }}>
                  <div>
                    <span style={{ color: '#777', fontSize: isMobile ? '13px' : '14px' }}>ID:</span>{' '}
                    <span style={{ fontWeight: '500' }}>{person.id}</span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#777', fontSize: isMobile ? '13px' : '14px' }}>Пол:</span>{' '}
                    <span style={{ fontWeight: '500' }}>
                      {person.gender === 'male' ? '♂ Мужской' : 
                       person.gender === 'female' ? '♀ Женский' : 'Не указан'}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#777', fontSize: isMobile ? '13px' : '14px' }}>Статус:</span>{' '}
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: person.isAlive ? '#e8f5e9' : '#ffebee',
                      color: person.isAlive ? '#2e7d32' : '#c62828',
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: '500'
                    }}>
                      {person.isAlive ? 'Жив/а' : 'Умер/ла'}
                    </span>
                  </div>
                  
                  {person.birthDate && (
                    <div>
                      <span style={{ color: '#777', fontSize: isMobile ? '13px' : '14px' }}>Родился:</span>{' '}
                      <span style={{ fontWeight: '500' }}>{new Date(person.birthDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {person.birthPlace && (
                    <div style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
                      <span style={{ color: '#777', fontSize: isMobile ? '13px' : '14px' }}>Место рождения:</span>{' '}
                      <span style={{ fontWeight: '500' }}>{person.birthPlace}</span>
                    </div>
                  )}
                  
                  {person.deathDate && (
                    <div>
                      <span style={{ color: '#777', fontSize: isMobile ? '13px' : '14px' }}>Умер:</span>{' '}
                      <span style={{ fontWeight: '500' }}>{new Date(person.deathDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Кнопки для десктопа */}
              {!isMobile && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(person);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Редактировать"
                  >
                    ✏️ Ред.
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Удалить ${person.firstName} ${person.lastName}?`)) {
                        onDelete(person.id);
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Удалить"
                  >
                    🗑️ Уд.
                  </button>
                </div>
              )}
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
