#!/bin/bash

# Функция для добавления импорта useLanguage в начало файла
add_import() {
  local file=$1
  if ! grep -q "useLanguage" "$file"; then
    sed -i "1i import { useLanguage } from '../contexts/LanguageContext'" "$file"
  fi
}

# Функция для добавления const { language } = useLanguage() после function
add_hook() {
  local file=$1
  local func_name=$2
  if ! grep -q "useLanguage()" "$file"; then
    sed -i "/function ${func_name}() {/a\  const { t, language } = useLanguage()" "$file"
  fi
}

# Обработка каждой страницы
for page in Calculator CompoundInterest MetaTagsGenerator NumberToWords QRCodeGenerator RandomNumber SEOAudit SEOAuditPro TimeCalculator URLShortener; do
  echo "Processing $page..."
  add_import "${page}.jsx"
  add_hook "${page}.jsx" "$page"
done

echo "Done!"
