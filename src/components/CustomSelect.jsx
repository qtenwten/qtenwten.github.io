import { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

export function CustomSelect({ value, onChange, options, id, 'aria-label': ariaLabel, 'aria-invalid': ariaInvalid, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } })
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        setIsOpen(prev => !prev)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          const currentIndex = options.findIndex(opt => opt.value === value)
          const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0
          onChange({ target: { value: options[nextIndex].value } })
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (isOpen) {
          const currentIndex = options.findIndex(opt => opt.value === value)
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1
          onChange({ target: { value: options[prevIndex].value } })
        }
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className={`custom-select ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
    >
      <button
        type="button"
        id={id}
        className="custom-select__trigger"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        disabled={disabled}
      >
        <span className="custom-select__value">
          {selectedOption ? selectedOption.label : ''}
        </span>
        <span className="custom-select__arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          className="custom-select__dropdown"
          role="listbox"
          aria-activedescendant={value ? `option-${value}` : undefined}
        >
          {options.map((option) => (
            <li
              key={option.value}
              id={`option-${option.value}`}
              className={`custom-select__option ${option.value === value ? 'is-selected' : ''}`}
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelect(option.value)
                }
              }}
              tabIndex={0}
            >
              {option.label}
              {option.value === value && (
                <span className="custom-select__check" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
