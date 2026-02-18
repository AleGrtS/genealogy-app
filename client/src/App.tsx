import { useState, useEffect } from 'react';
import type { Person, Relationship } from './services/api';
import { personApi, relationshipApi } from './services/api';
import EditPersonModal from './components/EditPersonModal';
import FamilyTree from './components/FamilyTree';
import SearchBar from './components/SearchBar';
import PersonList from './components/PersonList';

function App() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'persons' | 'relationships' | 'tree'>('persons');
  
  // Модальное окно редактирования
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Форма для создания отношения
  const [newRelationship, setNewRelationship] = useState({
    person1Id: '',
    person2Id: '',
    type: 'parent' as 'parent' | 'spouse' | 'child' | 'sibling'
  });

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Загрузка данных...');
      
      // Проверим соединение с backend
      const healthCheck = await fetch('http://localhost:3001/api/health');
      console.log('Health check:', healthCheck.status);
      
      // Загружаем людей
      const personsResponse = await personApi.getAll();
      console.log('Persons response:', personsResponse.data);
      
      if (personsResponse.data.success) {
        setPersons(personsResponse.data.data);
        setFilteredPersons(personsResponse.data.data);
      }
      
      // Загружаем отношения
      const relationshipsResponse = await relationshipApi.getAll();
      console.log('Relationships response:', relationshipsResponse.data);
      
      if (relationshipsResponse.data.success) {
        setRelationships(relationshipsResponse.data.data);
      }
      
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      setError(`Ошибка подключения к серверу: ${error.message}`);
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
      await loadData();
      
    } catch (error: any) {
      console.error('Ошибка добавления:', error);
      alert('Ошибка: ' + error.message);
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
      
      setNewRelationship({
        person1Id: '',
        person2Id: '',
        type: 'parent'
      });
      
      await loadData();
      alert('Отношение создано!');
      
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
    } catch (error: any) {
      console.error('Ошибка удаления отношения:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const deletePerson = async (id: number) => {
    if (!confirm('Удалить этого человека?')) return;
    
    try {
      console.log('Удаление человека ID:', id);
      const response = await personApi.delete(id);
      console.log('Результат удаления:', response.data);
      
      if (response.data.success) {
        // Обновляем списки
        const updatedPersons = persons.filter(p => p.id !== id);
        setPersons(updatedPersons);
        setFilteredPersons(updatedPersons);
        
        // Перезагружаем отношения
        const relResponse = await relationshipApi.getAll();
        if (relResponse.data.success) {
          setRelationships(relResponse.data.data);
        }
        alert('Человек удален!');
      } else {
        alert('Ошибка: ' + response.data.message);
      }
      
    } catch (error: any) {
      console.error('Ошибка удаления:', error);
      alert(`Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
    setIsEditModalOpen(true);
  };

  const handleSavePerson = async () => {
    await loadData();
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
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>Загрузка данных...</h2>
        <p>Проверка подключения к серверу...</p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {error ? `Ошибка: ${error}` : 'Ожидание ответа от backend...'}
        </p>
        <button 
          onClick={loadData}
          style={{
            padding: '10px 20px',
            marginTop: '20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#2e7d32' }}>🌳 Genealogy App</h1>
      
      {error && (
        <div style={{
          padding: '15px',
          background: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Ошибка:</strong> {error}
          <button 
            onClick={loadData}
            style={{
              marginLeft: '20px',
              padding: '5px 10px',
              background: '#c62828',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Повторить
          </button>
        </div>
      )}

      {/* Табы */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
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
          👥 Люди ({filteredPersons.length}/{persons.length})
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
        <button
          onClick={() => setActiveTab('tree')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'tree' ? '#4CAF50' : '#f5f5f5',
            color: activeTab === 'tree' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'tree' ? 'bold' : 'normal'
          }}
        >
          🌳 Дерево ({persons.length})
        </button>
      </div>

      {/* Контент */}
      {activeTab === 'persons' && (
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
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
            <button 
              onClick={loadData}
              style={{
                padding: '10px 20px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Обновить
            </button>
          </div>

          {/* Компонент поиска */}
          <SearchBar 
            persons={persons}
            onSearchResults={setFilteredPersons}
            placeholder="Поиск по имени, фамилии, месту рождения..."
          />

          {/* Список людей с результатами поиска */}
          <PersonList 
            persons={filteredPersons}
            onEdit={handleEditPerson}
            onDelete={deletePerson}
            onRefresh={loadData}
          />
        </div>
      )}

      {activeTab === 'relationships' && (
        <div>
          <div style={{ 
            background: '#e8f5e9', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>Создать новое отношение</h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr auto',
              gap: '10px',
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
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="">Выберите...</option>
                  {persons.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
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
                    padding: '8px',
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
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="">Выберите...</option>
                  {persons
                    .filter(p => p.id.toString() !== newRelationship.person1Id)
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
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
                  height: '38px'
                }}
              >
                Создать
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button 
              onClick={loadData}
              style={{
                padding: '10px 20px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Обновить
            </button>
          </div>

          {relationships.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px',
              background: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <p>Отношений пока нет. Создайте первое отношение!</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0f0f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Первый человек</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Отношение</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Второй человек</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {relationships.map(rel => (
                    <tr key={rel.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px' }}>{rel.id}</td>
                      <td style={{ padding: '10px' }}>{getPersonName(rel.person1Id)}</td>
                      <td style={{ padding: '10px' }}>
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
                          borderRadius: '4px'
                        }}>
                          {getRelationshipTypeText(rel.type)}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{getPersonName(rel.person2Id)}</td>
                      <td style={{ padding: '10px' }}>
                        <button
                          onClick={() => deleteRelationship(rel.id)}
                          style={{
                            padding: '5px 10px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
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
      )}

      {activeTab === 'tree' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2>🌳 Семейное дерево</h2>
            <p style={{ color: '#666' }}>
              Интерактивное дерево: кликайте на людей, используйте кнопки для смены ориентации, 
              колесико мыши для масштабирования, перетаскивайте для навигации.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={loadData}
                style={{
                  padding: '8px 16px',
                  background: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔄 Обновить данные
              </button>
            </div>
          </div>
          
          {persons.length < 2 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px',
              background: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <p>Добавьте больше людей и создайте отношения, чтобы увидеть дерево</p>
              <button
                onClick={() => setActiveTab('persons')}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Перейти к добавлению людей
              </button>
            </div>
          ) : relationships.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px',
              background: '#f5f5f5',
              borderRadius: '8px'
            }}>
              <p>Есть люди, но нет отношений. Создайте отношения между людьми!</p>
              <button
                onClick={() => setActiveTab('relationships')}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Перейти к созданию отношений
              </button>
            </div>
          ) : (
            <FamilyTree 
              persons={persons}
              relationships={relationships}
              onPersonClick={(id) => {
                console.log('Выбран человек:', id);
                const person = persons.find(p => p.id === id);
                if (person) {
                  alert(`Выбран: ${person.firstName} ${person.lastName}`);
                }
              }}
              height="700px"
            />
          )}
        </div>
      )}

      {/* Модальное окно редактирования */}
      <EditPersonModal
        person={editingPerson}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePerson}
      />

      {/* Информационная панель */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#e8f5e9',
        borderRadius: '4px',
        fontSize: '14px',
        color: '#2e7d32'
      }}>
        <strong>📊 Статистика:</strong> 👥 Людей: {persons.length} (показано: {filteredPersons.length}) | 🔗 Отношений: {relationships.length} | 🌳 Версия: 0.5.0 (с поиском и фильтрацией)
      </div>
    </div>
  );
}

export default App;
