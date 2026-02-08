import React, { useState, useEffect, useRef } from 'react';
import type { Person } from '../services/api';
import config from '../config';

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
      
      const response = await fetch(`${config.API_URL}/photos/${person.id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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

    const formData = new FormData();
    formData.append('photo', file);
    
    const caption = prompt('Введите описание фото (необязательно):');
    if (caption) formData.append('caption', caption);

    try {
      const response = await fetch(`${config.API_URL}/photos/${person.id}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await loadPhotos();
        onUploadComplete();
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
      const response = await fetch(`${config.API_URL}/photos/${photoId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadPhotos();
        onUploadComplete();
      } else {
        setError(data.message || 'Ошибка удаления');
      }
    } catch (err: any) {
      console.error('Ошибка удаления:', err);
      setError('Ошибка удаления: ' + err.message);
    }
  };

  const handleSetMain = async (photoId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/photos/${photoId}/main`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: person.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadPhotos();
        onUploadComplete();
      } else {
        setError(data.message || 'Ошибка установки главного фото');
      }
    } catch (err: any) {
      console.error('Ошибка установки главного:', err);
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
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '25px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '15px'
        }}>
          <h2 style={{ margin: 0 }}>
            📸 Фотографии: {person.firstName} {person.lastName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#666',
              padding: '0 10px'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2'
          }}>
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        <div style={{
          border: '2px dashed #4CAF50',
          borderRadius: '10px',
          padding: '30px',
          textAlign: 'center',
          marginBottom: '25px',
          background: '#f9f9f9',
          transition: 'background 0.3s',
          cursor: 'pointer'
        }}
        onClick={() => fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <div>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
              <p>Загрузка...</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📸</div>
              <p style={{ fontSize: '16px', marginBottom: '5px' }}>
                <strong>Нажмите для выбора фото</strong>
              </p>
              <p style={{ color: '#666', fontSize: '14px' }}>
                Поддерживаются: JPG, PNG, GIF, WEBP (до 10MB)
              </p>
            </>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <p>Загрузка фотографий...</p>
          </div>
        ) : photos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#666' }}>У этого человека пока нет фотографий</p>
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: '15px' }}>
              Загруженные фото ({photos.length})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '15px'
            }}>
              {photos.map(photo => (
                <div
                  key={photo.id}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: photo.isMain ? '3px solid #4CAF50' : '1px solid #ddd',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <img
                    src={`${config.UPLOADS_URL}/photos/${photo.filename}`}
                    alt={photo.caption || 'Фото'}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.error('Ошибка загрузки изображения:', `${config.UPLOADS_URL}/photos/${photo.filename}`);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    padding: '10px',
                    display: 'flex',
                    gap: '5px',
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
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Сделать главным"
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
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                  
                  {photo.isMain && (
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      left: '5px',
                      background: '#4CAF50',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>
                      Главное
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ✅ ВАЖНО: добавляем export default в конце файла
export default PhotoUpload;
