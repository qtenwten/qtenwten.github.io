import {
  GENDER_UNKNOWN,
  GREETING_NAME_PATRONYMIC,
  PUNCTUATION_EXCLAMATION,
  DOCUMENT_TEMPLATE_BUSINESS_LETTER,
  WARNING_CODES,
} from './addresseeTypes.js';

import {
  mapScenarioToDocumentTemplate,
  resolveAddresseeProfile,
  resolveAddresseeScenario,
} from './addresseeProfiles.js';

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function getInputSource(input) {
  if (!input || typeof input !== 'object') return {};
  if (input.data && typeof input.data === 'object' && input.fullName === undefined) {
    return input.data;
  }
  return input;
}

export function normalizeAddresseeInput(input) {
  const source = getInputSource(input);
  const scenario = resolveAddresseeScenario(source);
  const profile = resolveAddresseeProfile({ ...source, scenario });
  const documentTemplate = firstDefined(
    source.documentTemplate,
    source.format?.documentTemplate,
    mapScenarioToDocumentTemplate(scenario.id),
    DOCUMENT_TEMPLATE_BUSINESS_LETTER
  );

  return {
    profile,
    scenario,
    recipient: {
      fullName: firstDefined(source.fullName, source.recipient?.fullName, ''),
      position: firstDefined(source.position, source.recipient?.position, ''),
      organization: firstDefined(source.organization, source.recipient?.organization, ''),
      gender: firstDefined(source.gender, source.recipient?.gender, GENDER_UNKNOWN),
    },
    sender: {
      fullName: firstDefined(source.senderFullName, source.sender?.fullName, ''),
      position: firstDefined(source.senderPosition, source.sender?.position, ''),
      organization: firstDefined(source.senderOrganization, source.sender?.organization, ''),
    },
    manualCases: {
      recipientDativeName: firstDefined(
        source.recipientDativeName,
        source.manualCases?.recipientDativeName,
        ''
      ),
      senderGenitiveName: firstDefined(
        source.senderGenitiveName,
        source.manualCases?.senderGenitiveName,
        ''
      ),
    },
    format: {
      greetingMode: firstDefined(
        source.greetingMode,
        source.format?.greetingMode,
        GREETING_NAME_PATRONYMIC
      ),
      punctuation: firstDefined(
        source.punctuation,
        source.format?.punctuation,
        PUNCTUATION_EXCLAMATION
      ),
      documentTemplate,
    },
    exportOptions: {
      includeWarnings: firstDefined(
        source.includeWarnings,
        source.exportOptions?.includeWarnings,
        profile.exportDefaults?.includeWarnings,
        true
      ),
    },
    originalInput: source,
  };
}

export function buildLegacyInputFromNormalized(normalizedInput) {
  const normalized = normalizedInput || normalizeAddresseeInput({});
  const scenarioTemplate = normalized.scenario
    ? mapScenarioToDocumentTemplate(normalized.scenario.id)
    : DOCUMENT_TEMPLATE_BUSINESS_LETTER;

  return {
    fullName: normalized.recipient?.fullName || '',
    position: normalized.recipient?.position || '',
    organization: normalized.recipient?.organization || '',
    gender: normalized.recipient?.gender || GENDER_UNKNOWN,
    greetingMode: normalized.format?.greetingMode || GREETING_NAME_PATRONYMIC,
    punctuation: normalized.format?.punctuation || PUNCTUATION_EXCLAMATION,
    documentTemplate: normalized.format?.documentTemplate || scenarioTemplate,
    senderFullName: normalized.sender?.fullName || '',
    senderPosition: normalized.sender?.position || '',
    senderOrganization: normalized.sender?.organization || '',
    recipientDativeName: normalized.manualCases?.recipientDativeName || '',
    senderGenitiveName: normalized.manualCases?.senderGenitiveName || '',
  };
}

function getWarningMetadata(code) {
  const defaultMetadata = {
    severity: 'warning',
    field: 'general',
    suggestion: null,
  };

  const map = {
    [WARNING_CODES.INCOMPLETE_NAME]: {
      field: 'recipient.fullName',
      suggestion: 'Укажите фамилию, имя и отчество либо проверьте форму вручную.',
    },
    [WARNING_CODES.UNKNOWN_GENDER]: {
      field: 'recipient.gender',
      suggestion: 'Укажите пол адресата, если обращение должно быть персональным.',
    },
    [WARNING_CODES.AUTO_DETECTED_GENDER]: {
      field: 'recipient.gender',
      suggestion: 'Проверьте автоматически выбранный род обращения.',
    },
    [WARNING_CODES.UNDECLINABLE_SURNAME]: {
      field: 'recipient.fullName',
      suggestion: 'Проверьте склонение фамилии вручную или задайте ручную форму.',
    },
    [WARNING_CODES.UNKNOWN_POSITION]: {
      field: 'recipient.position',
      suggestion: 'Проверьте падеж должности вручную, если формулировка важна.',
    },
    [WARNING_CODES.ORGANIZATION_ABBREVIATION]: {
      field: 'recipient.organization',
      suggestion: 'Проверьте официальное написание организации и кавычки.',
    },
    [WARNING_CODES.EXTRA_NAME_PARTS]: {
      field: 'recipient.fullName',
      suggestion: 'Проверьте порядок частей ФИО и уберите лишние уточнения.',
    },
    [WARNING_CODES.LATIN_NAME]: {
      field: 'recipient.fullName',
      suggestion: 'Проверьте написание и склонение имени вручную.',
    },
    [WARNING_CODES.INITIALS_DETECTED]: {
      field: 'recipient.fullName',
      suggestion: 'Для точного обращения лучше указать полное имя и отчество.',
    },
    [WARNING_CODES.HYPHENATED_NAME_REVIEW]: {
      field: 'recipient.fullName',
      suggestion: 'Проверьте форму имени или фамилии с дефисом вручную.',
    },
    [WARNING_CODES.TEMPLATE_REVIEW]: {
      field: 'format.documentTemplate',
      suggestion: 'Проверьте текст документа перед отправкой.',
    },
    [WARNING_CODES.NAME_CASE_MANUAL]: {
      field: 'manualCases',
      suggestion: 'Убедитесь, что ручная форма соответствует нужному падежу.',
    },
    [WARNING_CODES.NAME_CASE_UNCERTAIN]: {
      field: 'recipient.fullName',
      suggestion: 'Задайте ручную форму, если автоматическое склонение спорно.',
    },
  };

  return {
    ...defaultMetadata,
    ...(map[code] || {}),
  };
}

export function normalizeAddresseeWarning(warning, context = {}) {
  const source = warning && typeof warning === 'object'
    ? warning
    : { code: 'GENERAL_WARNING', message: String(warning || '') };
  const metadata = getWarningMetadata(source.code, context);

  return {
    ...source,
    code: source.code || 'GENERAL_WARNING',
    severity: source.severity || metadata.severity || 'warning',
    field: source.field ?? metadata.field ?? 'general',
    message: source.message || '',
    suggestion: source.suggestion ?? metadata.suggestion ?? null,
  };
}

export function normalizeAddresseeWarnings(warnings, context = {}) {
  if (!Array.isArray(warnings)) return [];
  return warnings.map((warning) => normalizeAddresseeWarning(warning, context));
}

export function getConfidenceLabel(confidence) {
  if (typeof confidence !== 'number') return 'low';
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

function hasWarning(warnings, code) {
  return warnings.some((warning) => warning.code === code);
}

function hasAnyWarning(warnings, codes) {
  return warnings.some((warning) => codes.includes(warning.code));
}

function addExplanation(explanations, explanation) {
  if (!explanation || explanations.some((item) => item.code === explanation.code)) return;
  explanations.push(explanation);
}

function buildAddresseeExplanations(warnings, normalizedInput) {
  if (normalizedInput?.profile?.language !== 'ru') return [];

  const explanations = [];

  addExplanation(explanations, {
    code: 'RECIPIENT_DATIVE_USED',
    title: 'Почему используется дательный падеж',
    text: 'В блоке "Кому" используется дательный падеж, потому что формальный адресат отвечает на вопрос "кому?".',
    relatedField: 'recipient.fullName',
  });

  const hasSender = Boolean(
    normalizedInput?.sender?.fullName ||
    normalizedInput?.sender?.position ||
    normalizedInput?.sender?.organization ||
    normalizedInput?.manualCases?.senderGenitiveName
  );

  if (hasSender) {
    addExplanation(explanations, {
      code: 'SENDER_GENITIVE_USED',
      title: 'Почему используется родительный падеж',
      text: 'В блоке "От кого" используется родительный падеж, потому что отправитель отвечает на вопрос "от кого?".',
      relatedField: 'sender.fullName',
    });
  }

  if (normalizedInput?.manualCases?.recipientDativeName) {
    addExplanation(explanations, {
      code: 'MANUAL_RECIPIENT_CASE_USED',
      title: 'Использована ручная форма адресата',
      text: 'Для блока "Кому" взята ручная форма, поэтому автоматическое склонение имени адресата не применялось.',
      relatedField: 'manualCases.recipientDativeName',
    });
  }

  if (normalizedInput?.manualCases?.senderGenitiveName) {
    addExplanation(explanations, {
      code: 'MANUAL_SENDER_CASE_USED',
      title: 'Использована ручная форма отправителя',
      text: 'Для блока "От кого" взята ручная форма, поэтому автоматическое склонение имени отправителя не применялось.',
      relatedField: 'manualCases.senderGenitiveName',
    });
  }

  if (hasWarning(warnings, WARNING_CODES.UNKNOWN_POSITION)) {
    addExplanation(explanations, {
      code: 'UNKNOWN_POSITION_REVIEW',
      title: 'Должность требует проверки',
      text: 'Должность не найдена в текущем словаре, поэтому ее падеж лучше проверить вручную.',
      relatedField: 'recipient.position',
    });
  }

  if (hasAnyWarning(warnings, [
    WARNING_CODES.INITIALS_DETECTED,
    WARNING_CODES.LATIN_NAME,
    WARNING_CODES.HYPHENATED_NAME_REVIEW,
    WARNING_CODES.NAME_CASE_UNCERTAIN,
    WARNING_CODES.UNDECLINABLE_SURNAME,
    WARNING_CODES.EXTRA_NAME_PARTS,
  ])) {
    addExplanation(explanations, {
      code: 'RISKY_NAME_REVIEW',
      title: 'ФИО требует проверки',
      text: 'В имени есть признак спорного склонения, поэтому результат следует проверить вручную или задать ручную форму.',
      relatedField: 'recipient.fullName',
    });
  }

  if (hasWarning(warnings, WARNING_CODES.UNKNOWN_GENDER)) {
    addExplanation(explanations, {
      code: 'UNKNOWN_GENDER_REVIEW',
      title: 'Род обращения требует проверки',
      text: 'Пол адресата не указан, поэтому персональное обращение может требовать ручной проверки.',
      relatedField: 'recipient.gender',
    });
  }

  return explanations;
}

export function buildEnhancedResult(legacyResult, normalizedInput, context = {}) {
  const sourceResult = legacyResult || {};
  const legacyBlocks = sourceResult.blocks || {};
  const warnings = normalizeAddresseeWarnings(sourceResult.warnings || [], {
    ...context,
    normalizedInput,
  });
  const blocks = {
    ...legacyBlocks,
    to: legacyBlocks.to || '',
    from: legacyBlocks.from || '',
    greeting: legacyBlocks.greeting || '',
    letter: legacyBlocks.letter || '',
    documentText: legacyBlocks.documentText || '',
  };

  blocks.toBlock = blocks.to;
  blocks.fromBlock = blocks.from;
  blocks.salutation = blocks.greeting;
  blocks.documentHeader = blocks.letter;
  blocks.fullPreview = blocks.documentText;

  const confidenceLabel = getConfidenceLabel(sourceResult.confidence);

  return {
    ...sourceResult,
    profile: normalizedInput?.profile,
    scenario: normalizedInput?.scenario,
    blocks,
    warnings,
    explanations: buildAddresseeExplanations(warnings, normalizedInput),
    confidence: sourceResult.confidence,
    confidenceLabel,
    manualReviewRequired: Boolean(sourceResult.manualReviewRequired),
    parsedName: sourceResult.parsedName,
    exportData: {
      profileId: normalizedInput?.profile?.id || null,
      scenarioId: normalizedInput?.scenario?.id || null,
      documentTemplate: normalizedInput?.format?.documentTemplate || null,
      includeWarnings: normalizedInput?.exportOptions?.includeWarnings ?? true,
      blocks,
      warnings,
      confidence: sourceResult.confidence,
      confidenceLabel,
    },
  };
}

export function adaptEnhancedResultToLegacy(enhancedResult) {
  const result = enhancedResult || {};
  const blocks = result.blocks || {};

  return {
    ...result,
    blocks: {
      ...blocks,
      to: blocks.to || '',
      from: blocks.from || '',
      greeting: blocks.greeting || '',
      letter: blocks.letter || '',
      documentText: blocks.documentText || '',
      toBlock: blocks.toBlock ?? blocks.to ?? '',
      fromBlock: blocks.fromBlock ?? blocks.from ?? '',
      salutation: blocks.salutation ?? blocks.greeting ?? '',
      documentHeader: blocks.documentHeader ?? blocks.letter ?? '',
      fullPreview: blocks.fullPreview ?? blocks.documentText ?? '',
    },
    warnings: normalizeAddresseeWarnings(result.warnings || []),
    confidenceLabel: result.confidenceLabel || getConfidenceLabel(result.confidence),
    explanations: Array.isArray(result.explanations) ? result.explanations : [],
  };
}
