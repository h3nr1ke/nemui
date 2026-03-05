import { useState } from 'react';
import { useRequestStore } from '../stores/requestStore';

export function ResponsePanel() {
  const { response, isLoading } = useRequestStore();
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

  if (isLoading) {
    return (
      <div className="response-panel loading">
        <div className="spinner"></div>
        <p>Sending request...</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="response-panel empty">
        <div className="empty-icon">📭</div>
        <p>No response yet</p>
        <span>Send a request to see the response here</span>
      </div>
    );
  }

  const statusColor = response.status >= 200 && response.status < 300 
    ? '#49cc90' 
    : response.status >= 400 
      ? '#f93e3e' 
      : '#fca130';

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
      {/* Status Bar */}
      <div className="response-status">
        <span 
          className="status-code" 
          style={{ backgroundColor: statusColor }}
        >
          {response.status} {response.statusText}
        </span>
        <span className="response-time">{response.time}ms</span>
        <span className="response-size">{(response.size / 1024).toFixed(2)} KB</span>
      </div>

      {/* Tabs */}
      <div className="response-tabs">
        <button 
          className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          Body
        </button>
        <button 
          className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          Headers
        </button>
      </div>

      {/* Content */}
      <div className="response-content">
        {activeTab === 'body' ? (
          <pre className="response-body">
            <code>{formatJson(response.data)}</code>
          </pre>
        ) : (
          <div className="response-headers">
            {Object.entries(response.headers).map(([key, value]) => (
              <div key={key} className="header-row">
                <span className="header-key">{key}:</span>
                <span className="header-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
