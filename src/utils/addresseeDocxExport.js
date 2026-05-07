import { Document, TextRun, Paragraph, AlignmentType } from 'docx';

function escapeXmlText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildSectionParagraph(label, content, t) {
  const paragraphs = [];
  if (!label && !content) return paragraphs;

  if (label) {
    paragraphs.push(
      new Paragraph({
        children: [
          new Text({
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
            new Text({
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
  const { t } = options;
  const blocks = result?.blocks || {};
  const warnings = result?.warnings || [];

  const docLabel = t?.('addresseeGenerator.export.docxDocumentLabel') || 'Документ';
  const addresseeLabel = t?.('addresseeGenerator.export.addressee') || 'Адресат';
  const senderLabel = t?.('addresseeGenerator.export.sender') || 'Отправитель';
  const greetingLabel = t?.('addresseeGenerator.export.greeting') || 'Обращение';
  const templateLabel = t?.('addresseeGenerator.export.documentTemplate') || 'Готовый шаблон документа';
  const warningsLabel = t?.('addresseeGenerator.export.warningsSection') || 'Предупреждения';

  const children = [];

  children.push(
    new Paragraph({
      children: [
        new Text({
          text: docLabel,
          bold: true,
          size: 32,
        }),
      ],
      spacing: { after: 320 },
      alignment: AlignmentType.CENTER,
    })
  );

  const toSection = blocks.to || '';
  const fromSection = blocks.from || '';
  const greetingSection = result.greeting || '';
  const docTextSection = blocks.documentText || '';

  if (toSection) {
    for (const p of buildSectionParagraph(addresseeLabel, toSection, t)) {
      children.push(p);
    }
  }

  if (fromSection) {
    for (const p of buildSectionParagraph(senderLabel, fromSection, t)) {
      children.push(p);
    }
  }

  if (greetingSection) {
    for (const p of buildSectionParagraph(greetingLabel, greetingSection, t)) {
      children.push(p);
    }
  }

  if (docTextSection) {
    for (const p of buildSectionParagraph(templateLabel, docTextSection, t)) {
      children.push(p);
    }
  }

  if (warnings && warnings.length > 0) {
    const warningTexts = warnings.map((w) => w.message || String(w));
    const warningContent = warningTexts.join('\n');
    for (const p of buildSectionParagraph(warningsLabel, warningContent, t)) {
      children.push(p);
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await doc.save();
}

export function downloadAddresseeDocx(result, options = {}) {
  return generateAddresseeDocxBlob(result, options).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `addressee-document-${date}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    return true;
  });
}
