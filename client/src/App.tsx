import { useState, useEffect } from 'react';
import type { Person, Relationship } from './services/api';
import { personApi, relationshipApi } from './services/api';
import EditPersonModal from './components/EditPersonModal';
import FamilyTree from './components/FamilyTree';
import SearchBar from './components/SearchBar';
import PersonList from './components/PersonList';
import Statistics from './components/Statistics';
import RelationshipManager from './components/RelationshipManager';
import MobileMenu from './components/MobileMenu';
import { useMobile } from './hooks/useMobile';

function App() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'persons' | 'relationships' | 'tree' | 'stats'>('persons');
  
  const { isMobile, windowSize } = useMobile();
  
  // Модальное окно редактирования
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('Загрузка данных...');
      
      const personsResponse = await personApi.getAll();
      
      if (personsResponse.data.success) {
        setPersons(personsResponse.data.data);
        setFilteredPersons(personsResponse.data.data);
      }
      
      const relationshipsResponse = await relationshipApi.getAll();
      
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

  const deletePerson = async (id: number) => {
    if (!confirm('Удалить этого человека?')) return;
    
    try {
      const response = await personApi.delete(id);
      
      if (response.data.success) {
        const updatedPersons = persons.filter(p => p.id !== id);
        setPersons(updatedPersons);
        setFilteredPersons(updatedPersons);
        
        const relResponse = await relationshipApi.getAll();
        if (relResponse.data.success) {
          setRelationships(relResponse.data.data);
        }
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

  if (loading) {
    return (
      <div style={{ 
        padding: isMobile ? '30px 15px' : '50px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>Загрузка данных...</h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {error ? `Ошибка: ${error}` : 'Ожидание ответа от сервера...'}
        </p>
        <button 
          onClick={loadData}
          style={{
            padding: isMobile ? '12px 24px' : '10px 20px',
            marginTop: '20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: isMobile ? '10px' : '20px', 
      paddingBottom: isMobile ? '80px' : '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        color: '#2e7d32', 
        fontSize: isMobile ? '24px' : '32px',
        marginBottom: isMobile ? '10px' : '20px',
        textAlign: isMobile ? 'center' : 'left'
      }}>
        🌳 Genealogy App
      </h1>
      
      {error && (
        <div style={{
          padding: isMobile ? '12px' : '15px',
          background: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: isMobile ? '14px' : '16px'
        }}>
          <strong>Ошибка:</strong> {error}
          <button 
            onClick={loadData}
            style={{
              marginLeft: '10px',
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

      {/* Десктопное меню */}
      {!isMobile && (
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px', 
          borderBottom: '2px solid #e0e0e0', 
          paddingBottom: '10px',
          flexWrap: 'wrap'
        }}>
          <TabButton 
            active={activeTab === 'persons'} 
            onClick={() => setActiveTab('persons')}
            label={`👥 Люди (${filteredPersons.length}/${persons.length})`}
          />
          <TabButton 
            active={activeTab === 'relationships'} 
            onClick={() => setActiveTab('relationships')}
            label={`🔗 Отношения (${relationships.length})`}
          />
          <TabButton 
            active={activeTab === 'tree'} 
            onClick={() => setActiveTab('tree')}
            label={`🌳 Дерево (${persons.length})`}
          />
          <TabButton 
            active={activeTab === 'stats'} 
            onClick={() => setActiveTab('stats')}
            label="📊 Статистика"
          />
        </div>
      )}

      {/* Контент */}
      {activeTab === 'persons' && (
        <div>
          <div style={{ 
            marginBottom: '20px', 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <button
              onClick={addTestPerson}
              style={{
                padding: isMobile ? '12px 20px' : '10px 20px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              + Добавить тестового человека
            </button>
            <button 
              onClick={loadData}
              style={{
                padding: isMobile ? '12px 20px' : '10px 20px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: isMobile ? '100%' : 'auto'
              }}
            >
              🔄 Обновить
            </button>
          </div>

          <SearchBar 
            persons={persons}
            onSearchResults={setFilteredPersons}
            placeholder={isMobile ? "Поиск..." : "Поиск по имени, фамилии..."}
          />

          <PersonList 
            persons={filteredPersons}
            onEdit={handleEditPerson}
            onDelete={deletePerson}
            onRefresh={loadData}
          />
        </div>
      )}

      {activeTab === 'relationships' && (
        <RelationshipManager 
          persons={persons}
          onRelationshipCreated={loadData}
        />
      )}

      {activeTab === 'tree' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px' }}>🌳 Семейное дерево</h2>
            <p style={{ color: '#666', fontSize: isMobile ? '14px' : '16px' }}>
              {isMobile ? 'Нажмите на человека для информации' : 'Интерактивное дерево'}
            </p>
            <button 
              onClick={loadData}
              style={{
                padding: '8px 16px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              🔄 Обновить данные
            </button>
          </div>
          
          {persons.length < 2 ? (
            <EmptyState 
              message="Добавьте больше людей и создайте отношения"
              buttonText="Перейти к добавлению людей"
              onButtonClick={() => setActiveTab('persons')}
              isMobile={isMobile}
            />
          ) : relationships.length === 0 ? (
            <EmptyState 
              message="Есть люди, но нет отношений"
              buttonText="Перейти к созданию отношений"
              onButtonClick={() => setActiveTab('relationships')}
              isMobile={isMobile}
            />
          ) : (
            <FamilyTree 
              persons={persons}
              relationships={relationships}
              onPersonClick={(id) => {
                const person = persons.find(p => p.id === id);
                if (person && isMobile) {
                  alert(`${person.firstName} ${person.lastName}`);
                }
              }}
              height={isMobile ? windowSize.height - 300 : '700px'}
            />
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <Statistics persons={persons} relationships={relationships} />
      )}

      {/* Мобильное меню */}
      {isMobile && (
        <MobileMenu 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
          personsCount={persons.length}
          relationshipsCount={relationships.length}
        />
      )}

      {/* Модальное окно редактирования */}
      <EditPersonModal
        person={editingPerson}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePerson}
      />
    </div>
  );
}

// Компонент кнопки таба
const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      background: active ? '#4CAF50' : '#f5f5f5',
      color: active ? 'white' : '#333',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: active ? 'bold' : 'normal'
    }}
  >
    {label}
  </button>
);

// Компонент пустого состояния
const EmptyState: React.FC<{ message: string; buttonText: string; onButtonClick: () => void; isMobile: boolean }> = 
  ({ message, buttonText, onButtonClick, isMobile }) => (
    <div style={{ 
      textAlign: 'center', 
      padding: isMobile ? '30px 15px' : '50px',
      background: '#f5f5f5',
      borderRadius: '8px'
    }}>
      <p>{message}</p>
      <button
        onClick={onButtonClick}
        style={{
          marginTop: '10px',
          padding: isMobile ? '12px 24px' : '10px 20px',
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: isMobile ? '100%' : 'auto'
        }}
      >
        {buttonText}
      </button>
    </div>
  );

export default App;
