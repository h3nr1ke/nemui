import { useState } from 'react';
import { useAppStore, setPlatformApi } from './store';
import { createHttpClient } from './httpClient';
import type { ApiRequest } from './types';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { CollectionsPanel } from './components/CollectionsPanel';
import { EnvironmentsPanel } from './components/EnvironmentsPanel';

const httpClient = createHttpClient(useAppStore.getState);

setPlatformApi({
  platform: 'standalone',
  sendRequest: async (request: ApiRequest) => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError(null);
    
    try {
      const response = await httpClient(request);
      useAppStore.getState().setResponse(response);
      useAppStore.getState().setLoading(false);
      
      if (request.postResponseScript) {
        executePostResponseScript(request.postResponseScript, response);
      }
      
      return response;
    } catch (error: unknown) {
      useAppStore.getState().setError(error);
      useAppStore.getState().setLoading(false);
      throw error;
    }
  },
  showMessage: (message: string, _type = 'info') => {
    console.log(`[${_type}] ${message}`);
  },
  getConfig: async () => {
    return useAppStore.getState().config;
  }
});

function executePostResponseScript(script: string, response: { status: number; statusText: string; headers: Record<string, string>; data: unknown; time: number; size: number }) {
  try {
    const variables = useAppStore.getState().runtimeVariables;
    
    const context = {
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        time: response.time,
        json: typeof response.data === 'object' ? response.data : JSON.parse(String(response.data))
      },
      variables,
      setVariable: (key: string, value: string) => {
        useAppStore.getState().setRuntimeVariable(key, value);
      },
      setPersistentVariable: (key: string, value: string) => {
        useAppStore.getState().setRuntimeVariable(key, value);
        const activeEnvId = useAppStore.getState().activeEnvironmentId;
        if (activeEnvId) {
          const envs = useAppStore.getState().environments;
          const env = envs.find(e => e.id === activeEnvId);
          if (env) {
            const updatedEnv = {
              ...env,
              variables: [...env.variables.filter(v => v.key !== key), { key, value, enabled: true }]
            };
            useAppStore.getState().updateEnvironment(updatedEnv);
          }
        }
      }
    };
    
    new Function(
      'response', 
      'variables', 
      'setVariable', 
      'setPersistentVariable', 
      script
    )(context.response, context.variables, context.setVariable, context.setPersistentVariable);
  } catch (error) {
    console.error('Script error:', error);
  }
}

function App() {
  const { 
    request, 
    isLoading, 
    error,
    environments,
    activeEnvironmentId,
    runtimeVariables,
    setActiveEnvironment,
    setError,
    setLoading
  } = useAppStore();

  const [showSidebar, setShowSidebar] = useState(true);
  const [showEnvPanel, setShowEnvPanel] = useState(false);

  const handleSendRequest = async () => {
    useAppStore.getState().setLoading(true);
    useAppStore.getState().setError(null);
    
    try {
      await httpClient(request);
    } catch (err) {
      useAppStore.getState().setError(err);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={() => setShowSidebar(!showSidebar)}>
            ☰
          </button>
          <h1>⚡ Nemui</h1>
          
          <div className="env-selector">
            <select
              value={activeEnvironmentId || ''}
              onChange={(e) => setActiveEnvironment(e.target.value || null)}
              className="env-dropdown"
            >
              <option value="">No Environment</option>
              {environments.map(env => (
                <option key={env.id} value={env.id}>{env.name}</option>
              ))}
            </select>
            <button className="env-manage-btn" onClick={() => setShowEnvPanel(!showEnvPanel)}>
              ⚙
            </button>
          </div>

          <button 
            className="vars-toggle"
            onClick={() => setShowEnvPanel(!showEnvPanel)}
            title="Variables"
          >
            {Object.keys(runtimeVariables).length > 0 ? `{{${Object.keys(runtimeVariables).length}}}` : '{}'}
          </button>
        </div>
        
        <button 
          className="send-button"
          onClick={handleSendRequest}
          disabled={isLoading || !request.url}
        >
          {isLoading ? 'Sending...' : 'Send Request'}
        </button>
      </header>

      {showEnvPanel && (
        <EnvironmentsPanel onClose={() => setShowEnvPanel(false)} />
      )}
      
      <main className="app-main">
        {showSidebar && (
          <CollectionsPanel />
        )}
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
