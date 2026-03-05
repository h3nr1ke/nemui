import { useState, useEffect } from 'react';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { useRequestStore } from './stores/requestStore';

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
    setRequest,
    setResponse,
    setLoading,
    setError
  } = useRequestStore();

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
      }
    });
  }, []);

  const handleSendRequest = () => {
    setLoading(true);
    setError(null);
    window.vscode?.postMessage({
      type: 'sendRequest',
      payload: request
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>⚡ Nemui API Client</h1>
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
