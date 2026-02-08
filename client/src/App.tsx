import { useState, useEffect } from 'react';
import type { Person, Relationship } from './services/api';
import { personApi, relationshipApi } from './services/api';

function App() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'persons' | 'relationships'>('persons');
  
  // Форма для создания отношения
  const [newRelationship, setNewRelationship] = useState({
    person1Id: '',
    person2Id: '',
    type: 'parent' as 'parent' | 'spouse' | 'child' | 'sibling'
  });

  const loadData = async () => {
    try {
      console.log('Загрузка данных...');
      
      // Загружаем людей
      const personsResponse = await personApi.getAll();
      if (personsResponse.data.success) {
        setPersons(personsResponse.data.data);
      }
      
      // Загружаем отношения
      const relationshipsResponse = await relationshipApi.getAll();
      if (relationshipsResponse.data.success) {
        setRelationships(relationshipsResponse.data.data);
      }
      
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addTestPerson = async () => {
    try {
      const names = ['Иван', 'Мария', 'Алексей', 'Ольга', 'Дмитрий', 'Елена'];
      const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов'];
      
      const personData = {
        firstName: names[Math.floor(Math.random() * names.length)],
        lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
        gender: Math.random() > 0.5 ? 'male' : 'female',
        isAlive: true,
      };
      
      await personApi.create(personData);
      await loadData(); // Перезагружаем данные
      
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const createRelationship = async () => {
    if (!newRelationship.person1Id || !newRelationship.person2Id) {
      alert('Выберите обоих людей');
      return;
    }
    
    if (newRelationship.person1Id === newRelationship.person2Id) {
      alert('Нельзя создать отношение человека с самим собой');
      return;
    }
    
    try {
      await relationshipApi.create({
        person1Id: parseInt(newRelationship.person1Id),
        person2Id: parseInt(newRelationship.person2Id),
        type: newRelationship.type
      });
      
      // Сброс формы
      setNewRelationship({
        person1Id: '',
        person2Id: '',
        type: 'parent'
      });
      
      // Обновление данных
      await loadData();
      
      alert('Отношение успешно создано!');
      
    } catch (error: any) {
      console.error('Ошибка:', error);
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const deleteRelationship = async (id: number) => {
    if (!confirm('Удалить это отношение?')) return;
    
    try {
      await relationshipApi.delete(id);
      await loadData();
      alert('Отношение удалено!');
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const getPersonName = (id: number) => {
    const person = persons.find(p => p.id === id);
    return person ? `${person.firstName} ${person.lastName}` : `ID: ${id}`;
  };

  const getRelationshipTypeText = (type: string) => {
    switch (type) {
      case 'parent': return 'Родитель → Ребенок';
      case 'child': return 'Ребенок → Родитель';
      case 'spouse': return 'Супруг(а)';
      case 'sibling': return 'Брат/Сестра';
      default: return type;
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Загрузка данных...</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2e7d32', marginBottom: '10px' }}>🌳 Genealogy App</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Управление генеалогическим древом</p>

      {/* Табы */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('persons')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'persons' ? '#4CAF50' : '#f5f5f5',
            color: activeTab === 'persons' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'persons' ? 'bold' : 'normal'
          }}
        >
          👥 Люди ({persons.length})
        </button>
        <button
          onClick={() => setActiveTab('relationships')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'relationships' ? '#4CAF50' : '#f5f5f5',
            color: activeTab === 'relationships' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'relationships' ? 'bold' : 'normal'
          }}
        >
          🔗 Отношения ({relationships.length})
        </button>
      </div>

      {/* Контент табов */}
      {activeTab === 'persons' ? (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2>Управление людьми</h2>
            <button 
              onClick={addTestPerson}
              style={{
                padding: '10px 20px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + Добавить тестового человека
            </button>
          </div>

          {persons.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: '#f9f9f9',
              borderRadius: '8px'
            }}>
              <p>База данных пуста</p>
              <p>Добавьте первого человека</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {persons.map(person => (
                <div 
                  key={person.id}
                  style={{
                    padding: '15px',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}
                >
                  <h3 style={{ marginBottom: '10px' }}>
                    {person.firstName} {person.lastName}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <p><strong>ID:</strong> {person.id}</p>
                    <p><strong>Пол:</strong> {person.gender === 'male' ? '♂ Мужской' : person.gender === 'female' ? '♀ Женский' : 'Не указан'}</p>
                    <p><strong>Статус:</strong> {person.isAlive ? 'Жив' : 'Умер'}</p>
                    <p><strong>Добавлен:</strong> {new Date(person.createdAt).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: '20px' }}>Управление отношениями</h2>
          
          {/* Форма создания отношения */}
          <div style={{ 
            background: '#e8f5e9', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>Создать новое отношение</h3>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr auto',
              gap: '15px',
              alignItems: 'end'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Первый человек
                </label>
                <select
                  value={newRelationship.person1Id}
                  onChange={(e) => setNewRelationship({...newRelationship, person1Id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="">Выберите...</option>
                  {persons.map(person => (
                    <option key={person.id} value={person.id}>
                      {person.firstName} {person.lastName} (ID: {person.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Тип отношения
                </label>
                <select
                  value={newRelationship.type}
                  onChange={(e) => setNewRelationship({...newRelationship, type: e.target.value as any})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="parent">Родитель → Ребенок</option>
                  <option value="spouse">Супруг(а)</option>
                  <option value="sibling">Брат/Сестра</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Второй человек
                </label>
                <select
                  value={newRelationship.person2Id}
                  onChange={(e) => setNewRelationship({...newRelationship, person2Id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="">Выберите...</option>
                  {persons
                    .filter(person => person.id.toString() !== newRelationship.person1Id)
                    .map(person => (
                      <option key={person.id} value={person.id}>
                        {person.firstName} {person.lastName} (ID: {person.id})
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <button
                onClick={createRelationship}
                style={{
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  height: '40px'
                }}
              >
                Создать
              </button>
            </div>
          </div>

          {/* Список отношений */}
          <div>
            <h3 style={{ marginBottom: '15px' }}>Существующие отношения</h3>
            
            {relationships.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                background: '#f9f9f9',
                borderRadius: '8px'
              }}>
                <p>Отношений еще нет</p>
                <p>Создайте первое отношение используя форму выше</p>
              </div>
            ) : (
              <div style={{ 
                overflowX: 'auto',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Первый человек</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Отношение</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Второй человек</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Создано</th>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relationships.map(rel => (
                      <tr key={rel.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px' }}>{rel.id}</td>
                        <td style={{ padding: '12px' }}>
                          {getPersonName(rel.person1Id)}
                          <div style={{ fontSize: '12px', color: '#666' }}>ID: {rel.person1Id}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            background: 
                              rel.type === 'parent' ? '#e3f2fd' :
                              rel.type === 'spouse' ? '#f3e5f5' :
                              '#e8f5e9',
                            color: 
                              rel.type === 'parent' ? '#1565c0' :
                              rel.type === 'spouse' ? '#7b1fa2' :
                              '#2e7d32',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            {getRelationshipTypeText(rel.type)}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {getPersonName(rel.person2Id)}
                          <div style={{ fontSize: '12px', color: '#666' }}>ID: {rel.person2Id}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                          {new Date(rel.createdAt).toLocaleDateString('ru-RU')}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => deleteRelationship(rel.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Информационная панель */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#f5f5f5',
        borderRadius: '8px',
        borderTop: '3px solid #4CAF50'
      }}>
        <h3 style={{ marginBottom: '15px' }}>📊 Системная информация</h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <p style={{ fontWeight: 'bold', color: '#333' }}>База данных</p>
            <p>Людей: {persons.length}</p>
            <p>Отношений: {relationships.length}</p>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', color: '#333' }}>Backend API</p>
            <p>📍 http://localhost:3001</p>
            <p>✅ /api/persons</p>
            <p>✅ /api/relationships</p>
          </div>
          <div>
            <p style={{ fontWeight: 'bold', color: '#333' }}>Действия</p>
            <button 
              onClick={loadData}
              style={{
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Обновить данные
            </button>
            <button 
              onClick={() => {
                console.log('Persons:', persons);
                console.log('Relationships:', relationships);
                console.log('API URL:', 'http://localhost:3001/api');
              }}
              style={{
                padding: '8px 16px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Лог в консоль
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
