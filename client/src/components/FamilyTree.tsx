import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import type { Person, Relationship } from '../services/api';

interface FamilyTreeProps {
  persons: Person[];
  relationships: Relationship[];
  onPersonClick?: (personId: number) => void;
  width?: string;
  height?: string;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ 
  persons, 
  relationships, 
  onPersonClick,
  width = '100%',
  height = '600px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || persons.length === 0) return;

    // Очищаем контейнер
    containerRef.current.innerHTML = '';

    // Функция для определения цвета узла по поколению (приблизительно)
    const getGenerationColor = (birthDate?: string) => {
      if (!birthDate) return '#95a5a6';
      const year = new Date(birthDate).getFullYear();
      if (year < 1920) return '#8e44ad'; // фиолетовый - старшее поколение
      if (year < 1950) return '#2980b9'; // синий - среднее
      if (year < 1980) return '#27ae60'; // зеленый - младшее
      return '#f39c12'; // оранжевый - самое младшее
    };

    // Создаем узлы (люди)
    const nodes = new DataSet(
      persons.map(person => ({
        id: person.id,
        label: `${person.firstName}\n${person.lastName}`,
        title: `${person.firstName} ${person.lastName}${person.birthDate ? '\nРодился: ' + new Date(person.birthDate).toLocaleDateString() : ''}${person.deathDate ? '\nУмер: ' + new Date(person.deathDate).toLocaleDateString() : ''}`,
        shape: 'dot',
        size: 30,
        color: {
          background: person.isAlive ? '#e8f5e9' : '#f5f5f5',
          border: person.isAlive ? '#4caf50' : '#9e9e9e',
          highlight: {
            background: '#ffe082',
            border: '#ffb300'
          }
        },
        font: {
          size: 14,
          color: '#333',
          face: 'Arial',
          multi: 'html'
        },
        level: person.birthDate ? Math.floor((new Date(person.birthDate).getFullYear() - 1880) / 30) : 2
      }))
    );

    // Создаем связи (отношения)
    const edges = new DataSet(
      relationships.map(rel => {
        // Определяем стиль связи по типу отношения
        let color = '#95a5a6';
        let dashes = false;
        let arrows = undefined;
        let label = '';

        switch (rel.type) {
          case 'parent':
          case 'child':
            color = '#e67e22'; // оранжевый
            arrows = { to: { enabled: true, type: 'arrow' } };
            label = 'родитель';
            break;
          case 'spouse':
            color = '#e74c3c'; // красный
            dashes = false;
            arrows = { middle: { enabled: true, type: 'circle', scaleFactor: 0.5 } };
            label = 'супруги';
            break;
          case 'sibling':
            color = '#3498db'; // синий
            dashes = true;
            label = 'брат/сестра';
            break;
          case 'grandparent':
          case 'grandchild':
            color = '#9b59b6'; // фиолетовый
            dashes = true;
            label = rel.type === 'grandparent' ? 'дедушка/бабушка' : 'внук/внучка';
            break;
          case 'aunt_uncle':
          case 'niece_nephew':
            color = '#1abc9c'; // бирюзовый
            dashes = true;
            label = rel.type === 'aunt_uncle' ? 'тетя/дядя' : 'племянник/ца';
            break;
          case 'cousin':
            color = '#f1c40f'; // желтый
            dashes = true;
            label = 'двоюродные';
            break;
        }

        return {
          id: rel.id,
          from: rel.person1Id,
          to: rel.person2Id,
          label: label,
          color: color,
          dashes: dashes,
          arrows: arrows,
          width: 2,
          font: {
            size: 12,
            align: 'middle',
            color: '#666',
            background: 'white',
            strokeWidth: 2,
            strokeColor: 'white'
          },
          smooth: {
            type: 'curvedCW',
            roundness: 0.2
          }
        };
      })
    );

    // Настройки графа - используем иерархическую раскладку
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'UD', // Up-Down (сверху вниз)
          sortMethod: 'directed',
          levelSeparation: 200,
          nodeSpacing: 250,
          treeSpacing: 300,
          blockShifting: true,
          edgeMinimization: true,
          parentCentralization: true
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: true,
        keyboard: true,
        zoomView: true,
        dragView: true
      },
      physics: {
        enabled: false // Отключаем физику для иерархического дерева
      },
      nodes: {
        shape: 'dot',
        size: 35,
        font: {
          size: 14,
          face: 'Arial',
          multi: 'html',
          strokeWidth: 2,
          strokeColor: 'white'
        },
        borderWidth: 2,
        shadow: true,
        margin: 10
      },
      edges: {
        smooth: {
          type: 'curvedCW',
          roundness: 0.2
        },
        font: {
          size: 11,
          align: 'middle',
          background: 'white',
          strokeWidth: 2,
          strokeColor: 'white'
        },
        width: 2,
        shadow: true
      },
      manipulation: {
        enabled: false
      }
    };

    // Создаем сеть
    networkRef.current = new Network(containerRef.current, { nodes, edges }, options);

    // Обработчик клика по узлу
    networkRef.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        const personId = params.nodes[0];
        setSelectedPerson(personId);
        if (onPersonClick) {
          onPersonClick(personId);
        }
      }
    });

    // Обработчик наведения
    networkRef.current.on('hoverNode', (params) => {
      containerRef.current!.style.cursor = 'pointer';
    });

    networkRef.current.on('blurNode', () => {
      containerRef.current!.style.cursor = 'default';
    });

    // Подгоняем размер
    setTimeout(() => {
      networkRef.current?.fit();
    }, 200);

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [persons, relationships, onPersonClick]);

  // Функция для экспорта в PNG
  const exportAsPNG = () => {
    if (networkRef.current) {
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'family-tree.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    }
  };

  // Функция для изменения раскладки
  const setLayout = (direction: 'UD' | 'DU' | 'LR' | 'RL') => {
    if (networkRef.current) {
      networkRef.current.setOptions({
        layout: {
          hierarchical: {
            direction: direction
          }
        }
      });
      networkRef.current.fit();
    }
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      {/* Панель управления */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        maxWidth: '300px'
      }}>
        <div style={{ width: '100%', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
          Ориентация:
        </div>
        <button
          onClick={() => setLayout('UD')}
          style={{
            padding: '8px 12px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
          title="Сверху вниз (традиционное)"
        >
          ⬇️ Сверху вниз
        </button>
        <button
          onClick={() => setLayout('DU')}
          style={{
            padding: '8px 12px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
          title="Снизу вверх"
        >
          ⬆️ Снизу вверх
        </button>
        <button
          onClick={() => setLayout('LR')}
          style={{
            padding: '8px 12px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
          title="Слева направо"
        >
          ➡️ Слева направо
        </button>
        <button
          onClick={() => setLayout('RL')}
          style={{
            padding: '8px 12px',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
          title="Справа налево"
        >
          ⬅️ Справа налево
        </button>
        <button
          onClick={exportAsPNG}
          style={{
            padding: '8px 12px',
            background: '#607D8B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '5px'
          }}
          title="Сохранить как PNG"
        >
          📸 Сохранить как PNG
        </button>
      </div>

      {/* Информация о выбранном человеке */}
      {selectedPerson && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          zIndex: 10,
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          maxWidth: '300px'
        }}>
          <strong>Выбран:</strong>{' '}
          {persons.find(p => p.id === selectedPerson)?.firstName}{' '}
          {persons.find(p => p.id === selectedPerson)?.lastName}
          <br />
          <small style={{ color: '#666' }}>
            {persons.find(p => p.id === selectedPerson)?.birthDate && 
              `Родился: ${new Date(persons.find(p => p.id === selectedPerson)!.birthDate!).toLocaleDateString()}`
            }
          </small>
        </div>
      )}

      {/* Легенда */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 10,
        background: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        fontSize: '12px',
        maxWidth: '200px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎨 Легенда:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div><span style={{ color: '#e67e22' }}>⬤</span> Родитель-ребенок</div>
          <div><span style={{ color: '#e74c3c' }}>⬤</span> Супруги</div>
          <div><span style={{ color: '#3498db' }}>⬤</span> Брат/сестра</div>
          <div><span style={{ color: '#9b59b6' }}>⬤</span> Дедушка/бабушка - внуки</div>
          <div><span style={{ color: '#1abc9c' }}>⬤</span> Тетя/дядя - племянники</div>
          <div><span style={{ color: '#f1c40f' }}>⬤</span> Двоюродные</div>
          <div style={{ marginTop: '5px' }}><span style={{ background: '#e8f5e9', padding: '2px 4px' }}>⬤</span> Жив(а)</div>
          <div><span style={{ background: '#f5f5f5', padding: '2px 4px' }}>⬤</span> Умер(ла)</div>
        </div>
      </div>

      {/* Контейнер для графа */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: '#f9f9f9'
        }} 
      />
    </div>
  );
};

export default FamilyTree;
