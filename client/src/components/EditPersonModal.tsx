import { useState, useEffect } from 'react';
import type { Person } from '../services/api';
import { personApi } from '../services/api';

interface EditPersonModalProps {
  person: Person | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditPersonModal: React.FC<EditPersonModalProps> = ({ 
  person, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<Partial<Person>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Инициализация формы данными человека
  useEffect(() => {
    if (person) {
      setFormData({
        firstName: person.firstName || '',
        lastName: person.lastName || '',
        middleName: person.middleName || '',
        gender: person.gender || 'unknown',
        birthDate: person.birthDate ? person.birthDate.split('T')[0] : '',
        birthPlace: person.birthPlace || '',
        deathDate: person.deathDate ? person.deathDate.split('T')[0] : '',
        deathPlace: person.deathPlace || '',
        biography: person.biography || '',
        isAlive: person.isAlive,
      });
      setError(null);
    }
  }, [person]);

  if (!isOpen || !person) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Конвертируем пустые строки в undefined
      const dataToSend = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key, 
          value === '' ? undefined : value
        ])
      ) as Partial<Person>;

      await personApi.update(person.id, dataToSend);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ошибка обновления');
      console.error('Ошибка обновления:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value === '' ? undefined : value
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '15px',
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            ✏️ Редактировать: {person.firstName} {person.lastName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px 15px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2',
          }}>
            <strong>Ошибка:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}>
            {/* Основная информация */}
            <div style={{ gridColumn: 'span 2' }}>
              <h3 style={{ marginBottom: '15px', color: '#555' }}>Основная информация</h3>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Имя *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Фамилия *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Отчество
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Пол
              </label>
              <select
                name="gender"
                value={formData.gender || 'unknown'}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                }}
              >
                <option value="unknown">Не указан</option>
                <option value="male">♂ Мужской</option>
                <option value="female">♀ Женский</option>
                <option value="other">Другой</option>
              </select>
            </div>

            {/* Даты */}
            <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
              <h3 style={{ marginBottom: '15px', color: '#555' }}>Даты и места</h3>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Дата рождения
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Место рождения
              </label>
              <input
                type="text"
                name="birthPlace"
                value={formData.birthPlace || ''}
                onChange={handleChange}
                placeholder="Город, страна"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Дата смерти
              </label>
              <input
                type="date"
                name="deathDate"
                value={formData.deathDate || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Место смерти
              </label>
              <input
                type="text"
                name="deathPlace"
                value={formData.deathPlace || ''}
                onChange={handleChange}
                placeholder="Город, страна"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                }}
              />
            </div>

            {/* Статус */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  name="isAlive"
                  checked={formData.isAlive || false}
                  onChange={(e) => setFormData({...formData, isAlive: e.target.checked})}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: 'bold' }}>Жив/а</span>
              </label>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                Если не отмечено, система будет считать человека умершим
              </p>
            </div>

            {/* Биография */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Биография
              </label>
              <textarea
                name="biography"
                value={formData.biography || ''}
                onChange={handleChange}
                rows={4}
                placeholder="Расскажите о жизни человека..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            borderTop: '1px solid #f0f0f0',
            paddingTop: '20px',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#999' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '20px',
          paddingTop: '15px',
          borderTop: '1px solid #f0f0f0',
          fontSize: '12px',
          color: '#888',
        }}>
          <p><strong>ID:</strong> {person.id}</p>
          <p><strong>Создан:</strong> {new Date(person.createdAt).toLocaleString('ru-RU')}</p>
          {person.updatedAt !== person.createdAt && (
            <p><strong>Обновлен:</strong> {new Date(person.updatedAt).toLocaleString('ru-RU')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditPersonModal;
