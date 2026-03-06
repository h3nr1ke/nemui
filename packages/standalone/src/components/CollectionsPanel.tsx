import { useAppStore } from '@nemui/core';

export function CollectionsPanel() {
  const { collections, addCollection, setRequest } = useAppStore();

  const handleNewCollection = () => {
    const name = prompt('Collection name:');
    if (name) {
      addCollection({
        id: `col_${Date.now()}`,
        name,
        requests: [],
        folders: []
      });
    }
  };

  const handleNewRequest = (collectionId: string) => {
    const name = prompt('Request name:');
    if (name) {
      const { collections, updateCollection } = useAppStore.getState();
      const col = collections.find(c => c.id === collectionId);
      if (col) {
        updateCollection({
          ...col,
          requests: [...col.requests, {
            id: `req_${Date.now()}`,
            name,
            method: 'GET',
            url: '',
            headers: [],
            queryParams: [],
            body: '',
            bodyType: 'none',
            collectionId
          }]
        });
      }
    }
  };

  const handleSelectRequest = (request: any) => {
    setRequest(request);
  };

  const METHOD_COLORS: Record<string, string> = {
    GET: '#49cc90',
    POST: '#61affe',
    PUT: '#fca130',
    DELETE: '#f93e3e'
  };

  return (
    <div className="collections-sidebar">
      <div className="collections-header">
        <h2>Collections</h2>
        <button className="add-btn" onClick={handleNewCollection}>+</button>
      </div>
      <div className="collections-list">
        {collections.map(col => (
          <div key={col.id}>
            <div className="collection-item">
              <span className="collection-name">{col.name}</span>
              <button className="add-btn" onClick={() => handleNewRequest(col.id)}>+</button>
            </div>
            {col.requests.map(req => (
              <div key={req.id} className="request-item" onClick={() => handleSelectRequest(req)}>
                <span className={`method-${req.method.toLowerCase()}`} style={{ marginRight: 8 }}>
                  {req.method}
                </span>
                {req.name}
              </div>
            ))}
          </div>
        ))}
        {collections.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#858585' }}>
            No collections yet.<br />
            Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}
