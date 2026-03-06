import { useState } from 'react';
import { useAppStore } from '../stores/appStore';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const METHOD_COLORS: Record<string, string> = {
  GET: '#49cc90',
  POST: '#61affe',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e',
  HEAD: '#9012fe',
  OPTIONS: '#0d5aa7'
};

export function RequestPanel() {
  const { request, updateRequest } = useAppStore();
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts'>('params');

  const addHeader = () => {
    updateRequest({
      headers: [...request.headers, { key: '', value: '', enabled: true }]
    });
  };

  const updateHeader = (index: number, field: string, value: string | boolean) => {
    const newHeaders = [...request.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    updateRequest({ headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    updateRequest({
      headers: request.headers.filter((_, i) => i !== index)
    });
  };

  const addQueryParam = () => {
    updateRequest({
      queryParams: [...request.queryParams, { key: '', value: '', enabled: true }]
    });
  };

  const updateQueryParam = (index: number, field: string, value: string | boolean) => {
    const newParams = [...request.queryParams];
    newParams[index] = { ...newParams[index], [field]: value };
    updateRequest({ queryParams: newParams });
  };

  const removeQueryParam = (index: number) => {
    updateRequest({
      queryParams: request.queryParams.filter((_, i) => i !== index)
    });
  };

  const updateAuth = (field: string, value: string) => {
    updateRequest({
      auth: {
        ...request.auth,
        type: field === 'type' ? value : request.auth?.type || 'none',
        token: field === 'token' ? value : request.auth?.token,
        username: field === 'username' ? value : request.auth?.username,
        password: field === 'password' ? value : request.auth?.password,
        key: field === 'key' ? value : request.auth?.key,
        value: field === 'value' ? value : request.auth?.value,
        addTo: field === 'addTo' ? value : request.auth?.addTo || 'header'
      }
    });
  };

  return (
    <div className="request-panel">
      {/* URL Bar */}
      <div className="url-bar">
        <select
          value={request.method}
          onChange={(e) => updateRequest({ method: e.target.value })}
          className="method-select"
          style={{ color: METHOD_COLORS[request.method] }}
        >
          {HTTP_METHODS.map(method => (
            <option key={method} value={method} style={{ color: METHOD_COLORS[method] }}>
              {method}
            </option>
          ))}
        </select>
        
        <input
          type="text"
          value={request.url}
          onChange={(e) => updateRequest({ url: e.target.value })}
          placeholder="Enter request URL (use {{variable}} for env vars)"
          className="url-input"
        />
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button 
          className={`tab-btn ${activeTab === 'params' ? 'active' : ''}`}
          onClick={() => setActiveTab('params')}
        >
          Params {request.queryParams.filter(p => p.key).length > 0 && <span className="badge">{request.queryParams.filter(p => p.key).length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
          onClick={() => setActiveTab('headers')}
        >
          Headers {request.headers.filter(h => h.key).length > 0 && <span className="badge">{request.headers.filter(h => h.key).length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          Body
        </button>
        <button 
          className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          Auth
        </button>
        <button 
          className={`tab-btn ${activeTab === 'scripts' ? 'active' : ''}`}
          onClick={() => setActiveTab('scripts')}
        >
          Scripts
        </button>
      </div>

      {/* Query Params */}
      {activeTab === 'params' && (
        <div className="tab-content">
          <div className="key-value-list">
            {request.queryParams.map((param, index) => (
              <div key={index} className="key-value-row">
                <input
                  type="checkbox"
                  checked={param.enabled}
                  onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)}
                />
                <input
                  type="text"
                  value={param.key}
                  onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                  placeholder="Key (use {{variable}})"
                  className="key-input"
                />
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="value-input"
                />
                <button onClick={() => removeQueryParam(index)} className="remove-btn">×</button>
              </div>
            ))}
            <button onClick={addQueryParam} className="add-btn">+ Add Query Param</button>
          </div>
        </div>
      )}

      {/* Headers */}
      {activeTab === 'headers' && (
        <div className="tab-content">
          <div className="key-value-list">
            {request.headers.map((header, index) => (
              <div key={index} className="key-value-row">
                <input
                  type="checkbox"
                  checked={header.enabled}
                  onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                />
                <input
                  type="text"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                  placeholder="Header name"
                  className="key-input"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                  placeholder="Value (use {{variable}})"
                  className="value-input"
                />
                <button onClick={() => removeHeader(index)} className="remove-btn">×</button>
              </div>
            ))}
            <button onClick={addHeader} className="add-btn">+ Add Header</button>
          </div>
        </div>
      )}

      {/* Body */}
      {activeTab === 'body' && (
        <div className="tab-content">
          <div className="body-type-selector">
            <label>
              <input
                type="radio"
                name="bodyType"
                checked={request.bodyType === 'none'}
                onChange={() => updateRequest({ bodyType: 'none' })}
              /> None
            </label>
            <label>
              <input
                type="radio"
                name="bodyType"
                checked={request.bodyType === 'json'}
                onChange={() => updateRequest({ bodyType: 'json' })}
              /> JSON
            </label>
            <label>
              <input
                type="radio"
                name="bodyType"
                checked={request.bodyType === 'form-data'}
                onChange={() => updateRequest({ bodyType: 'form-data' })}
              /> Form Data
            </label>
            <label>
              <input
                type="radio"
                name="bodyType"
                checked={request.bodyType === 'raw'}
                onChange={() => updateRequest({ bodyType: 'raw' })}
              /> Raw
            </label>
            <label>
              <input
                type="radio"
                name="bodyType"
                checked={request.bodyType === 'graphql'}
                onChange={() => updateRequest({ bodyType: 'graphql' })}
              /> GraphQL
            </label>
          </div>
          
          {request.bodyType !== 'none' && (
            <textarea
              value={request.body}
              onChange={(e) => updateRequest({ body: e.target.value })}
              placeholder={request.bodyType === 'json' ? '{\n  "key": "{{variable}}"\n}' : 'Request body...'}
              className="body-editor"
            />
          )}
        </div>
      )}

      {/* Auth */}
      {activeTab === 'auth' && (
        <div className="tab-content auth-tab">
          <div className="auth-type-selector">
            <select
              value={request.auth?.type || 'none'}
              onChange={(e) => updateAuth('type', e.target.value)}
              className="auth-dropdown"
            >
              <option value="none">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="api-key">API Key</option>
            </select>
          </div>

          {request.auth?.type === 'bearer' && (
            <div className="auth-fields">
              <label>Token</label>
              <input
                type="text"
                value={request.auth?.token || ''}
                onChange={(e) => updateAuth('token', e.target.value)}
                placeholder="Enter bearer token (use {{variable}})"
                className="auth-input"
              />
              <span className="auth-hint">Use {{token}} or create a variable from response</span>
            </div>
          )}

          {request.auth?.type === 'basic' && (
            <div className="auth-fields">
              <label>Username</label>
              <input
                type="text"
                value={request.auth?.username || ''}
                onChange={(e) => updateAuth('username', e.target.value)}
                placeholder="Username"
                className="auth-input"
              />
              <label>Password</label>
              <input
                type="password"
                value={request.auth?.password || ''}
                onChange={(e) => updateAuth('password', e.target.value)}
                placeholder="Password"
                className="auth-input"
              />
            </div>
          )}

          {request.auth?.type === 'api-key' && (
            <div className="auth-fields">
              <label>Key</label>
              <input
                type="text"
                value={request.auth?.key || ''}
                onChange={(e) => updateAuth('key', e.target.value)}
                placeholder="X-API-Key"
                className="auth-input"
              />
              <label>Value</label>
              <input
                type="text"
                value={request.auth?.value || ''}
                onChange={(e) => updateAuth('value', e.target.value)}
                placeholder="API key value (use {{variable}})"
                className="auth-input"
              />
              <label>Add to</label>
              <select
                value={request.auth?.addTo || 'header'}
                onChange={(e) => updateAuth('addTo', e.target.value)}
                className="auth-dropdown"
              >
                <option value="header">Header</option>
                <option value="query">Query Param</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Scripts */}
      {activeTab === 'scripts' && (
        <div className="tab-content scripts-tab">
          <div className="script-section">
            <h4>Pre-request Script</h4>
            <p className="script-hint">Executed before the request is sent. Use to set variables.</p>
            <textarea
              value={request.preRequestScript || ''}
              onChange={(e) => updateRequest({ preRequestScript: e.target.value })}
              placeholder={`// Example: set a variable before request
setVariable('timestamp', Date.now().toString());`}
              className="script-editor"
            />
          </div>

          <div className="script-section">
            <h4>Post-response Script</h4>
            <p className="script-hint">Executed after response is received. Extract values from response.</p>
            <textarea
              value={request.postResponseScript || ''}
              onChange={(e) => updateRequest({ postResponseScript: e.target.value })}
              placeholder={`// Example: save token from response
// Access response.json to get parsed JSON
if (response.status === 200 && response.json.token) {
  setVariable('auth_token', response.json.token);
  // Or save permanently:
  setPersistentVariable('auth_token', response.json.token);
}

// Available: response.status, response.json, response.headers, response.time`}
              className="script-editor"
            />
          </div>

          <div className="script-help">
            <h4>Script API</h4>
            <code>setVariable('name', value)</code> - Set runtime variable (resets on restart)
            <br/>
            <code>setPersistentVariable('name', value)</code> - Save to environment permanently
            <br/>
            <code>response.json</code> - Parsed JSON response body
            <br/>
            <code>response.status</code> - HTTP status code
            <br/>
            <code>response.headers</code> - Response headers
          </div>
        </div>
      )}
    </div>
  );
}
