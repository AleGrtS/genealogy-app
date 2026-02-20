import React, { useState, useEffect } from 'react';
import type { Person, Relationship } from '../services/api';

interface StatisticsProps {
  persons: Person[];
  relationships: Relationship[];
}

const Statistics: React.FC<StatisticsProps> = ({ persons, relationships }) => {
  const [stats, setStats] = useState({
    totalPeople: 0,
    totalMen: 0,
    totalWomen: 0,
    genderUnknown: 0,
    alive: 0,
    deceased: 0,
    totalRelationships: 0,
    parentRelationships: 0,
    spouseRelationships: 0,
    siblingRelationships: 0,
    avgChildren: 0,
    maxChildren: 0,
    topParents: [] as { name: string; children: number }[],
    generationCount: 1
  });

  useEffect(() => {
    if (persons.length === 0) return;

    // Основные счетчики
    const men = persons.filter(p => p.gender === 'male').length;
    const women = persons.filter(p => p.gender === 'female').length;
    const unknown = persons.filter(p => !p.gender || p.gender === 'unknown').length;
    const alive = persons.filter(p => p.isAlive).length;
    const deceased = persons.filter(p => !p.isAlive).length;

    // Статистика по отношениям
    const parentRels = relationships.filter(r => r.type === 'parent' || r.type === 'child').length;
    const spouseRels = relationships.filter(r => r.type === 'spouse').length;
    const siblingRels = relationships.filter(r => r.type === 'sibling').length;

    // Подсчет детей у каждого человека
    const childrenCount: Record<number, number> = {};
    relationships.forEach(rel => {
      if (rel.type === 'parent') {
        childrenCount[rel.person1Id] = (childrenCount[rel.person1Id] || 0) + 1;
      }
    });

    const childrenValues = Object.values(childrenCount);
    const avgChildren = childrenValues.length > 0 
      ? (childrenValues.reduce((a, b) => a + b, 0) / childrenValues.length).toFixed(1)
      : 0;
    const maxChildren = Math.max(...childrenValues, 0);

    // Топ родителей (максимум детей)
    const topParentsList = Object.entries(childrenCount)
      .map(([personId, count]) => {
        const person = persons.find(p => p.id === Number(personId));
        return {
          name: person ? `${person.firstName} ${person.lastName}` : `ID: ${personId}`,
          children: count
        };
      })
      .sort((a, b) => b.children - a.children)
      .slice(0, 3);

    // Подсчет поколений (приблизительно)
    // Ищем людей без родителей (корни дерева)
    const withParents = new Set();
    relationships.forEach(rel => {
      if (rel.type === 'parent') {
        withParents.add(rel.person2Id);
      }
    });
    const roots = persons.filter(p => !withParents.has(p.id)).length;
    const generationEstimate = roots > 0 ? Math.ceil(persons.length / roots) : 1;

    setStats({
      totalPeople: persons.length,
      totalMen: men,
      totalWomen: women,
      genderUnknown: unknown,
      alive,
      deceased,
      totalRelationships: relationships.length,
      parentRelationships: parentRels,
      spouseRelationships: spouseRels,
      siblingRelationships: siblingRels,
      avgChildren: Number(avgChildren),
      maxChildren,
      topParents: topParentsList,
      generationCount: Math.min(generationEstimate, 5) // Ограничим до 5 поколений
    });

  }, [persons, relationships]);

  // Функция для форматирования чисел
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#2e7d32', marginBottom: '20px', borderBottom: '2px solid #4CAF50', paddingBottom: '10px' }}>
        📊 Общая статистика
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Карточка с основными показателями */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '5px solid #4CAF50'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>👥 Люди</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <StatItem label="Всего" value={stats.totalPeople} icon="👥" color="#2196F3" />
            <StatItem label="Мужчины" value={stats.totalMen} icon="♂" color="#4CAF50" />
            <StatItem label="Женщины" value={stats.totalWomen} icon="♀" color="#E91E63" />
            <StatItem label="Не указан" value={stats.genderUnknown} icon="❓" color="#9E9E9E" />
            <StatItem label="Живы" value={stats.alive} icon="❤️" color="#4CAF50" />
            <StatItem label="Умерли" value={stats.deceased} icon="🕊️" color="#9E9E9E" />
          </div>
        </div>

        {/* Карточка с отношениями */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '5px solid #FF9800'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔗 Отношения</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <StatItem label="Всего связей" value={stats.totalRelationships} icon="🔗" color="#FF9800" />
            <StatItem label="Родители-дети" value={stats.parentRelationships / 2} icon="👪" color="#4CAF50" />
            <StatItem label="Супруги" value={stats.spouseRelationships / 2} icon="💑" color="#E91E63" />
            <StatItem label="Братья/сестры" value={stats.siblingRelationships / 2} icon="👥" color="#9C27B0" />
          </div>
        </div>

        {/* Карточка с семейной статистикой */}
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: '5px solid #9C27B0'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🏠 Семья</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <StatItem label="Поколений" value={stats.generationCount} icon="🌳" color="#9C27B0" />
            <StatItem label="Ср. детей" value={stats.avgChildren} icon="📊" color="#FF9800" />
            <StatItem label="Макс. детей" value={stats.maxChildren} icon="👑" color="#F44336" />
            <StatItem label="Семейных пар" value={stats.spouseRelationships / 2} icon="💒" color="#4CAF50" />
          </div>
        </div>
      </div>

      {/* Топ родителей */}
      {stats.topParents.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🏆 Многодетные родители</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {stats.topParents.map((parent, index) => (
              <div key={index} style={{
                flex: 1,
                minWidth: '200px',
                padding: '15px',
                background: index === 0 ? '#fff3e0' : index === 1 ? '#f5f5f5' : '#fafafa',
                borderRadius: '8px',
                border: index === 0 ? '2px solid #ffc107' : '1px solid #ddd'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '10px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{parent.name}</div>
                <div style={{ color: '#666' }}>
                  {parent.children} {parent.children === 1 ? 'ребенок' : 'детей'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Круговая диаграмма в простом виде */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📈 Распределение по полу</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px' }}>
            {/* Простая круговая диаграмма через conic-gradient */}
            <div style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: `conic-gradient(
                #4CAF50 0% ${(stats.totalMen / stats.totalPeople) * 100}%,
                #E91E63 ${(stats.totalMen / stats.totalPeople) * 100}% ${(stats.totalMen + stats.totalWomen) / stats.totalPeople * 100}%,
                #9E9E9E ${(stats.totalMen + stats.totalWomen) / stats.totalPeople * 100}% 100%
              )`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '20px', background: '#4CAF50', borderRadius: '4px' }}></span>
              <span>Мужчины: {stats.totalMen} ({((stats.totalMen / stats.totalPeople) * 100).toFixed(1)}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '20px', background: '#E91E63', borderRadius: '4px' }}></span>
              <span>Женщины: {stats.totalWomen} ({((stats.totalWomen / stats.totalPeople) * 100).toFixed(1)}%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '20px', background: '#9E9E9E', borderRadius: '4px' }}></span>
              <span>Не указан: {stats.genderUnknown} ({((stats.genderUnknown / stats.totalPeople) * 100).toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент для отображения одного статистического показателя
const StatItem: React.FC<{ label: string; value: number | string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: '24px', marginBottom: '5px' }}>{icon}</div>
    <div style={{ fontSize: '20px', fontWeight: 'bold', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#666' }}>{label}</div>
  </div>
);

export default Statistics;
