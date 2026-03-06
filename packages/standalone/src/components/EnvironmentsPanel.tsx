import { useState } from 'react';
import { useAppStore } from '@nemui/core';

export function EnvironmentsPanel({ onClose }: { onClose: () => void }) {
  const { environments, addEnvironment, updateEnvironment, deleteEnvironment } = useAppStore();
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);

  const handleNewEnvironment = () => {
    const name = prompt('Environment name:');
    if (name) {
      addEnvironment({
        id: `env_${Date.now()}`,
        name,
        variables: [{ key: 'base_url', value: '', enabled: true }]
      });
    }
  };

  const handleAddVariable = () => {
    if (!selectedEnv) return;
    const env = environments.find(e => e.id === selectedEnv);
    if (env) {
      updateEnvironment({
        ...env,
        variables: [...env.variables, { key: '', value: '', enabled: true }]
      });
    }
  };

  const handleUpdateVariable = (envId: string, index: number, field: string, value: string | boolean) => {
    const env = environments.find(e => e.id === envId);
    if (env) {
      const newVars = [...env.variables];
      newVars[index] = { ...newVars[index], [field]: value };
      updateEnvironment({ ...env, variables: newVars });
    }
  };

  const handleDeleteVariable = (envId: string, index: number) => {
    const env = environments.find(e => e.id === envId);
    if (env) {
      updateEnvironment({
        ...env,
        variables: env.variables.filter((_, i) => i !== index)
      });
    }
  };

  const selected = environments.find(e => e.id === selectedEnv);

  return (
    <div className="environments-panel">
      <div className="panel-header">
        <h2>Environments</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div style={{ padding: 12 }}>
        <button onClick={handleNewEnvironment} className="add-btn" style={{ width: '100%', marginBottom: 16 }}>
          + New Environment
        </button>

        {environments.map(env => (
          <div key={env.id} style={{ marginBottom: 16 }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px', backgroundColor: selectedEnv === env.id ? 'var(--bg-tertiary)' : 'transparent' }}
              onClick={() => setSelectedEnv(env.id)}
            >
              <strong>{env.name}</strong>
              <button onClick={(e) => { e.stopPropagation(); deleteEnvironment(env.id); }} className="remove-btn">×</button>
            </div>
            
            {selectedEnv === env.id && (
              <div style={{ padding: '8px 0' }}>
                {env.variables.map((v, i) => (
                  <div key={i} className="key-value-row" style={{ marginBottom: 8 }}>
                    <input type="checkbox" checked={v.enabled} onChange={(e) => handleUpdateVariable(env.id, i, 'enabled', e.target.checked)} />
                    <input type="text" value={v.key} onChange={(e) => handleUpdateVariable(env.id, i, 'key', e.target.value)} placeholder="Key" className="key-input" />
                    <input type="text" value={v.value} onChange={(e) => handleUpdateVariable(env.id, i, 'value', e.target.value)} placeholder="Value" className="value-input" />
                    <button onClick={() => handleDeleteVariable(env.id, i)} className="remove-btn">×</button>
                  </div>
                ))}
                <button onClick={handleAddVariable} className="add-btn">+ Add Variable</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
