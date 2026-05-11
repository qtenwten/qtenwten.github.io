import {
  Document,
  TextRun,
  Paragraph,
  AlignmentType,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  TableAnchorType,
  HorizontalPositionAlign,
  VerticalPositionAlign,
} from 'docx';

import {
  getSalutationPolicy,
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
      spacing: { after: 400 },
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

function buildCleanHeaderTable(toContent, fromContent) {
  const cellWidthPercent = 50;
  const emptyCellWidthPercent = 50;

  const toLines = toContent ? toContent.split('\n').filter((l) => l.trim()) : [];
  const fromLines = fromContent ? fromContent.split('\n').filter((l) => l.trim()) : [];

  const buildRightCellContent = (lines) => {
    if (lines.length === 0) return [makeEmptyParagraph(80)];
    return lines.map((line) =>
      new Paragraph({
        children: [
          new TextRun({ text: line, size: FONT_SIZE_MAIN_PT, font: 'Times New Roman' }),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 60, before: 0, line: Math.round(LINE_SPACING_TIGHT * 240), lineRule: 'auto' },
      })
    );
  };

  const leftCell = new TableCell({
    width: { size: emptyCellWidthPercent, type: WidthType.PERCENTAGE },
    children: [makeEmptyParagraph(80)],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const rightLines = [];
  if (toLines.length > 0) {
    rightLines.push(...toLines);
  }
  if (fromLines.length > 0) {
    rightLines.push(...fromLines);
  }

  const rightCell = new TableCell({
    width: { size: cellWidthPercent, type: WidthType.PERCENTAGE },
    children: rightLines.length > 0 ? buildRightCellContent(rightLines) : [makeEmptyParagraph(80)],
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableAnchorType.HORIZONTAL_ANCHOR,
    floating: {
      horizontal: {
        align: HorizontalPositionAlign.RIGHT,
        offset: mmToTwip(MARGIN_RIGHT_MM),
      },
      vertical: {
        align: VerticalPositionAlign.TOP,
      },
    },
    rows: [
      new TableRow({
        children: [leftCell, rightCell],
        height: { value: 0, rule: 'auto' },
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE },
      insideV: { style: BorderStyle.NONE },
    },
  });

  return table;
}

function buildCleanDocumentBody(docTextContent) {
  const paragraphs = [];

  paragraphs.push(makeEmptyParagraph(240));

  const docLines = docTextContent ? docTextContent.split('\n') : [];
  let mainTextStarted = false;
  let skipNextEmpty = false;

  for (let i = 0; i < docLines.length; i++) {
    const line = docLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      if (skipNextEmpty) continue;
      paragraphs.push(makeEmptyParagraph(120));
      skipNextEmpty = true;
      continue;
    }

    skipNextEmpty = false;

    if (!mainTextStarted) {
      mainTextStarted = true;
    }

    if (trimmed === 'Дата: ____________        Подпись: ____________') {
      continue;
    }

    paragraphs.push(makeBodyLine(trimmed, { indent: mainTextStarted }));
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

function shouldIncludeGreeting(documentTemplate) {
  const policy = getSalutationPolicy(documentTemplate);
  return policy.includeByDefault;
}

function buildSectionParagraph(label, content) {
  const paragraphs = [];
  if (!label && !content) return paragraphs;

  if (label) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: label,
            bold: true,
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  if (content) {
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
            }),
          ],
          spacing: { after: 60 },
        })
      );
    }
    if (lines.length > 0) {
      paragraphs.push(new Paragraph({ children: [], spacing: { after: 160 } }));
    }
  }

  return paragraphs;
}

export async function generateAddresseeDocxBlob(result, options = {}) {
  const { t, cleanExport = false } = options;
  const blocks = result?.blocks || {};
  const warnings = result?.warnings || [];
  const documentTemplate = result?.exportData?.documentTemplate || result?.documentTemplate || 'businessLetter';

  const docTitleKey = getDocumentTitleKey(documentTemplate);
  const docLabel = cleanExport && t
    ? t(docTitleKey) || 'Документ'
    : (t?.('addresseeGenerator.export.docxDocumentLabel') || 'Документ');

  const addresseeLabel = cleanExport ? '' : (t?.('addresseeGenerator.export.addressee') || 'Адресат');
  const senderLabel = cleanExport ? '' : (t?.('addresseeGenerator.export.sender') || 'Отправитель');
  const greetingLabel = cleanExport ? '' : (t?.('addresseeGenerator.export.greeting') || 'Обращение');
  const templateLabel = cleanExport ? '' : (t?.('addresseeGenerator.export.documentTemplate') || 'Готовый шаблон документа');
  const warningsLabel = cleanExport ? '' : (t?.('addresseeGenerator.export.warningsSection') || 'Предупреждения');

  const toSection = blocks.to || '';
  const fromSection = blocks.from || '';
  const greetingSection = blocks.greeting || '';
  const docTextSection = blocks.documentText || '';

  const pageWidthTwip = mmToTwip(A4_WIDTH_MM);
  const pageHeightTwip = mmToTwip(A4_HEIGHT_MM);
  const marginTopTwip = mmToTwip(MARGIN_TOP_MM);
  const marginBottomTwip = mmToTwip(MARGIN_BOTTOM_MM);
  const marginLeftTwip = mmToTwip(MARGIN_LEFT_MM);
  const marginRightTwip = mmToTwip(MARGIN_RIGHT_MM);

  const children = [];

  if (cleanExport) {
    children.push(buildCleanHeaderTable(toSection, fromSection));

    children.push(makeTitleParagraph(docLabel));

    if (shouldIncludeGreeting(documentTemplate) && greetingSection) {
      const greetingLines = greetingSection.split('\n').filter((l) => l.trim());
      for (const line of greetingLines) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: line, size: FONT_SIZE_MAIN_PT, font: 'Times New Roman' }),
            ],
            spacing: { after: 200, before: 0, line: Math.round(LINE_SPACING_MAIN * 240), lineRule: 'auto' },
          })
        );
      }
      children.push(makeEmptyParagraph(160));
    }

    const bodyParagraphs = buildCleanDocumentBody(docTextSection);
    children.push(...bodyParagraphs);

    children.push(...makeSignatureBlock());
  } else {
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
      for (const p of buildSectionParagraph(addresseeLabel, toSection)) {
        children.push(p);
      }
    }

    if (fromSection) {
      for (const p of buildSectionParagraph(senderLabel, fromSection)) {
        children.push(p);
      }
    }

    if (greetingSection) {
      for (const p of buildSectionParagraph(greetingLabel, greetingSection)) {
        children.push(p);
      }
    }

    if (docTextSection) {
      for (const p of buildSectionParagraph(templateLabel, docTextSection)) {
        children.push(p);
      }
    }

    if (warnings && warnings.length > 0) {
      const warningTexts = warnings.map((w) => w.message || String(w));
      const warningContent = warningTexts.join('\n');
      for (const p of buildSectionParagraph(warningsLabel, warningContent)) {
        children.push(p);
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
