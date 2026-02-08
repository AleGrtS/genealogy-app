import React, { useState, useEffect, useRef } from 'react';
import type { Person } from '../services/api';

interface SearchBarProps {
  persons: Person[];
  onSearchResults: (filteredPersons: Person[]) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  persons, 
  onSearchResults, 
  placeholder = "Поиск по имени, фамилии, месту..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    gender: 'all',
    alive: 'all',
    hasBirthDate: false,
    hasDeathDate: false
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Загружаем последние поиски из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  const performSearch = () => {
    return persons.filter(person => {
      // Текстовый поиск
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${person.firstName} ${person.middleName || ''} ${person.lastName}`.toLowerCase();
        const birthPlace = person.birthPlace?.toLowerCase() || '';
        const deathPlace = person.deathPlace?.toLowerCase() || '';
        
        const matchesText = 
          fullName.includes(term) ||
          person.firstName.toLowerCase().includes(term) ||
          person.lastName.toLowerCase().includes(term) ||
          (person.middleName && person.middleName.toLowerCase().includes(term)) ||
          birthPlace.includes(term) ||
          deathPlace.includes(term);
        
        if (!matchesText) return false;
      }

      // Фильтр по полу
      if (filters.gender !== 'all' && person.gender !== filters.gender) {
        return false;
      }

      // Фильтр по статусу
      if (filters.alive !== 'all') {
        const isAlive = filters.alive === 'alive';
        if (person.isAlive !== isAlive) return false;
      }

      // Фильтр по наличию даты рождения
      if (filters.hasBirthDate && !person.birthDate) {
        return false;
      }

      // Фильтр по наличию даты смерти
      if (filters.hasDeathDate && !person.deathDate) {
        return false;
      }

      return true;
    });
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Сохраняем поисковый запрос в историю
    if (searchTerm.trim()) {
      const newSearches = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    }
    
    // Выполняем поиск
    const results = performSearch();
    onSearchResults(results);
    
    // Показываем результат
    console.log(`Поиск "${searchTerm}" дал ${results.length} результатов`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({
      gender: 'all',
      alive: 'all',
      hasBirthDate: false,
      hasDeathDate: false
    });
    // Сбрасываем результаты поиска (показываем всех)
    onSearchResults(persons);
    inputRef.current?.focus();
  };

  // Автоматический поиск при изменении фильтров
  useEffect(() => {
    if (searchTerm) {
      handleSearch();
    } else {
      // Если нет поискового запроса, показываем всех с учетом фильтров
      const results = performSearch();
      onSearchResults(results);
    }
  }, [filters]);

  // Подсчет результатов
  const resultCount = performSearch().length;

  return (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      {/* Основная строка поиска */}
      <form onSubmit={handleSearch} style={{ padding: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              style={{
                width: '100%',
                padding: '12px 40px 12px 40px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e);
                }
              }}
            />
            <span style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
              fontSize: '18px'
            }}>
              🔍
            </span>
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
              >
                ✕
              </button>
            )}
          </div>
          
          {/* КНОПКА ПОИСКА - добавили */}
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              minWidth: '100px'
            }}
          >
            Найти
          </button>
          
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: '12px',
              background: showAdvanced ? '#2196F3' : '#f5f5f5',
              color: showAdvanced ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
            title="Расширенный поиск"
          >
            ⚙️
          </button>
        </div>

        {/* Быстрые подсказки - недавние поиски */}
        {recentSearches.length > 0 && (
          <div style={{ 
            marginTop: '10px', 
            display: 'flex', 
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              Недавние запросы:
            </span>
            {recentSearches.map((term, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSearchTerm(term);
                  setTimeout(() => handleSearch(), 0);
                }}
                style={{
                  padding: '4px 12px',
                  background: '#e3f2fd',
                  color: '#1976d2',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Индикатор количества результатов */}
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          color: resultCount > 0 ? '#2e7d32' : '#c62828'
        }}>
          {searchTerm || filters.gender !== 'all' || filters.alive !== 'all' || filters.hasBirthDate || filters.hasDeathDate ? (
            <>Найдено: <strong>{resultCount}</strong> из {persons.length} человек</>
          ) : null}
        </div>
      </form>

      {/* Расширенные фильтры */}
      {showAdvanced && (
        <div style={{
          padding: '15px',
          borderTop: '1px solid #e0e0e0',
          background: '#f9f9f9'
        }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Расширенные фильтры</h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {/* Фильтр по полу */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                Пол
              </label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="all">Все</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
                <option value="unknown">Не указан</option>
              </select>
            </div>

            {/* Фильтр по статусу */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                Статус
              </label>
              <select
                value={filters.alive}
                onChange={(e) => setFilters({...filters, alive: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="all">Все</option>
                <option value="alive">Живые</option>
                <option value="deceased">Умершие</option>
              </select>
            </div>

            {/* Чекбоксы */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.hasBirthDate}
                  onChange={(e) => setFilters({...filters, hasBirthDate: e.target.checked})}
                />
                <span>Есть дата рождения</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filters.hasDeathDate}
                  onChange={(e) => setFilters({...filters, hasDeathDate: e.target.checked})}
                />
                <span>Есть дата смерти</span>
              </label>
            </div>
          </div>

          {/* Кнопка применения фильтров */}
          <div style={{ 
            marginTop: '15px', 
            display: 'flex', 
            gap: '10px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => {
                setFilters({
                  gender: 'all',
                  alive: 'all',
                  hasBirthDate: false,
                  hasDeathDate: false
                });
              }}
              style={{
                padding: '8px 16px',
                background: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Сбросить фильтры
            </button>
            <button
              onClick={() => handleSearch()}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Применить фильтры
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
