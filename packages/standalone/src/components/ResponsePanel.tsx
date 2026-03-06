import { useState } from 'react';
import { useAppStore } from '@nemui/core';

export function ResponsePanel() {
  const { response, isLoading } = useAppStore();
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

  if (isLoading) {
    return (
      <div className="response-panel loading">
        <div className="empty-icon">⏳</div>
        <p>Sending request...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-panel empty">
        <div className="empty-icon">📭</div>
        <p>No response yet</p>
      </div>
    );
  }

  const statusColor = response.status >= 200 && response.status < 300 ? '#49cc90' : '#f93e3e';

  const formatJson = (data: unknown): string => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="response-panel">
      <div className="response-status">
        <span className="status-code" style={{ backgroundColor: statusColor }}>
          {response.status} {response.statusText}
        </span>
        <span>{response.time}ms</span>
        <span>{(response.size / 1024).toFixed(2)} KB</span>
      </div>

      <div className="panel-tabs">
        <button className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</button>
        <button className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</button>
      </div>

      <div className="tab-content">
        {activeTab === 'body' ? (
          <pre className="response-body">{formatJson(response.data)}</pre>
        ) : (
          <div>
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} style={{ padding: '4px 0' }}>
                <span style={{ color: '#61affe' }}>{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
