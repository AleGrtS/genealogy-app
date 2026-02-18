import React, { useState, useEffect, useRef } from 'react';
import type { Person } from '../services/api';

const API_URL = 'http://localhost:3001/api';
const UPLOADS_URL = 'http://localhost:3001/uploads';

interface Photo {
  id: string;
  personId: number;
  filename: string;
  thumbnailPath: string;
  isMain: boolean;
  caption?: string;
}

interface PhotoUploadProps {
  person: Person;
  onClose: () => void;
  onUploadComplete: () => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ person, onClose, onUploadComplete }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📸 Загрузка фото для person:', person.id);
      
      const response = await fetch(`${API_URL}/photos/${person.id}`);
      console.log('📸 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📸 Response data:', data);
      
      if (data.success) {
        setPhotos(data.data);
      } else {
        setError('Ошибка загрузки списка фото');
      }
    } catch (err: any) {
      console.error('📸 Ошибка загрузки фото:', err);
      setError('Ошибка подключения к серверу: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (person) {
      loadPhotos();
    }
  }, [person]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const file = files[0];
    console.log('📸 Выбран файл:', file.name, file.size, file.type);

    const formData = new FormData();
    formData.append('photo', file);
    
    const caption = prompt('Введите описание фото (необязательно):');
    if (caption) formData.append('caption', caption);

    try {
      console.log('📸 Отправка файла на сервер...');
      console.log('📸 URL:', `${API_URL}/photos/${person.id}`);
      
      const response = await fetch(`${API_URL}/photos/${person.id}`, {
        method: 'POST',
        body: formData
      });

      console.log('📸 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📸 Response data:', data);
      
      if (data.success) {
        await loadPhotos();
        onUploadComplete(); // Сообщаем родительскому компоненту об обновлении
        alert('Фото успешно загружено!');
      } else {
        setError(data.message || 'Ошибка загрузки');
      }
    } catch (err: any) {
      console.error('📸 Ошибка загрузки:', err);
      setError('Ошибка загрузки: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm('Удалить это фото?')) return;

    try {
      console.log('📸 Удаление фото:', photoId);
      const response = await fetch(`${API_URL}/photos/${photoId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      console.log('📸 Response:', data);
      
      if (data.success) {
        await loadPhotos();
        onUploadComplete();
      } else {
        setError(data.message || 'Ошибка удаления');
      }
    } catch (err: any) {
      console.error('📸 Ошибка удаления:', err);
      setError('Ошибка удаления: ' + err.message);
    }
  };

  const handleSetMain = async (photoId: string) => {
    try {
      console.log('📸 Установка главного фото:', photoId);
      const response = await fetch(`${API_URL}/photos/${photoId}/main`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: person.id })
      });
      
      const data = await response.json();
      console.log('📸 Response:', data);
      
      if (data.success) {
        await loadPhotos();
        onUploadComplete();
      } else {
        setError(data.message || 'Ошибка установки главного фото');
      }
    } catch (err: any) {
      console.error('📸 Ошибка установки главного:', err);
      setError('Ошибка установки главного фото: ' + err.message);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflowY: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px'
        }}>
          <h2>📸 Фото: {person.firstName} {person.lastName}</h2>
          <button 
            onClick={onClose} 
            style={{ 
              fontSize: '20px', 
              cursor: 'pointer',
              background: 'none',
              border: 'none',
              padding: '5px 10px'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '10px', 
            padding: '10px', 
            background: '#ffeeee',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          border: '2px dashed #4CAF50',
          padding: '30px',
          textAlign: 'center',
          marginBottom: '20px',
          cursor: 'pointer',
          borderRadius: '8px',
          background: '#f9f9f9'
        }} onClick={() => fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <div>⏳ Загрузка...</div>
          ) : (
            <div>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
              <div>Нажмите для выбора фото</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                JPG, PNG, GIF, WEBP до 10MB
              </div>
            </div>
          )}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Загрузка списка фото...</div>}

        {photos.length === 0 && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            У этого человека пока нет фотографий
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
          gap: '10px' 
        }}>
          {photos.map(photo => (
            <div key={photo.id} style={{ 
              border: photo.isMain ? '3px solid #4CAF50' : '1px solid #ddd', 
              padding: '5px', 
              position: 'relative',
              borderRadius: '4px'
            }}>
              <img 
                src={`${UPLOADS_URL}/photos/${photo.filename}`}
                style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                alt=""
                onError={(e) => {
                  console.log('Ошибка загрузки изображения');
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div style={{ 
                display: 'flex', 
                gap: '5px', 
                marginTop: '5px',
                justifyContent: 'center'
              }}>
                {!photo.isMain && (
                  <button 
                    onClick={() => handleSetMain(photo.id)}
                    style={{
                      padding: '5px 10px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ★
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(photo.id)}
                  style={{
                    padding: '5px 10px',
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🗑️
                </button>
              </div>
              {photo.isMain && (
                <span style={{ 
                  position: 'absolute', 
                  top: '5px', 
                  left: '5px', 
                  background: '#4CAF50', 
                  color: 'white', 
                  padding: '2px 5px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  Главное
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;
