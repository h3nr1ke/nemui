import { useState } from 'react';
import { useAppStore } from '@nemui/core';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const METHOD_COLORS: Record<string, string> = {
  GET: '#49cc90',
  POST: '#61affe',
  PUT: '#fca130',
  PATCH: '#50e3c2',
  DELETE: '#f93e3e'
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
      }
    });
  };

  return (
    <div className="request-panel">
      {/* URL Bar */}
      <div className="url-bar">
        <select
          value={request.method}
          onChange={(e) => updateRequest({ method: e.target.value as any })}
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
          placeholder="Enter request URL"
          className="url-input"
        />
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button className={`tab-btn ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>Params</button>
        <button className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</button>
        <button className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</button>
        <button className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>Auth</button>
        <button className={`tab-btn ${activeTab === 'scripts' ? 'active' : ''}`} onClick={() => setActiveTab('scripts')}>Scripts</button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'params' && (
          <div className="key-value-list">
            {request.queryParams.map((param, index) => (
              <div key={index} className="key-value-row">
                <input type="checkbox" checked={param.enabled} onChange={(e) => updateQueryParam(index, 'enabled', e.target.checked)} />
                <input type="text" value={param.key} onChange={(e) => updateQueryParam(index, 'key', e.target.value)} placeholder="Key" className="key-input" />
                <input type="text" value={param.value} onChange={(e) => updateQueryParam(index, 'value', e.target.value)} placeholder="Value" className="value-input" />
                <button onClick={() => removeQueryParam(index)} className="remove-btn">×</button>
              </div>
            ))}
            <button onClick={addQueryParam} className="add-btn">+ Add Param</button>
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="key-value-list">
            {request.headers.map((header, index) => (
              <div key={index} className="key-value-row">
                <input type="checkbox" checked={header.enabled} onChange={(e) => updateHeader(index, 'enabled', e.target.checked)} />
                <input type="text" value={header.key} onChange={(e) => updateHeader(index, 'key', e.target.value)} placeholder="Header" className="key-input" />
                <input type="text" value={header.value} onChange={(e) => updateHeader(index, 'value', e.target.value)} placeholder="Value" className="value-input" />
                <button onClick={() => removeHeader(index)} className="remove-btn">×</button>
              </div>
            ))}
            <button onClick={addHeader} className="add-btn">+ Add Header</button>
          </div>
        )}

        {activeTab === 'body' && (
          <div>
            <div className="body-type-selector">
              <label><input type="radio" name="bodyType" checked={request.bodyType === 'none'} onChange={() => updateRequest({ bodyType: 'none' })} /> None</label>
              <label><input type="radio" name="bodyType" checked={request.bodyType === 'json'} onChange={() => updateRequest({ bodyType: 'json' })} /> JSON</label>
              <label><input type="radio" name="bodyType" checked={request.bodyType === 'graphql'} onChange={() => updateRequest({ bodyType: 'graphql' })} /> GraphQL</label>
            </div>
            {request.bodyType !== 'none' && (
              <textarea
                value={request.body}
                onChange={(e) => updateRequest({ body: e.target.value })}
                placeholder="Request body"
                className="body-editor"
              />
            )}
          </div>
        )}

        {activeTab === 'auth' && (
          <div>
            <select value={request.auth?.type || 'none'} onChange={(e) => updateAuth('type', e.target.value)} className="env-dropdown">
              <option value="none">No Auth</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
            </select>
            {request.auth?.type === 'bearer' && (
              <input type="text" value={request.auth?.token || ''} onChange={(e) => updateAuth('token', e.target.value)} placeholder="Token" className="key-input" style={{ marginTop: 12 }} />
            )}
          </div>
        )}

        {activeTab === 'scripts' && (
          <div>
            <h4>Post-response Script</h4>
            <textarea
              value={request.postResponseScript || ''}
              onChange={(e) => updateRequest({ postResponseScript: e.target.value })}
              placeholder="// Use setVariable('name', value) or setPersistentVariable('name', value)"
              className="body-editor"
            />
          </div>
        )}
      </div>
    </div>
  );
}
