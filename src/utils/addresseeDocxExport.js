import {
  Document,
  TextRun,
  Paragraph,
  AlignmentType,
  Packer,
  WidthType,
  BorderStyle,
} from 'docx';

import {
  getSalutationPolicy,
  getCleanBodyPlaceholders,
} from './addresseeDocumentText.js';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_TOP_MM = 20;
const MARGIN_BOTTOM_MM = 20;
const MARGIN_LEFT_MM = 30;
const MARGIN_RIGHT_MM = 10;
const FONT_SIZE_MAIN_PT = 28;
const FONT_SIZE_TITLE_PT = 28;
const LINE_SPACING_MAIN = 1.15;
const LINE_SPACING_TIGHT = 1.0;
const FIRST_LINE_INDENT_CM = 1.25;

function mmToTwip(mm) {
  return Math.round(mm * 56.7);
}

function escapeXmlText(value) {
  if (value === null || undefined === value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function makeEmptyParagraph(spacingAfter = 240) {
  return new Paragraph({
    children: [new TextRun({ text: '' })],
    spacing: { after: spacingAfter },
  });
}

function makeTitleParagraph(text) {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: FONT_SIZE_TITLE_PT,
        font: 'Times New Roman',
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { after: 480, before: 240, line: Math.round(LINE_SPACING_TIGHT * 240), lineRule: 'auto' },
  });
}

function makeBodyLine(text, options = {}) {
  const { spacingAfter = 200, indent = false } = options;
  const children = [new TextRun({ text, size: FONT_SIZE_MAIN_PT, font: 'Times New Roman' })];
  const paragraphProps = {
    children,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: spacingAfter, before: 0, line: Math.round(LINE_SPACING_MAIN * 240), lineRule: 'auto' },
  };
  if (indent) {
    paragraphProps.indent = { firstLine: mmToTwip(FIRST_LINE_INDENT_CM) };
  }
  return new Paragraph(paragraphProps);
}

function makeSignatureBlock() {
  return [
    new Paragraph({
      children: [new TextRun({ text: '' })],
      spacing: { after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '"_" __________ 20 г. ____________ /Фамилия И.О./', size: FONT_SIZE_MAIN_PT, font: 'Times New Roman' }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0, line: Math.round(LINE_SPACING_MAIN * 240), lineRule: 'auto' },
    }),
  ];
}

function buildPremiumHeaderBlock(toContent, fromContent) {
  const paragraphs = [];

  if (toContent) {
    const toLines = toContent.split('\n').filter(l => l.trim());
    for (const line of toLines) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: line, size: FONT_SIZE_MAIN_PT, font: 'Times New Roman' }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 60, before: 0, line: Math.round(LINE_SPACING_TIGHT * 240), lineRule: 'auto' },
        })
      );
    }
  }

  if (fromContent) {
    const fromLines = fromContent.split('\n').filter(l => l.trim());
    for (const line of fromLines) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: line, size: FONT_SIZE_MAIN_PT, font: 'Times New Roman' }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 60, before: 0, line: Math.round(LINE_SPACING_TIGHT * 240), lineRule: 'auto' },
        })
      );
    }
  }

  return paragraphs;
}

function buildPremiumBody(bodyContent, placeholders) {
  const paragraphs = [];

  paragraphs.push(makeEmptyParagraph(200));

  if (placeholders && placeholders.length > 0) {
    for (const placeholder of placeholders) {
      paragraphs.push(makeBodyLine(placeholder, { indent: true, spacingAfter: 160 }));
    }
    paragraphs.push(makeEmptyParagraph(120));
  } else if (bodyContent && bodyContent.trim()) {
    const lines = bodyContent.split('\n');
    let firstLine = true;
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line === 'Дата: ____________        Подпись: ____________') {
        continue;
      }

      if (line.startsWith('ДЕЛОВОЕ ПИСЬМО') ||
          line.startsWith('ЗАЯВЛЕНИЕ') ||
          line.startsWith('ЖАЛОБА') ||
          line.startsWith('ЗАПРОС') ||
          line.startsWith('СЛУЖЕБНАЯ ЗАПИСКА')) {
        continue;
      }

      paragraphs.push(makeBodyLine(line, { indent: firstLine, spacingAfter: 160 }));
      firstLine = false;
    }
  }

  return paragraphs;
}

function getDocumentTitleKey(documentTemplate) {
  const titleMap = {
    application: 'addresseeGenerator.export.docTitleApplication',
    complaint: 'addresseeGenerator.export.docTitleComplaint',
    request: 'addresseeGenerator.export.docTitleRequest',
    memo: 'addresseeGenerator.export.docTitleMemo',
    businessLetter: 'addresseeGenerator.export.docTitleBusinessLetter',
    explanatoryNote: 'addresseeGenerator.export.docTitleExplanatoryNote',
    powerOfAttorney: 'addresseeGenerator.export.docTitlePowerOfAttorney',
    commercialOffer: 'addresseeGenerator.export.docTitleCommercialOffer',
    order: 'addresseeGenerator.export.docTitleOrder',
  };
  return titleMap[documentTemplate] || 'addresseeGenerator.export.docTitleDefault';
}

function getDocumentTitle(documentTemplate, t, docTitleKey) {
  if (documentTemplate === 'businessLetter') {
    return null;
  }
  const translated = t(docTitleKey);
  if (translated && translated !== docTitleKey) {
    return translated;
  }
  return getFallbackTitle(documentTemplate);
}

function getFallbackTitle(documentTemplate) {
  const map = {
    application: 'ЗАЯВЛЕНИЕ',
    complaint: 'ЖАЛОБА',
    request: 'ЗАПРОС',
    memo: 'СЛУЖЕБНАЯ ЗАПИСКА',
    explanatoryNote: 'ОБЪЯСНИТЕЛЬНАЯ ЗАПИСКА',
    powerOfAttorney: 'ДОВЕРЕННОСТЬ',
    commercialOffer: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
    order: 'ПРИКАЗ',
  };
  return map[documentTemplate] || null;
}

function shouldIncludeGreeting(documentTemplate) {
  const policy = getSalutationPolicy(documentTemplate);
  return policy.includeByDefault;
}

export async function generateAddresseeDocxBlob(result, options = {}) {
  const { t, cleanExport = false } = options;
  const blocks = result?.blocks || {};
  const documentTemplate = result?.exportData?.documentTemplate || result?.documentTemplate || 'businessLetter';

  const docTitleKey = getDocumentTitleKey(documentTemplate);

  const pageWidthTwip = mmToTwip(A4_WIDTH_MM);
  const pageHeightTwip = mmToTwip(A4_HEIGHT_MM);
  const marginTopTwip = mmToTwip(MARGIN_TOP_MM);
  const marginBottomTwip = mmToTwip(MARGIN_BOTTOM_MM);
  const marginLeftTwip = mmToTwip(MARGIN_LEFT_MM);
  const marginRightTwip = mmToTwip(MARGIN_RIGHT_MM);

  const children = [];

  if (cleanExport) {
    const toSection = blocks.to || '';
    const fromSection = blocks.from || '';
    const greetingSection = blocks.greeting || '';

    const headerParagraphs = buildPremiumHeaderBlock(toSection, fromSection);
    children.push(...headerParagraphs);

    const docTitle = getDocumentTitle(documentTemplate, t, docTitleKey);
    if (docTitle) {
      children.push(makeTitleParagraph(docTitle));
    }

    const policy = getSalutationPolicy(documentTemplate);
    if (shouldIncludeGreeting(documentTemplate) && greetingSection) {
      const greetingLines = greetingSection.split('\n').filter(l => l.trim());
      for (const line of greetingLines) {
        if (line.trim()) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: line, size: FONT_SIZE_MAIN_PT, font: 'Times New Roman' }),
              ],
              spacing: { after: 160, before: 0, line: Math.round(LINE_SPACING_MAIN * 240), lineRule: 'auto' },
            })
          );
        }
      }
      children.push(makeEmptyParagraph(120));
    }

    const placeholders = getCleanBodyPlaceholders(documentTemplate);
    const bodyParagraphs = buildPremiumBody(null, placeholders);
    children.push(...bodyParagraphs);

    children.push(...makeSignatureBlock());
  } else {
    const docLabel = t?.(docTitleKey) || t?.('addresseeGenerator.export.docxDocumentLabel') || 'Документ';
    const addresseeLabel = t?.('addresseeGenerator.export.addressee') || 'Адресат';
    const senderLabel = t?.('addresseeGenerator.export.sender') || 'Отправитель';
    const greetingLabel = t?.('addresseeGenerator.export.greeting') || 'Обращение';
    const templateLabel = t?.('addresseeGenerator.export.documentTemplate') || 'Готовый шаблон документа';
    const warningsLabel = t?.('addresseeGenerator.export.warningsSection') || 'Предупреждения';

    const toSection = blocks.to || '';
    const fromSection = blocks.from || '';
    const greetingSection = blocks.greeting || '';
    const docTextSection = blocks.documentText || '';
    const warnings = result?.warnings || [];

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: docLabel,
            bold: true,
            size: 32,
          }),
        ],
        spacing: { after: 320 },
        alignment: AlignmentType.CENTER,
      })
    );

    if (toSection) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: addresseeLabel, bold: true }),
          ],
          spacing: { after: 120 },
        })
      );
      const toLines = toSection.split('\n').filter(l => l.trim());
      for (const line of toLines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 60 },
          })
        );
      }
      children.push(new Paragraph({ children: [], spacing: { after: 160 } }));
    }

    if (fromSection) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: senderLabel, bold: true }),
          ],
          spacing: { after: 120 },
        })
      );
      const fromLines = fromSection.split('\n').filter(l => l.trim());
      for (const line of fromLines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 60 },
          })
        );
      }
      children.push(new Paragraph({ children: [], spacing: { after: 160 } }));
    }

    if (greetingSection) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: greetingLabel, bold: true }),
          ],
          spacing: { after: 120 },
        })
      );
      const greetingLines = greetingSection.split('\n').filter(l => l.trim());
      for (const line of greetingLines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 60 },
          })
        );
      }
      children.push(new Paragraph({ children: [], spacing: { after: 160 } }));
    }

    if (docTextSection) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: templateLabel, bold: true }),
          ],
          spacing: { after: 120 },
        })
      );
      const docLines = docTextSection.split('\n').filter(l => l.trim());
      for (const line of docLines) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line })],
            spacing: { after: 60 },
          })
        );
      }
      children.push(new Paragraph({ children: [], spacing: { after: 160 } }));
    }

    if (warnings && warnings.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: warningsLabel, bold: true }),
          ],
          spacing: { after: 120 },
        })
      );
      for (const w of warnings) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: w.message || String(w) })],
            spacing: { after: 60 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidthTwip,
              height: pageHeightTwip,
            },
            margin: {
              top: marginTopTwip,
              right: marginRightTwip,
              bottom: marginBottomTwip,
              left: marginLeftTwip,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function downloadAddresseeDocx(result, options = {}) {
  const cleanExport = options.cleanExport !== undefined ? options.cleanExport : true;
  return generateAddresseeDocxBlob(result, { ...options, cleanExport }).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `addressee-document-${date}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }).catch((err) => {
    console.warn('DOCX download failed:', err);
    throw err;
  });
}