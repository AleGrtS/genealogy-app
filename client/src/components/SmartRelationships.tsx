import React, { useState, useEffect } from 'react';
import type { Person } from '../services/api';
import { personApi } from '../services/api';
import config from '../config';

interface RelationInfo {
  type: string;
  degree: number;
  description: string;
  path?: number[];
}

interface RelativeWithPerson {
  id: number;
  type: string;
  degree: number;
  description: string;
  path?: number[];
  person?: Person;
}

interface SmartRelationshipsProps {
  person: Person;
  onClose: () => void;
}

const SmartRelationships: React.FC<SmartRelationshipsProps> = ({ person, onClose }) => {
  const [relatives, setRelatives] = useState<Map<number, RelationInfo>>(new Map());
  const [relativesWithPersons, setRelativesWithPersons] = useState<RelativeWithPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loadingNames, setLoadingNames] = useState(false);

  useEffect(() => {
    loadRelatives();
  }, [person]);

  useEffect(() => {
    if (relatives.size > 0) {
      loadPersonNames();
    }
  }, [relatives]);

  const loadRelatives = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${config.API_URL}/smart/relatives/${person.id}`);
      const data = await response.json();
      
      if (data.success) {
        // Конвертируем объект в Map
        const relativesMap = new Map(Object.entries(data.data).map(([key, value]) => [Number(key), value as RelationInfo]));
        setRelatives(relativesMap);
      } else {
        setError('Ошибка загрузки данных');
      }
    } catch (err: any) {
      setError('Ошибка подключения: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonNames = async () => {
    try {
      setLoadingNames(true);
      
      const relativeIds = Array.from(relatives.keys()).filter(id => id !== person.id);
      
      // Загружаем информацию о каждом родственнике
      const promises = relativeIds.map(async (id) => {
        try {
          const response = await personApi.getById(id);
          if (response.data.success) {
            return response.data.data;
          }
        } catch (error) {
          console.error(`Ошибка загрузки человека с ID ${id}:`, error);
        }
        return null;
      });

      const personsData = await Promise.all(promises);
      
      // Создаем массив родственников с информацией о людях
      const relativesList: RelativeWithPerson[] = [];
      
      relativeIds.forEach((id, index) => {
        const relationInfo = relatives.get(id);
        const personData = personsData[index];
        
        if (relationInfo && personData) {
          relativesList.push({
            id,
            ...relationInfo,
            person: personData
          });
        }
      });
      
      // Сортируем по степени родства
      relativesList.sort((a, b) => a.degree - b.degree);
      
      setRelativesWithPersons(relativesList);
      
    } catch (error) {
      console.error('Ошибка загрузки имен:', error);
    } finally {
      setLoadingNames(false);
    }
  };

  const getRelationColor = (type: string): string => {
    const colors: Record<string, string> = {
      'self': '#9e9e9e',
      'parent': '#4caf50',
      'child': '#8bc34a',
      'grandparent': '#ff9800',
      'grandchild': '#ffb74d',
      'spouse': '#e91e63',
      'sibling': '#3f51b5',
      'aunt_uncle': '#9c27b0',
      'niece_nephew': '#ba68c8',
      'cousin': '#00bcd4',
      'friend': '#ff5722',
      'unknown': '#757575'
    };
    return colors[type] || colors.unknown;
  };

  const getRelationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'self': '👤',
      'parent': '👪',
      'child': '👶',
      'grandparent': '👴',
      'grandchild': '👦',
      'spouse': '💑',
      'sibling': '👥',
      'aunt_uncle': '👨‍👧',
      'niece_nephew': '👧',
      'cousin': '🤝',
      'friend': '🤝',
      'unknown': '❓'
    };
    return icons[type] || icons.unknown;
  };

  const filterRelatives = () => {
    if (filter === 'all') {
      return relativesWithPersons;
    }
    return relativesWithPersons.filter(r => r.type === filter);
  };

  const uniqueTypes = Array.from(new Set(
    Array.from(relatives.values()).map(r => r.type)
  )).filter(t => t !== 'self');

  const filteredRelatives = filterRelatives();

  if (loading) {
    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h2>🔍 Поиск родственников...</h2>
            <button onClick={onClose} style={styles.closeButton}>×</button>
          </div>
          <div style={styles.loading}>
            <div style={styles.spinner}>⏳</div>
            <p>Загрузка данных о родственных связях...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>
            <span style={styles.headerIcon}>🔍</span>
            Родственные связи: {person.firstName} {person.lastName}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <div style={styles.filters}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Фильтр по типу:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Все родственники</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>
                  {getRelationIcon(type)} {relatives.get(0)?.description || type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{relatives.size - 1}</span>
            <span style={styles.statLabel}>всего родственников</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>
              {Array.from(relatives.values()).filter(r => r.degree === 1).length}
            </span>
            <span style={styles.statLabel}>близких</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>
              {Array.from(relatives.values()).filter(r => r.type === 'friend').length}
            </span>
            <span style={styles.statLabel}>друзей</span>
          </div>
        </div>

        <div style={styles.relativesList}>
          <h3 style={styles.listTitle}>
            Найденные родственники:
            {loadingNames && <span style={styles.loadingNames}> (загрузка имен...)</span>}
          </h3>
          
          {filteredRelatives.length === 0 ? (
            <div style={styles.emptyState}>
              <p>Родственники не найдены</p>
            </div>
          ) : (
            filteredRelatives.map((relative, index) => (
              <div key={relative.id} style={styles.relativeCard}>
                <div style={styles.relativeIcon}>
                  {getRelationIcon(relative.type)}
                </div>
                <div style={styles.relativeInfo}>
                  <div style={styles.relativeName}>
                    {relative.person ? (
                      <strong>{relative.person.firstName} {relative.person.lastName}</strong>
                    ) : (
                      <span style={styles.loadingName}>Загрузка имени...</span>
                    )}
                    <span style={styles.relativeId}> (ID: {relative.id})</span>
                  </div>
                  <div style={styles.relativeRelation}>
                    <span style={{
                      ...styles.relationBadge,
                      backgroundColor: getRelationColor(relative.type),
                      color: 'white'
                    }}>
                      {relative.description}
                    </span>
                    <span style={styles.relationDegree}>
                      степень {relative.degree}
                    </span>
                  </div>
                  {relative.path && relative.path.length > 2 && (
                    <div style={styles.relationPath}>
                      Путь: {relative.path.join(' → ')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.legend}>
          <h4 style={styles.legendTitle}>🎨 Типы связей:</h4>
          <div style={styles.legendGrid}>
            {uniqueTypes.map(type => (
              <div key={type} style={styles.legendItem}>
                <span style={{
                  ...styles.legendColor,
                  backgroundColor: getRelationColor(type)
                }} />
                <span style={styles.legendText}>
                  {getRelationIcon(type)} {relatives.get(0)?.description || type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Стили (добавляем новые и обновляем существующие)
const styles: { [key: string]: React.CSSProperties } = {
  modalOverlay: {
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
    overflow: 'auto',
    padding: '20px'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '2px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    zIndex: 10,
    borderRadius: '12px 12px 0 0'
  },
  headerIcon: {
    marginRight: '10px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#666',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  },
  loading: {
    padding: '60px',
    textAlign: 'center'
  },
  spinner: {
    fontSize: '48px',
    marginBottom: '20px',
    animation: 'spin 2s linear infinite'
  },
  error: {
    padding: '15px',
    margin: '20px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '8px',
    border: '1px solid #ffcdd2'
  },
  filters: {
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  filterLabel: {
    fontWeight: 'bold',
    color: '#333'
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    minWidth: '200px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '15px',
    padding: '20px',
    backgroundColor: '#f9f9f9'
  },
  statItem: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  statLabel: {
    fontSize: '12px',
    color: '#666'
  },
  relativesList: {
    padding: '20px'
  },
  listTitle: {
    marginBottom: '15px',
    color: '#333'
  },
  loadingNames: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 'normal',
    marginLeft: '10px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  relativeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #eee',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  relativeIcon: {
    fontSize: '32px',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  relativeInfo: {
    flex: 1
  },
  relativeName: {
    marginBottom: '5px'
  },
  loadingName: {
    color: '#999',
    fontStyle: 'italic'
  },
  relativeId: {
    fontSize: '12px',
    color: '#999'
  },
  relativeRelation: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  relationBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  relationDegree: {
    fontSize: '12px',
    color: '#666'
  },
  relationPath: {
    marginTop: '8px',
    fontSize: '11px',
    color: '#999'
  },
  legend: {
    padding: '20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    borderRadius: '0 0 12px 12px'
  },
  legendTitle: {
    marginBottom: '10px'
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  legendColor: {
    width: '16px',
    height: '16px',
    borderRadius: '4px'
  },
  legendText: {
    fontSize: '12px'
  }
};

export default SmartRelationships;
