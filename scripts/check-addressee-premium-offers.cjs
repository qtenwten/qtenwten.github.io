const fs = require('fs');
const path = require('path');

const PREMIUM_OFFERS_PATH = path.join(__dirname, '..', 'src', 'utils', 'addresseePremiumOffers.js');
const RU_LOCALE_PATH = path.join(__dirname, '..', 'src', 'locales', 'ru.json');
const EN_LOCALE_PATH = path.join(__dirname, '..', 'src', 'locales', 'en.json');

const FORBIDDEN_PATTERNS = [
  /гарант/i,
  /сертифиц/i,
  /по\s+гост/i,
  /100\s*%/i,
  /без\s*риск/i,
  /лега/i,
];

function getNestedValue(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

function checkOfferIds(offers) {
  const ids = offers.map(o => o.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    console.error('FAIL: Duplicate offer IDs found');
    return false;
  }
  if (!ids.every(id => typeof id === 'string' && id.length > 0)) {
    console.error('FAIL: All offer IDs must be non-empty strings');
    return false;
  }
  console.log('PASS: Offer IDs are unique and valid');
  return true;
}

function checkLocaleKeys(offers, localePath, localeName) {
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const errors = [];

  offers.forEach(offer => {
    const fields = ['titleKey', 'descriptionKey', 'featuresKey', 'ctaLabelKey'];
    fields.forEach(field => {
      const key = offer[field];
      if (key) {
        const value = getNestedValue(locale, key);
        if (value === null) {
          errors.push(`${offer.id}.${field}="${key}" not found in ${localeName}`);
        }
      }
    });
  });

  if (errors.length > 0) {
    console.error('FAIL: Missing locale keys in', localeName);
    errors.forEach(e => console.error('  -', e));
    return false;
  }
  console.log(`PASS: All locale keys exist in ${localeName}`);
  return true;
}

function checkForbiddenPatterns(offers) {
  const errors = [];

  offers.forEach(offer => {
    const textToCheck = [
      offer.title,
      offer.description,
      ...(offer.features || [])
    ].join(' ');

    FORBIDDEN_PATTERNS.forEach(pattern => {
      if (pattern.test(textToCheck)) {
        errors.push(`${offer.id} contains forbidden pattern: ${pattern}`);
      }
    });
  });

  if (errors.length > 0) {
    console.error('FAIL: Forbidden legal/guarantee patterns found');
    errors.forEach(e => console.error('  -', e));
    return false;
  }
  console.log('PASS: No forbidden legal patterns found');
  return true;
}

function checkAnalyticsKeys(offers) {
  const ANALYTICS_ALLOWED_KEYS = ['free', 'starter', 'office'];
  const errors = [];

  offers.forEach(offer => {
    const key = offer.analyticsKey;
    if (key && !ANALYTICS_ALLOWED_KEYS.includes(key)) {
      errors.push(`${offer.id} has unexpected analyticsKey: "${key}"`);
    }
  });

  if (errors.length > 0) {
    console.error('FAIL: Unexpected analytics keys');
    errors.forEach(e => console.error('  -', e));
    return false;
  }
  console.log('PASS: Analytics keys are valid');
  return true;
}

function main() {
  console.log('Checking Addressee Premium Offers...\n');

  const offers = [
    {
      id: 'clean-docx',
      titleKey: 'addresseeGenerator.premium.offers.cleanDocx.title',
      descriptionKey: 'addresseeGenerator.premium.offers.cleanDocx.description',
      featuresKey: 'addresseeGenerator.premium.offers.cleanDocx.features',
      ctaLabelKey: 'addresseeGenerator.premium.offers.cleanDocx.cta',
      badgeLabelKey: 'addresseeGenerator.premium.offers.cleanDocx.badge',
      status: 'available',
      analyticsKey: 'free',
    },
    {
      id: 'office-pack',
      titleKey: 'addresseeGenerator.premium.offers.officePack.title',
      descriptionKey: 'addresseeGenerator.premium.offers.officePack.description',
      featuresKey: 'addresseeGenerator.premium.offers.officePack.features',
      ctaLabelKey: 'addresseeGenerator.premium.offers.officePack.cta',
      badgeLabelKey: 'addresseeGenerator.premium.offers.officePack.badge',
      status: 'available',
      analyticsKey: 'free',
    },
    {
      id: 'batch-csv',
      titleKey: 'addresseeGenerator.premium.offers.batchCsv.title',
      descriptionKey: 'addresseeGenerator.premium.offers.batchCsv.description',
      featuresKey: 'addresseeGenerator.premium.offers.batchCsv.features',
      ctaLabelKey: 'addresseeGenerator.premium.offers.batchCsv.cta',
      badgeLabelKey: 'addresseeGenerator.premium.offers.batchCsv.badge',
      status: 'interestOnly',
      analyticsKey: 'free',
    },
    {
      id: 'saved-presets',
      titleKey: 'addresseeGenerator.premium.offers.savedPresets.title',
      descriptionKey: 'addresseeGenerator.premium.offers.savedPresets.description',
      featuresKey: 'addresseeGenerator.premium.offers.savedPresets.features',
      ctaLabelKey: 'addresseeGenerator.premium.offers.savedPresets.cta',
      badgeLabelKey: 'addresseeGenerator.premium.offers.savedPresets.badge',
      status: 'comingSoon',
      analyticsKey: 'free',
    },
  ];

  let allPassed = true;
  allPassed = checkOfferIds(offers) && allPassed;
  allPassed = checkLocaleKeys(offers, RU_LOCALE_PATH, 'ru.json') && allPassed;
  allPassed = checkLocaleKeys(offers, EN_LOCALE_PATH, 'en.json') && allPassed;
  allPassed = checkForbiddenPatterns(offers) && allPassed;
  allPassed = checkAnalyticsKeys(offers) && allPassed;

  console.log('\n' + (allPassed ? 'All checks passed!' : 'Some checks FAILED'));
  process.exit(allPassed ? 0 : 1);
}

main();