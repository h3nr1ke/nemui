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
        <TabButton label="Params" count={request.queryParams.filter(p => p.key).length} />
        <TabButton label="Headers" count={request.headers.filter(h => h.key).length} />
        <TabButton label="Body" />
        <TabButton label="Auth" />
      </div>

      {/* Query Params */}
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

      {/* Headers */}
      <div className="tab-content" style={{ display: 'none' }}>
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

      {/* Body */}
      <div className="tab-content" style={{ display: 'none' }}>
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
    </div>
  );
}

function TabButton({ label, count }: { label: string; count?: number }) {
  return (
    <button className="tab-btn">
      {label}
      {count !== undefined && count > 0 && <span className="badge">{count}</span>}
    </button>
  );
}
