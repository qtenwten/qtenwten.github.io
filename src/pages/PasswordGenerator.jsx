import { useState, useEffect } from 'react'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import { generatePassword, calculatePasswordStrength } from '../utils/passwordGenerator'
import './PasswordGenerator.css'

function PasswordGenerator() {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeSimilar: false,
    excludeChars: ''
  })
  const [showPassword, setShowPassword] = useState(true)
  const [strength, setStrength] = useState({ score: 0, label: '', color: '' })

  useEffect(() => {
    // Генерируем первый пароль при загрузке
    handleGenerateInitial()
  }, [])

  const handleGenerateInitial = () => {
    const result = generatePassword({ length, ...options })
    if (!result.error) {
      setPassword(result.password)
    }
  }

  useEffect(() => {
    if (password) {
      setStrength(calculatePasswordStrength(password))
    }
  }, [password])

  const handleGenerate = () => {
    const result = generatePassword({ length, ...options })
    if (result.error) {
      alert(result.error)
      return
    }
    setPassword(result.password)
  }


  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const strengthPercentage = (strength.score / 4) * 100

  return (
    <>
      <SEO
        title="Генератор паролей онлайн - Создать надежный пароль бесплатно"
        description="Безопасный генератор паролей онлайн. Создайте надежный пароль с настройкой длины, символов и сложности. Криптографически безопасная генерация."
        path="/password-generator"
        keywords="генератор паролей, создать пароль онлайн, надежный пароль, генератор паролей онлайн, сложный пароль"
      />

      <div className="tool-container">
        <h1>Генератор паролей</h1>
        <p>Создайте надежный пароль с криптографической защитой</p>

        <div className="password-display">
          <div className="password-field">
            <div className="password-value">
              {showPassword ? password : '••••••••••••••••'}
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-visibility"
              title={showPassword ? 'Скрыть' : 'Показать'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          <div className="strength-indicator">
            <div className="strength-bar">
              <div
                className="strength-fill"
                style={{
                  width: `${strengthPercentage}%`,
                  backgroundColor: strength.color
                }}
              />
            </div>
            <span className="strength-label" style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>

          <div className="password-actions">
            <button onClick={handleGenerate} className="btn-primary">
              🔄 Сгенерировать
            </button>
            <CopyButton text={password} />
          </div>
        </div>

        <div className="settings-panel">
          <div className="field">
            <label htmlFor="length">
              Длина пароля: <strong>{length}</strong> символов
            </label>
            <input
              id="length"
              type="range"
              min="6"
              max="64"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="length-slider"
            />
            <div className="length-marks">
              <span>6</span>
              <span>16</span>
              <span>32</span>
              <span>64</span>
            </div>
          </div>

          <div className="options-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.lowercase}
                onChange={(e) => handleOptionChange('lowercase', e.target.checked)}
              />
              <span>Строчные буквы (a-z)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.uppercase}
                onChange={(e) => handleOptionChange('uppercase', e.target.checked)}
              />
              <span>Заглавные буквы (A-Z)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.numbers}
                onChange={(e) => handleOptionChange('numbers', e.target.checked)}
              />
              <span>Цифры (0-9)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.symbols}
                onChange={(e) => handleOptionChange('symbols', e.target.checked)}
              />
              <span>Символы (!@#$%^&*)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.excludeSimilar}
                onChange={(e) => handleOptionChange('excludeSimilar', e.target.checked)}
              />
              <span>Исключить похожие (0/O, l/I, 1)</span>
            </label>
          </div>

          <div className="field">
            <label htmlFor="excludeChars">Исключить символы (необязательно)</label>
            <input
              id="excludeChars"
              type="text"
              value={options.excludeChars}
              onChange={(e) => handleOptionChange('excludeChars', e.target.value)}
              placeholder="Например: {}[]"
            />
          </div>
        </div>

        <div className="info-section">
          <h2>Безопасный генератор паролей</h2>
          <p>
            Наш генератор использует криптографически безопасный алгоритм (crypto.getRandomValues)
            для создания надежных паролей. Все пароли генерируются локально в вашем браузере
            и никогда не отправляются на сервер.
          </p>

          <h3>Рекомендации по использованию:</h3>
          <ul>
            <li><strong>Для банков и финансов:</strong> минимум 16 символов, все типы символов</li>
            <li><strong>Для email и соцсетей:</strong> минимум 12 символов, буквы и цифры</li>
            <li><strong>Для WiFi:</strong> минимум 16 символов, без похожих символов</li>
            <li><strong>Для игр и форумов:</strong> минимум 10 символов</li>
          </ul>

          <h3>Советы по безопасности:</h3>
          <ul>
            <li>Используйте уникальный пароль для каждого сайта</li>
            <li>Не используйте личную информацию в паролях</li>
            <li>Храните пароли в менеджере паролей</li>
            <li>Включайте двухфакторную аутентификацию где возможно</li>
            <li>Меняйте пароли каждые 3-6 месяцев для важных аккаунтов</li>
          </ul>
        </div>

        <RelatedTools currentPath="/password-generator" />
      </div>
    </>
  )
}

export default PasswordGenerator
