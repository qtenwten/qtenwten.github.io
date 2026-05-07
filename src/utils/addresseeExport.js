export function getEffectiveBlockText(result, overrides, key) {
  if (!result) return '';
  const effectiveOverrides = overrides || {};
  const override = effectiveOverrides[key];
  if (override !== null && override !== undefined) return override;
  return result.blocks?.[key] || '';
}

export function getEffectiveResult(result, overrides) {
  if (!result) return null;
  const effectiveOverrides = overrides || {};
  return {
    ...result,
    blocks: {
      ...result.blocks,
      to: getEffectiveBlockText(result, effectiveOverrides, 'to'),
      from: getEffectiveBlockText(result, effectiveOverrides, 'from'),
      greeting: getEffectiveBlockText(result, effectiveOverrides, 'greeting'),
      documentText: getEffectiveBlockText(result, effectiveOverrides, 'documentText'),
    },
  };
}

export function buildExportSections(result, overrides, labels) {
  const blocks = getEffectiveResult(result, overrides)?.blocks || {};
  const { to, from, greeting, documentText } = blocks;
  const sections = [];
  if (to) sections.push({ label: labels.to, content: to });
  if (from) sections.push({ label: labels.from, content: from });
  if (greeting) sections.push({ label: labels.greeting, content: greeting });
  if (documentText) sections.push({ label: labels.documentTemplate, content: documentText });
  return sections;
}

export function buildPlainTextExport(result, overrides, labels) {
  const sections = buildExportSections(result, overrides, labels);
  return sections.map((s) => `${s.label}:\n${s.content}`).join('\n\n');
}

export function buildHtmlExport(result, overrides, options = {}) {
  const { labels, lang = 'ru', templateTitle } = options;
  const sections = buildExportSections(result, overrides, labels);
  const bodyContent = sections
    .map((s) => `<h2>${escapeHtml(s.label)}</h2>\n<pre>${escapeHtml(s.content)}</pre>`)
    .join('\n');
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(templateTitle || labels.docxDocumentLabel || 'Документ')}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; line-height: 1.6; }
    h2 { font-size: 1.2em; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 20px; margin-top: 30px; }
    h2:first-child { margin-top: 0; }
    pre { white-space: pre-wrap; word-wrap: break-word; background: #f9f9f9; padding: 16px; border-radius: 6px; border: 1px solid #e0e0e0; }
    .disclaimer { margin-top: 30px; font-size: 0.85em; color: #888; }
  </style>
</head>
<body>
${bodyContent}
<p class="disclaimer">${escapeHtml(labels.disclaimer || '')}</p>
</body>
</html>`;
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeCsvValue(value) {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function toCsvRow(values) {
  return values.map(escapeCsvValue).join(';');
}

export function buildSingleCsvExport(result, form, overrides) {
  const blocks = getEffectiveResult(result, overrides)?.blocks || {};
  const header = [
    'fullName', 'position', 'organization', 'gender', 'greetingMode',
    'punctuation', 'documentTemplate', 'senderFullName', 'senderPosition',
    'senderOrganization', 'to', 'from', 'greeting', 'letter', 'documentText',
    'confidence', 'warnings',
  ];
  const row = [
    form.fullName || '',
    form.position || '',
    form.organization || '',
    form.gender || '',
    form.greetingMode || '',
    form.punctuation || '',
    form.documentTemplate || '',
    form.senderFullName || '',
    form.senderPosition || '',
    form.senderOrganization || '',
    blocks.to || '',
    blocks.from || '',
    blocks.greeting || '',
    result?.blocks?.letter || '',
    blocks.documentText || '',
    String(result?.confidence || ''),
    Array.isArray(result?.warnings) && result.warnings.length > 0
      ? result.warnings.map((w) => w.code).join('; ')
      : '',
  ];
  return '\uFEFF' + [header, row].map(toCsvRow).join('\r\n');
}

export function buildBulkCsvExport(results) {
  const header = [
    'fullName', 'position', 'organization', 'gender', 'greetingMode',
    'punctuation', 'documentTemplate', 'senderFullName', 'senderPosition',
    'senderOrganization', 'to', 'from', 'greeting', 'letter', 'documentText',
    'confidence', 'warnings',
  ];
  const rows = [header];
  for (const r of results) {
    const blocks = r.blocks || {};
    const rowData = [
      r.input?.fullName || '',
      r.input?.position || '',
      r.input?.organization || '',
      r.input?.gender || '',
      r.input?.greetingMode || '',
      r.input?.punctuation || '',
      r.input?.documentTemplate || '',
      r.input?.senderFullName || '',
      r.input?.senderPosition || '',
      r.input?.senderOrganization || '',
      blocks.to || '',
      blocks.from || '',
      blocks.greeting || '',
      blocks.letter || '',
      blocks.documentText || '',
      String(r.confidence || ''),
      Array.isArray(r.warnings) && r.warnings.length > 0
        ? r.warnings.map((w) => w.code).join('; ')
        : '',
    ];
    rows.push(rowData);
  }
  return '\uFEFF' + rows.map(toCsvRow).join('\r\n');
}

export function downloadBlob(blob, filename, delayMs = 1000) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (delayMs > 0) {
    window.setTimeout(() => URL.revokeObjectURL(url), delayMs);
  } else {
    URL.revokeObjectURL(url);
  }
}

export function downloadTextAsFile(text, filename, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

export function serializeWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return '';
  return warnings
    .map((warning) => [warning.code, warning.message].filter(Boolean).join(': '))
    .join(' | ');
}