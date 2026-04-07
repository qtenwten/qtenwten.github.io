function HistoryPanel({ history, onRestore, onClear }) {
  if (history.length === 0) {
    return null
  }

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>История</h3>
        <button onClick={onClear} className="secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          Очистить
        </button>
      </div>
      <div className="history-list">
        {history.map((item, index) => (
          <div
            key={index}
            className="history-item"
            onClick={() => onRestore(item)}
          >
            {item.type === 'calculation' ? (
              <>
                <span className="history-expr">{item.expression}</span>
                <span className="history-result">= {item.result}</span>
              </>
            ) : (
              <>
                <span className="history-type">📈</span>
                <span className="history-expr">y = {item.expression}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default HistoryPanel
