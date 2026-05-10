const DRAFT_STORAGE_KEY = 'qsen_addr_form_draft_v1';
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function isSessionStorageAvailable() {
  try {
    const testKey = '__draft_test__';
    sessionStorage.setItem(testKey, '1');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function isAddresseeDraftStorageAvailable() {
  return isSessionStorageAvailable();
}

export function sanitizeAddresseeDraft(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  return {
    scenario: typeof data.scenario === 'string' ? data.scenario : null,
    profile: typeof data.profile === 'string' ? data.profile : null,
    documentTemplate: typeof data.documentTemplate === 'string' ? data.documentTemplate : null,
    fullName: typeof data.fullName === 'string' ? data.fullName.trim() : '',
    position: typeof data.position === 'string' ? data.position.trim() : '',
    organization: typeof data.organization === 'string' ? data.organization.trim() : '',
    gender: typeof data.gender === 'string' ? data.gender : 'unknown',
    senderFullName: typeof data.senderFullName === 'string' ? data.senderFullName.trim() : '',
    senderPosition: typeof data.senderPosition === 'string' ? data.senderPosition.trim() : '',
    senderOrganization: typeof data.senderOrganization === 'string' ? data.senderOrganization.trim() : '',
    greetingMode: typeof data.greetingMode === 'string' ? data.greetingMode : 'namePatronymic',
    punctuation: typeof data.punctuation === 'string' ? data.punctuation : '!',
    recipientDativeName: typeof data.recipientDativeName === 'string' ? data.recipientDativeName.trim() : '',
    senderGenitiveName: typeof data.senderGenitiveName === 'string' ? data.senderGenitiveName.trim() : '',
  };
}

export function hasMeaningfulAddresseeDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    return false;
  }

  const hasRecipientData =
    (draft.fullName && draft.fullName.trim().length > 0) ||
    (draft.position && draft.position.trim().length > 0) ||
    (draft.organization && draft.organization.trim().length > 0);

  const hasSenderData =
    (draft.senderFullName && draft.senderFullName.trim().length > 0) ||
    (draft.senderPosition && draft.senderPosition.trim().length > 0) ||
    (draft.senderOrganization && draft.senderOrganization.trim().length > 0);

  return hasRecipientData || hasSenderData;
}

export function getAddresseeDraft() {
  if (!isSessionStorageAvailable()) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    if (typeof parsed.timestamp !== 'number') return null;

    const age = Date.now() - parsed.timestamp;
    if (age > DRAFT_TTL_MS) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    const sanitized = sanitizeAddresseeDraft(parsed.form);
    if (!sanitized) return null;

    return { form: sanitized, timestamp: parsed.timestamp };
  } catch {
    return null;
  }
}

export function saveAddresseeDraft(form) {
  if (!isSessionStorageAvailable()) {
    return false;
  }

  try {
    const sanitized = sanitizeAddresseeDraft(form);
    if (!sanitized) {
      return false;
    }

    const payload = JSON.stringify({
      form: sanitized,
      timestamp: Date.now(),
    });

    sessionStorage.setItem(DRAFT_STORAGE_KEY, payload);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_FILE_QUOTA_EXCEEDED') {
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
      }
    }
    return false;
  }
}

export function clearAddresseeDraft() {
  if (!isSessionStorageAvailable()) {
    return false;
  }

  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}