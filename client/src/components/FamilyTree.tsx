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

    // Создаем узлы (люди)
    const nodes = new DataSet(
      persons.map(person => ({
        id: person.id,
        label: `${person.firstName} ${person.lastName}`,
        title: `${person.firstName} ${person.lastName}\nID: ${person.id}\n${person.birthDate ? 'Родился: ' + new Date(person.birthDate).toLocaleDateString() : ''}`,
        shape: person.gender === 'male' ? 'icon' : person.gender === 'female' ? 'icon' : 'dot',
        icon: {
          face: 'FontAwesome',
          code: person.gender === 'male' ? '\uf183' : person.gender === 'female' ? '\uf182' : '\uf007',
          size: 40,
          color: person.gender === 'male' ? '#4a90e2' : person.gender === 'female' ? '#e27a9e' : '#95a5a6'
        },
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
          color: '#333'
        }
      }))
    );

    // Создаем связи (отношения)
    const edges = new DataSet(
      relationships.map(rel => {
        // Определяем стиль связи по типу отношения
        let color = '#95a5a6';
        let dashes = false;
        let arrows = undefined;

        switch (rel.type) {
          case 'parent':
            color = '#4a90e2';
            arrows = { to: { enabled: true, type: 'arrow' } };
            break;
          case 'child':
            color = '#4a90e2';
            arrows = { from: { enabled: true, type: 'arrow' } };
            break;
          case 'spouse':
            color = '#e27a9e';
            dashes = false;
            arrows = { middle: { enabled: true, type: 'circle' } };
            break;
          case 'sibling':
            color = '#95a5a6';
            dashes = true;
            break;
        }

        return {
          id: rel.id,
          from: rel.person1Id,
          to: rel.person2Id,
          label: rel.type === 'spouse' ? 'супруги' : rel.type === 'sibling' ? 'брат/сестра' : '',
          color: color,
          dashes: dashes,
          arrows: arrows,
          width: 2,
          font: {
            size: 12,
            align: 'middle'
          }
        };
      })
    );

    // Настройки графа
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'UD', // Up-Down (сверху вниз)
          sortMethod: 'directed',
          levelSeparation: 150,
          nodeSpacing: 150,
          treeSpacing: 200
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: true,
        keyboard: true
      },
      physics: {
        enabled: false // Отключаем физику для иерархического дерева
      },
      nodes: {
        shape: 'dot',
        size: 30,
        font: {
          size: 14,
          face: 'Arial'
        },
        borderWidth: 2,
        shadow: true
      },
      edges: {
        smooth: {
          type: 'curvedCW',
          roundness: 0.2
        },
        font: {
          size: 12,
          align: 'middle'
        }
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
    }, 100);

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
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        display: 'flex',
        gap: '5px'
      }}>
        <button
          onClick={() => setLayout('UD')}
          style={{
            padding: '5px 10px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Сверху вниз"
        >
          ⬇️
        </button>
        <button
          onClick={() => setLayout('DU')}
          style={{
            padding: '5px 10px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Снизу вверх"
        >
          ⬆️
        </button>
        <button
          onClick={() => setLayout('LR')}
          style={{
            padding: '5px 10px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Слева направо"
        >
          ➡️
        </button>
        <button
          onClick={() => setLayout('RL')}
          style={{
            padding: '5px 10px',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Справа налево"
        >
          ⬅️
        </button>
        <button
          onClick={exportAsPNG}
          style={{
            padding: '5px 10px',
            background: '#607D8B',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          title="Сохранить как PNG"
        >
          📸
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
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          maxWidth: '300px'
        }}>
          <strong>Выбран:</strong>{' '}
          {persons.find(p => p.id === selectedPerson)?.firstName}{' '}
          {persons.find(p => p.id === selectedPerson)?.lastName}
        </div>
      )}

      {/* Контейнер для графа */}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: '#f9f9f9'
        }} 
      />
    </div>
  );
};

export default FamilyTree;
