import { safeGetItem, safeSetItem, safeParseJSON } from './storage.js';

const PRESET_STORE_KEY = 'qsen_addr_presets';
const PRESET_VERSION = 1;
const RECIPIENT_LIMIT = 10;
const SENDER_LIMIT = 5;

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function isStorageAvailable() {
  try {
    const testKey = '__preset_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function getDefaultStore() {
  return {
    version: PRESET_VERSION,
    recipients: [],
    senders: [],
  };
}

export function getAddresseePresetStore() {
  if (!isStorageAvailable()) {
    return getDefaultStore();
  }

  const raw = safeGetItem(PRESET_STORE_KEY);
  const store = safeParseJSON(raw, null);

  if (!store || typeof store !== 'object') {
    return getDefaultStore();
  }

  if (store.version !== PRESET_VERSION) {
    return getDefaultStore();
  }

  if (!Array.isArray(store.recipients)) {
    return { ...store, recipients: [] };
  }

  if (!Array.isArray(store.senders)) {
    return { ...store, senders: [] };
  }

  return store;
}

function persistStore(store) {
  if (!isStorageAvailable()) {
    return false;
  }

  const json = JSON.stringify(store);
  return safeSetItem(PRESET_STORE_KEY, json);
}

export function isPresetStorageAvailable() {
  return isStorageAvailable();
}

export function sanitizePresetData(type, data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  if (type === 'recipient') {
    return {
      fullName: typeof data.fullName === 'string' ? data.fullName.trim() : '',
      position: typeof data.position === 'string' ? data.position.trim() : '',
      organization: typeof data.organization === 'string' ? data.organization.trim() : '',
      gender: typeof data.gender === 'string' ? data.gender : 'unknown',
      recipientDativeName: typeof data.recipientDativeName === 'string' ? data.recipientDativeName.trim() : '',
    };
  }

  if (type === 'sender') {
    return {
      senderFullName: typeof data.senderFullName === 'string' ? data.senderFullName.trim() : '',
      senderPosition: typeof data.senderPosition === 'string' ? data.senderPosition.trim() : '',
      senderOrganization: typeof data.senderOrganization === 'string' ? data.senderOrganization.trim() : '',
      senderGenitiveName: typeof data.senderGenitiveName === 'string' ? data.senderGenitiveName.trim() : '',
    };
  }

  return {};
}

export function getPresetLabel(type, data) {
  if (!data || typeof data !== 'object') {
    return type === 'recipient' ? 'Адресат' : 'Отправитель';
  }

  if (type === 'recipient') {
    const fullName = typeof data.fullName === 'string' ? data.fullName.trim() : '';
    if (fullName) return fullName;
    const position = typeof data.position === 'string' ? data.position.trim() : '';
    const organization = typeof data.organization === 'string' ? data.organization.trim() : '';
    if (position && organization) return `${position}, ${organization}`;
    if (position) return position;
    if (organization) return organization;
    return 'Адресат';
  }

  if (type === 'sender') {
    const fullName = typeof data.senderFullName === 'string' ? data.senderFullName.trim() : '';
    if (fullName) return fullName;
    const organization = typeof data.senderOrganization === 'string' ? data.senderOrganization.trim() : '';
    if (organization) return organization;
    return 'Отправитель';
  }

  return type === 'recipient' ? 'Адресат' : 'Отправитель';
}

function normalizePresetValue(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function getPresetDataSignature(type, data) {
  const sanitized = sanitizePresetData(type, data);
  const fields = type === 'recipient'
    ? ['fullName', 'position', 'organization', 'gender', 'recipientDativeName']
    : ['senderFullName', 'senderPosition', 'senderOrganization', 'senderGenitiveName'];

  return fields.map((field) => `${field}:${normalizePresetValue(sanitized[field])}`).join('|');
}

function findDuplicatePresetIndex(type, presets, data) {
  const signature = getPresetDataSignature(type, data);
  return presets.findIndex((preset) => getPresetDataSignature(type, preset.data) === signature);
}

export function buildRecipientPresetFromInput(input) {
  const sanitized = sanitizePresetData('recipient', input);
  const hasData = sanitized.fullName || sanitized.position || sanitized.organization;
  if (!hasData) return null;

  return {
    label: getPresetLabel('recipient', sanitized),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: sanitized,
  };
}

export function buildSenderPresetFromInput(input) {
  const sanitized = sanitizePresetData('sender', input);
  const hasData = sanitized.senderFullName || sanitized.senderPosition || sanitized.senderOrganization;
  if (!hasData) return null;

  return {
    label: getPresetLabel('sender', sanitized),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: sanitized,
  };
}

export function applyRecipientPresetToInput(input = {}, preset) {
  if (!preset || !preset.data) return { ...input };

  const { data } = preset;

  const recipientFields = {
    fullName: data.fullName || input.fullName || '',
    position: data.position || input.position || '',
    organization: data.organization || input.organization || '',
    gender: data.gender || input.gender || 'unknown',
  };

  if (data.recipientDativeName) {
    recipientFields.recipientDativeName = data.recipientDativeName;
  }

  return {
    ...input,
    ...recipientFields,
  };
}

export function applySenderPresetToInput(input = {}, preset) {
  if (!preset || !preset.data) return { ...input };

  const { data } = preset;

  const senderFields = {
    senderFullName: data.senderFullName || input.senderFullName || '',
    senderPosition: data.senderPosition || input.senderPosition || '',
    senderOrganization: data.senderOrganization || input.senderOrganization || '',
  };

  if (data.senderGenitiveName) {
    senderFields.senderGenitiveName = data.senderGenitiveName;
  }

  return {
    ...input,
    ...senderFields,
  };
}

export function getRecipientPresetCount() {
  const store = getAddresseePresetStore();
  return store.recipients.length;
}

export function getSenderPresetCount() {
  const store = getAddresseePresetStore();
  return store.senders.length;
}

export function saveAddresseePreset(type, presetData) {
  if (!presetData || typeof presetData !== 'object') {
    return { success: false, error: 'invalid_preset_data' };
  }

  const store = getAddresseePresetStore();
  const data = sanitizePresetData(type, presetData.data);

  const preset = {
    id: generateId(),
    label: presetData.label || getPresetLabel(type, data),
    createdAt: presetData.createdAt || Date.now(),
    updatedAt: Date.now(),
    data,
  };

  if (type === 'recipient') {
    const duplicateIndex = findDuplicatePresetIndex(type, store.recipients, data);
    if (duplicateIndex !== -1) {
      store.recipients[duplicateIndex] = {
        ...store.recipients[duplicateIndex],
        label: preset.label,
        updatedAt: Date.now(),
        data,
      };
      const persisted = persistStore(store);
      if (!persisted) {
        return { success: false, error: 'storage_failed' };
      }
      return { success: true, preset: store.recipients[duplicateIndex], duplicate: true };
    }

    if (store.recipients.length >= RECIPIENT_LIMIT) {
      return { success: false, error: 'limit_reached', limit: RECIPIENT_LIMIT };
    }
    if (store.recipients.length >= RECIPIENT_LIMIT - 2) {
      return { success: false, error: 'limit_close', limit: RECIPIENT_LIMIT, remaining: RECIPIENT_LIMIT - store.recipients.length };
    }
    store.recipients.push(preset);
  } else if (type === 'sender') {
    const duplicateIndex = findDuplicatePresetIndex(type, store.senders, data);
    if (duplicateIndex !== -1) {
      store.senders[duplicateIndex] = {
        ...store.senders[duplicateIndex],
        label: preset.label,
        updatedAt: Date.now(),
        data,
      };
      const persisted = persistStore(store);
      if (!persisted) {
        return { success: false, error: 'storage_failed' };
      }
      return { success: true, preset: store.senders[duplicateIndex], duplicate: true };
    }

    if (store.senders.length >= SENDER_LIMIT) {
      return { success: false, error: 'limit_reached', limit: SENDER_LIMIT };
    }
    if (store.senders.length >= SENDER_LIMIT - 2) {
      return { success: false, error: 'limit_close', limit: SENDER_LIMIT, remaining: SENDER_LIMIT - store.senders.length };
    }
    store.senders.push(preset);
  } else {
    return { success: false, error: 'invalid_type' };
  }

  const persisted = persistStore(store);
  if (!persisted) {
    return { success: false, error: 'storage_failed' };
  }

  return { success: true, preset };
}

export function updateAddresseePreset(type, id, presetData) {
  if (!id || !presetData) {
    return { success: false, error: 'invalid_params' };
  }

  const store = getAddresseePresetStore();

  if (type === 'recipient') {
    const index = store.recipients.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: 'not_found' };
    }
    store.recipients[index] = {
      ...store.recipients[index],
      label: presetData.label || store.recipients[index].label,
      updatedAt: Date.now(),
      data: sanitizePresetData('recipient', presetData.data),
    };
  } else if (type === 'sender') {
    const index = store.senders.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: 'not_found' };
    }
    store.senders[index] = {
      ...store.senders[index],
      label: presetData.label || store.senders[index].label,
      updatedAt: Date.now(),
      data: sanitizePresetData('sender', presetData.data),
    };
  } else {
    return { success: false, error: 'invalid_type' };
  }

  const persisted = persistStore(store);
  if (!persisted) {
    return { success: false, error: 'storage_failed' };
  }

  return { success: true };
}

export function deleteAddresseePreset(type, id) {
  if (!id) {
    return { success: false, error: 'invalid_id' };
  }

  const store = getAddresseePresetStore();

  if (type === 'recipient') {
    const index = store.recipients.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: 'not_found' };
    }
    store.recipients.splice(index, 1);
  } else if (type === 'sender') {
    const index = store.senders.findIndex((p) => p.id === id);
    if (index === -1) {
      return { success: false, error: 'not_found' };
    }
    store.senders.splice(index, 1);
  } else {
    return { success: false, error: 'invalid_type' };
  }

  const persisted = persistStore(store);
  if (!persisted) {
    return { success: false, error: 'storage_failed' };
  }

  return { success: true };
}

export function clearAddresseePresets(type) {
  const store = getAddresseePresetStore();

  if (type === 'recipient') {
    store.recipients = [];
  } else if (type === 'sender') {
    store.senders = [];
  } else {
    store.recipients = [];
    store.senders = [];
  }

  const persisted = persistStore(store);
  if (!persisted) {
    return { success: false, error: 'storage_failed' };
  }

  return { success: true };
}

export function getRecipientPresets() {
  const store = getAddresseePresetStore();
  return store.recipients.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSenderPresets() {
  const store = getAddresseePresetStore();
  return store.senders.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getRecipientPresetLimit() {
  return RECIPIENT_LIMIT;
}

export function getSenderPresetLimit() {
  return SENDER_LIMIT;
}
