import React, { useState } from 'react';
import config from '../config';

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult('⏳ Тестируем...');
    
    try {
      const response = await fetch(`${config.API_URL}/health`);
      const data = await response.json();
      setResult(`✅ Успех! Ответ: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setResult(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px 0',
      background: '#f0f0f0',
      borderRadius: '8px',
      border: '1px solid #ddd'
    }}>
      <h3>🔧 Диагностика API</h3>
      <p><strong>API URL:</strong> {config.API_URL}</p>
      <p><strong>Хост:</strong> {window.location.hostname}</p>
      <button 
        onClick={testApi}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Тестируем...' : 'Тест подключения'}
      </button>
      {result && (
        <pre style={{
          marginTop: '15px',
          padding: '10px',
          background: 'white',
          borderRadius: '4px',
          border: '1px solid #ccc',
          whiteSpace: 'pre-wrap'
        }}>
          {result}
        </pre>
      )}
    </div>
  );
};

export default ApiTest;
