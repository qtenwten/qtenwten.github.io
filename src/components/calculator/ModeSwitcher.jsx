function ModeSwitcher({ mode, setMode }) {
  const modes = [
    { id: 'calculator', label: 'Калькулятор', icon: '🧮' },
    { id: 'graph', label: 'График', icon: '📈' },
    { id: 'split', label: 'Оба', icon: '⚡' }
  ]

  return (
    <div className="mode-switcher">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={mode === m.id ? 'active' : 'secondary'}
        >
          <span className="mode-icon">{m.icon}</span>
          <span className="mode-label">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ModeSwitcher
