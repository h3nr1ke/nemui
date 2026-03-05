import { useState, useEffect } from 'react';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { useAppStore } from './stores/appStore';
import './styles/main.css';

declare global {
  interface Window {
    vscode: {
      postMessage: (message: { type: string; payload: unknown }) => void;
      onMessage: (callback: (message: { type: string; payload: unknown }) => void) => void;
    };
  }
}

function App() {
  const { 
    request, 
    response, 
    isLoading, 
    error,
    environments,
    activeEnvironmentId,
    setRequest,
    setResponse,
    setLoading,
    setError,
    setEnvironments,
    setActiveEnvironment
  } = useAppStore();

  useEffect(() => {
    // Listen for messages from extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      
      switch (message.type) {
        case 'request':
          setRequest(message.payload);
          break;
        case 'response':
          setResponse(message.payload);
          setLoading(false);
          break;
        case 'error':
          setError(message.payload);
          setLoading(false);
          break;
        case 'environments':
          setEnvironments(message.payload as any[]);
          break;
        case 'activeEnvironment':
          setActiveEnvironment(message.payload as string | null);
          break;
      }
    });

    // Request initial environment data
    window.vscode?.postMessage({ type: 'getEnvironments', payload: null });
  }, []);

  const handleSendRequest = () => {
    setLoading(true);
    setError(null);
    window.vscode?.postMessage({
      type: 'sendRequest',
      payload: request
    });
  };

  const handleEnvironmentChange = (envId: string | null) => {
    window.vscode?.postMessage({
      type: 'setActiveEnvironment',
      payload: envId
    });
  };

  const activeEnv = environments.find(e => e.id === activeEnvironmentId);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>⚡ Nemui API Client</h1>
          
          {/* Environment Selector */}
          <div className="env-selector">
            <select
              value={activeEnvironmentId || ''}
              onChange={(e) => handleEnvironmentChange(e.target.value || null)}
              className="env-dropdown"
            >
              <option value="">No Environment</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
            {activeEnv && (
              <span className="env-badge" title={activeEnv.variables.map(v => `${v.key}: ${v.value}`).join('\n')}>
                {activeEnv.name}
              </span>
            )}
          </div>
        </div>
        
        <button 
          className="send-button"
          onClick={handleSendRequest}
          disabled={isLoading || !request.url}
        >
          {isLoading ? 'Sending...' : 'Send Request'}
        </button>
      </header>
      
      <main className="app-main">
        <RequestPanel />
        <ResponsePanel />
      </main>

      {error && (
        <div className="error-toast">
          <span>Error: {(error as { message: string }).message}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  );
}

export default App;
