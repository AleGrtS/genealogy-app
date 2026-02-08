import React from 'react';

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  personsCount: number;
  relationshipsCount: number;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  activeTab, 
  onTabChange, 
  personsCount, 
  relationshipsCount 
}) => {
  const tabs = [
    { id: 'persons', label: '👥', text: 'Люди', count: personsCount },
    { id: 'relationships', label: '🔗', text: 'Связи', count: relationshipsCount },
    { id: 'tree', label: '🌳', text: 'Дерево', count: null },
    { id: 'stats', label: '📊', text: 'Статистика', count: null },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 4px',
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderTop: '1px solid #e0e0e0'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: '8px 4px',
            fontSize: '12px',
            color: activeTab === tab.id ? '#4CAF50' : '#666',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            cursor: 'pointer',
            flex: 1,
            borderRadius: '8px',
            backgroundColor: activeTab === tab.id ? '#e8f5e9' : 'transparent',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '24px', marginBottom: '2px' }}>{tab.label}</span>
          <span>{tab.text}</span>
          {tab.count !== null && (
            <span style={{
              fontSize: '10px',
              background: activeTab === tab.id ? '#4CAF50' : '#e0e0e0',
              color: activeTab === tab.id ? 'white' : '#666',
              padding: '2px 6px',
              borderRadius: '10px',
              marginTop: '2px',
              minWidth: '18px'
            }}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default MobileMenu;
