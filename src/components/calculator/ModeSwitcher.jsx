function ModeSwitcher({ mode, setMode, t }) {
  const modes = [
    { id: 'calculator', label: t('calculator.modes.calculator'), icon: 'calculate' },
    { id: 'graph', label: t('calculator.modes.graph'), icon: 'show_chart' },
    { id: 'split', label: t('calculator.modes.both'), icon: 'dashboard' }
  ]

  return (
    <div className="mode-switcher">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={mode === m.id ? 'active' : 'secondary'}
        >
          <span className="material-symbols-outlined mode-icon">{m.icon}</span>
          <span className="mode-label">{m.label}</span>
        </button>
      ))}
    </div>
  )
}

export default ModeSwitcher
