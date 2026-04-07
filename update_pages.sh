#!/bin/bash

# Список страниц для обновления
pages=(
  "NumberToWords:numberToWords"
  "Calculator:calculator"
  "TimeCalculator:timeCalculator"
  "CompoundInterest:compoundInterest"
  "RandomNumber:randomNumber"
  "QRCodeGenerator:qrCodeGenerator"
  "URLShortener:urlShortener"
  "MetaTagsGenerator:metaTagsGenerator"
  "SEOAudit:seoAudit"
  "SEOAuditPro:seoAuditPro"
  "Feedback:feedback"
)

for page_info in "${pages[@]}"; do
  IFS=':' read -r page_name key <<< "$page_info"
  file="src/pages/${page_name}.jsx"
  
  echo "Processing $file..."
  
  # Добавляем импорт useLanguage если его нет
  if ! grep -q "useLanguage" "$file"; then
    sed -i "1i import { useLanguage } from '../contexts/LanguageContext'" "$file"
  fi
  
  # Добавляем const { t, language } = useLanguage() в начало компонента
  # (это упрощенная версия, в реальности нужно более точное редактирование)
  
done

echo "Done!"
