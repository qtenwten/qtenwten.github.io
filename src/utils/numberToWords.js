// Конвертация числа в текст (рубли, евро, доллары)

const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

const scales = [
  { value: 1000000000000, one: 'триллион', few: 'триллиона', many: 'триллионов', gender: 'm' },
  { value: 1000000000, one: 'миллиард', few: 'миллиарда', many: 'миллиардов', gender: 'm' },
  { value: 1000000, one: 'миллион', few: 'миллиона', many: 'миллионов', gender: 'm' },
  { value: 1000, one: 'тысяча', few: 'тысячи', many: 'тысяч', gender: 'f' }
];

const currencies = {
  RUB: { one: 'рубль', few: 'рубля', many: 'рублей', minor: { one: 'копейка', few: 'копейки', many: 'копеек' } },
  EUR: { one: 'евро', few: 'евро', many: 'евро', minor: { one: 'цент', few: 'цента', many: 'центов' } },
  USD: { one: 'доллар', few: 'доллара', many: 'долларов', minor: { one: 'цент', few: 'цента', many: 'центов' } },
  KZT: { one: 'тенге', few: 'тенге', many: 'тенге', minor: { one: 'тиын', few: 'тиына', many: 'тиынов' } },
  CNY: { one: 'юань', few: 'юаня', many: 'юаней', minor: { one: 'фэнь', few: 'фэня', many: 'фэней' } },
  UAH: { one: 'гривна', few: 'гривны', many: 'гривен', minor: { one: 'копейка', few: 'копейки', many: 'копеек' } },
  BYN: { one: 'белорусский рубль', few: 'белорусских рубля', many: 'белорусских рублей', minor: { one: 'копейка', few: 'копейки', many: 'копеек' } },
  UZS: { one: 'сум', few: 'сума', many: 'сумов', minor: { one: 'тийин', few: 'тийина', many: 'тийинов' } }
};

function pluralize(number, one, few, many) {
  const mod10 = number % 10;
  const mod100 = number % 100;

  if (mod100 >= 11 && mod100 <= 19) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function convertThreeDigits(num, gender = 'm') {
  if (num === 0) return '';

  const h = Math.floor(num / 100);
  const t = Math.floor((num % 100) / 10);
  const u = num % 10;

  let result = [];

  if (h > 0) result.push(hundreds[h]);

  if (t === 1) {
    result.push(teens[u]);
  } else {
    if (t > 0) result.push(tens[t]);
    if (u > 0) {
      if (gender === 'f') {
        if (u === 1) result.push('одна');
        else if (u === 2) result.push('две');
        else result.push(units[u]);
      } else {
        result.push(units[u]);
      }
    }
  }

  return result.join(' ');
}

export function numberToWords(number, currency = 'RUB', withMinor = true, taxMode = 'none', taxRate = 0) {
  if (isNaN(number) || number === '') return { text: '', details: null };

  let num = parseFloat(number);
  if (num === 0) return { text: `ноль ${currencies[currency].many}`, details: null };

  // Расчет налогов
  let originalAmount = num;
  let taxAmount = 0;
  let finalAmount = num;
  let taxDetails = null;

  if (taxMode === 'addVAT') {
    taxAmount = num * (taxRate / 100);
    finalAmount = num + taxAmount;
    taxDetails = {
      original: num.toFixed(2),
      tax: taxAmount.toFixed(2),
      final: finalAmount.toFixed(2),
      label: `НДС ${taxRate}%`
    };
    num = finalAmount;
  } else if (taxMode === 'removeVAT') {
    originalAmount = num / (1 + taxRate / 100);
    taxAmount = num - originalAmount;
    finalAmount = originalAmount;
    taxDetails = {
      original: originalAmount.toFixed(2),
      tax: taxAmount.toFixed(2),
      final: num.toFixed(2),
      label: `НДС ${taxRate}%`
    };
    num = originalAmount;
  } else if (taxMode === 'NDFL') {
    taxAmount = num * (taxRate / 100);
    finalAmount = num - taxAmount;
    taxDetails = {
      original: num.toFixed(2),
      tax: taxAmount.toFixed(2),
      final: finalAmount.toFixed(2),
      label: `НДФЛ ${taxRate}%`
    };
    num = finalAmount;
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const integerPart = Math.floor(absNum);
  const minorPart = Math.round((absNum - integerPart) * 100);

  let result = [];

  if (isNegative) result.push('минус');

  if (integerPart === 0) {
    result.push('ноль');
  } else {
    let remaining = integerPart;
    let parts = [];

    for (const scale of scales) {
      if (remaining >= scale.value) {
        const scaleNum = Math.floor(remaining / scale.value);
        const scaleWords = convertThreeDigits(scaleNum, scale.gender);
        const scaleName = pluralize(scaleNum, scale.one, scale.few, scale.many);
        parts.push(`${scaleWords} ${scaleName}`);
        remaining = remaining % scale.value;
      }
    }

    if (remaining > 0) {
      parts.push(convertThreeDigits(remaining));
    }

    result.push(parts.join(' '));
  }

  const currencyName = pluralize(integerPart, currencies[currency].one, currencies[currency].few, currencies[currency].many);
  result.push(currencyName);

  if (withMinor && minorPart > 0) {
    const minorWords = convertThreeDigits(minorPart);
    const minorName = pluralize(minorPart, currencies[currency].minor.one, currencies[currency].minor.few, currencies[currency].minor.many);
    result.push(`${minorWords} ${minorName}`);
  }

  return {
    text: result.join(' ').replace(/\s+/g, ' ').trim(),
    details: taxDetails
  };
}
