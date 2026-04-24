import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import SEO from '../components/SEO'
import CopyButton from '../components/CopyButton'
import RelatedTools from '../components/RelatedTools'
import Icon from '../components/Icon'
import { ResultNotice } from '../components/ResultSection'
import ToolDescriptionSection, { ToolFaq } from '../components/ToolDescriptionSection'
import { generatePassword, calculatePasswordStrength } from '../utils/passwordGenerator'
import { analytics } from '../utils/analytics'
import './PasswordGenerator.css'

function PasswordGenerator() {
  const { t, language } = useLanguage()
  const [rawPassword, setRawPassword] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: false,
    excludeSimilar: false,
    excludeChars: '',
    formatted: true
  })
  const [showPassword, setShowPassword] = useState(true)
  const [strength, setStrength] = useState({ score: 0, label: '', color: '' })
  const [generationError, setGenerationError] = useState('')

  const displayPassword = useMemo(() => {
    if (!rawPassword) return ''
    if (options.formatted) {
      return rawPassword.match(/.{1,4}/g)?.join('-') || rawPassword
    }
    return rawPassword
  }, [rawPassword, options.formatted])

  const strengthLabels = useMemo(() => ({
    'Very Weak': t('passwordGenerator.strengthLevels.veryWeak'),
    'Weak': t('passwordGenerator.strengthLevels.weak'),
    'Medium': t('passwordGenerator.strengthLevels.medium'),
    'Strong': t('passwordGenerator.strengthLevels.strong'),
    'Very Strong': t('passwordGenerator.strengthLevels.veryStrong')
  }), [t])

  const errorMessages = useMemo(() => language === 'en'
    ? {
        NO_CHARSET_SELECTED: 'Select at least one character type',
        INVALID_LENGTH: 'Password length must be between 6 and 64 characters'
      }
    : {
        NO_CHARSET_SELECTED: 'Выберите хотя бы один тип символов',
        INVALID_LENGTH: 'Длина должна быть от 6 до 64 символов'
      }
  , [language])

  const updateStrength = useCallback((password, labels, activeOptions) => {
    const strengthResult = calculatePasswordStrength(password, activeOptions)
    setStrength({
      ...strengthResult,
      label: labels[strengthResult.label] || strengthResult.label
    })
  }, [])

  const generateAndUpdate = useCallback((lengthValue, optionsValue, labels) => {
    const result = generatePassword({ length: lengthValue, ...optionsValue })
    if (!result.error) {
      setRawPassword(result.password)
      const activeOptions = {
        lowercase: optionsValue.lowercase,
        uppercase: optionsValue.uppercase,
        numbers: optionsValue.numbers,
        symbols: optionsValue.symbols
      }
      updateStrength(result.password, labels, activeOptions)
    }
    return result
  }, [updateStrength])

  useEffect(() => {
    generateAndUpdate(length, options, strengthLabels)
  }, [])

  useEffect(() => {
    if (rawPassword) {
      const activeOptions = {
        lowercase: options.lowercase,
        uppercase: options.uppercase,
        numbers: options.numbers,
        symbols: options.symbols
      }
      updateStrength(rawPassword, strengthLabels, activeOptions)
    }
  }, [language, rawPassword, strengthLabels, options, updateStrength])

  const handleGenerateInitial = () => {
    generateAndUpdate(length, options, strengthLabels)
  }

  const handleGenerate = () => {
    const result = generateAndUpdate(length, options, strengthLabels)
    if (result.error) {
      setGenerationError(errorMessages[result.error] || result.error)
    } else {
      setGenerationError('')
      analytics.trackPasswordGenerated(length, options.symbols, options.numbers, {
        has_uppercase: options.uppercase,
        has_lowercase: options.lowercase,
        strength_score: strength.score,
      })
    }
  }

  const handleOptionChange = (key, value) => {
    const newOptions = { ...options, [key]: value }
    setOptions(newOptions)
    if (key !== 'formatted') {
      generateAndUpdate(length, newOptions, strengthLabels)
    }
  }

  const handleSliderChange = (newLength) => {
    setLength(newLength)
    generateAndUpdate(newLength, options, strengthLabels)
  }

  const strengthPercentage = (strength.score / 4) * 100

  const faqItems = t('passwordGenerator.info.faqTitle')
    ? [
        { q: t('passwordGenerator.info.faqList.q1'), a: t('passwordGenerator.info.faqList.a1') },
        { q: t('passwordGenerator.info.faqList.q2'), a: t('passwordGenerator.info.faqList.a2') },
        { q: t('passwordGenerator.info.faqList.q3'), a: t('passwordGenerator.info.faqList.a3') },
        { q: t('passwordGenerator.info.faqList.q4'), a: t('passwordGenerator.info.faqList.a4') },
        { q: t('passwordGenerator.info.faqList.q5'), a: t('passwordGenerator.info.faqList.a5') },
      ]
    : []

  return (
    <>
      <SEO
        title={t('seo.passwordGenerator.title')}
        description={t('seo.passwordGenerator.description')}
        path={`/${language}/password-generator`}
        keywords={t('seo.passwordGenerator.keywords')}
      />

      <div className="tool-container">
        <h1>{t('passwordGenerator.title')}</h1>
        <p>{t('passwordGenerator.subtitle')}</p>

        <div className="password-display">
          <div className="password-field">
            <div className="password-value">
              {showPassword ? displayPassword : '•'.repeat(rawPassword.length)}
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-visibility"
              title={showPassword ? t('passwordGenerator.hide') : t('passwordGenerator.show')}
            >
              <Icon name={showPassword ? 'visibility' : 'visibility_off'} size={22} />
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
          {generationError && (
            <ResultNotice tone="error" className="password-generation-error">
              {generationError}
            </ResultNotice>
          )}

          <div className="password-actions">
            <button onClick={handleGenerate} className="btn-primary">
              <Icon name="refresh" size={18} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
              {t('passwordGenerator.generate')}
            </button>
            <CopyButton text={displayPassword} analytics={{ toolSlug: 'password-generator', linkType: 'result' }} />
          </div>
        </div>

        <div className="settings-panel">
          <div className="field">
            <label htmlFor="length" className="length-label">
              {t('passwordGenerator.length')}: <span className="length-value">{rawPassword.length}</span> {t('passwordGenerator.symbols')}
              {options.formatted && rawPassword && (
                <span className="length-formatted"> / {displayPassword.length} {t('passwordGenerator.withFormat')}</span>
              )}
            </label>
            <div className="length-slider-container">
              <input
                id="length"
                type="range"
                min="6"
                max="64"
                value={length}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="length-slider"
              />
              <div className="length-ticks">
                <span>6</span>
                <span>16</span>
                <span>32</span>
                <span>64</span>
              </div>
            </div>
          </div>

          <div className="options-grid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.lowercase}
                onChange={(e) => handleOptionChange('lowercase', e.target.checked)}
              />
              <span>{t('passwordGenerator.options.lowercase')}</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.uppercase}
                onChange={(e) => handleOptionChange('uppercase', e.target.checked)}
              />
              <span>{t('passwordGenerator.options.uppercase')}</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.numbers}
                onChange={(e) => handleOptionChange('numbers', e.target.checked)}
              />
              <span>{t('passwordGenerator.options.numbers')}</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.symbols}
                onChange={(e) => handleOptionChange('symbols', e.target.checked)}
              />
              <span>{t('passwordGenerator.options.symbols')}</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.excludeSimilar}
                onChange={(e) => handleOptionChange('excludeSimilar', e.target.checked)}
              />
              <span>{t('passwordGenerator.options.excludeSimilar')}</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.formatted}
                onChange={(e) => handleOptionChange('formatted', e.target.checked)}
              />
              <span>{t('passwordGenerator.options.formatted')}</span>
            </label>
          </div>

          <div className="field">
            <label htmlFor="excludeChars">{t('passwordGenerator.options.excludeChars')}</label>
            <input
              id="excludeChars"
              type="text"
              value={options.excludeChars}
              onChange={(e) => handleOptionChange('excludeChars', e.target.value)}
              placeholder={t('passwordGenerator.options.excludeCharsPlaceholder')}
            />
          </div>
        </div>

        <ToolDescriptionSection>
          <h2>{t('passwordGenerator.info.title')}</h2>
          <p>{t('passwordGenerator.info.description')}</p>

          {t('passwordGenerator.info.howToTitle') && (
            <>
              <h3>{t('passwordGenerator.info.howToTitle')}</h3>
              <ol>
                <li>{t('passwordGenerator.info.howToList.step1')}</li>
                <li>{t('passwordGenerator.info.howToList.step2')}</li>
                <li>{t('passwordGenerator.info.howToList.step3')}</li>
              </ol>

              <h3>{t('passwordGenerator.info.whereTitle')}</h3>
              <ul>
                <li>{t('passwordGenerator.info.whereList.mail')}</li>
                <li>{t('passwordGenerator.info.whereList.banking')}</li>
                <li>{t('passwordGenerator.info.whereList.wifi')}</li>
                <li>{t('passwordGenerator.info.whereList.work')}</li>
              </ul>
            </>
          )}

          <h3>{t('passwordGenerator.info.recommendations')}</h3>
          <ul>
            <li>{t('passwordGenerator.info.recommendationsList.banking')}</li>
            <li>{t('passwordGenerator.info.recommendationsList.email')}</li>
            <li>{t('passwordGenerator.info.recommendationsList.wifi')}</li>
            <li>{t('passwordGenerator.info.recommendationsList.games')}</li>
          </ul>

          <h3>{t('passwordGenerator.info.securityTips')}</h3>
          <ul>
            <li>{t('passwordGenerator.info.securityTipsList.unique')}</li>
            <li>{t('passwordGenerator.info.securityTipsList.noPersonal')}</li>
            <li>{t('passwordGenerator.info.securityTipsList.manager')}</li>
            <li>{t('passwordGenerator.info.securityTipsList.twoFactor')}</li>
            <li>{t('passwordGenerator.info.securityTipsList.change')}</li>
          </ul>

          <h3>{t('passwordGenerator.info.formatTitle')}</h3>
          <p>{t('passwordGenerator.info.formatDescription')}</p>

          <h4>{t('passwordGenerator.info.formatScenariosTitle')}</h4>
          <ul>
            <li>{t('passwordGenerator.info.formatScenarios.handTyping')}</li>
            <li>{t('passwordGenerator.info.formatScenarios.writing')}</li>
            <li>{t('passwordGenerator.info.formatScenarios.reading')}</li>
            <li>{t('passwordGenerator.info.formatScenarios.comparing')}</li>
          </ul>

          <ToolFaq title={t('passwordGenerator.info.faqTitle')} items={faqItems} />
        </ToolDescriptionSection>

        <RelatedTools currentPath={`/${language}/password-generator`} />
      </div>
    </>
  )
}

export default PasswordGenerator