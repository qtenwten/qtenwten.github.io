#!/bin/bash

# Обновляем SEO и RelatedTools для каждой страницы
declare -A pages=(
  ["Calculator"]="calculator"
  ["CompoundInterest"]="compoundInterest"
  ["MetaTagsGenerator"]="metaTagsGenerator"
  ["NumberToWords"]="numberToWords"
  ["QRCodeGenerator"]="qrCodeGenerator"
  ["RandomNumber"]="randomNumber"
  ["SEOAudit"]="seoAudit"
  ["SEOAuditPro"]="seoAuditPro"
  ["TimeCalculator"]="timeCalculator"
  ["URLShortener"]="urlShortener"
)

for page in "${!pages[@]}"; do
  key="${pages[$page]}"
  file="${page}.jsx"
  
  echo "Updating $file..."
  
  # Заменяем path в SEO на динамический с языком
  sed -i "s|path=\"/[^\"]*\"|path={\`/\${language}/${key/([A-Z])/-\L\1}\`}|g" "$file" 2>/dev/null || true
  
  # Заменяем currentPath в RelatedTools
  sed -i "s|currentPath=\"/[^\"]*\"|currentPath={\`/\${language}/${key/([A-Z])/-\L\1}\`}|g" "$file" 2>/dev/null || true
  
done

echo "Done!"
