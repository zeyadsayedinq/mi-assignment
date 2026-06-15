import JSZip from 'jszip';
import PptxGen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, ImageRun, Footer, AlignmentType } from 'docx';
import katex from 'katex';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// ─── LATEX TO UNICODE UTILITY ─────────────────────────────────────────────────
function cleanLaTeX(text: string): string {
  if (!text) return "";
  let cleaned = text;
  cleaned = cleaned.replace(/(\$\$?|\\\[|\\\]|\\\(|\\\))/g, '');
  const symbols: Record<string, string> = {
    '\\longrightarrow': '→', '\\rightarrow': '→', '\\longleftarrow': '←', '\\leftarrow': '←',
    '\\uparrow': '↑', '\\downarrow': '↓', '\\Delta': 'Δ', '\\delta': 'δ', '\\alpha': 'α',
    '\\beta': 'β', '\\gamma': 'γ', '\\degree': '°', '\\pm': '±', '\\times': '×', '\\div': '÷',
    '\\neq': '≠', '\\approx': '≈', '\\le': '≤', '\\ge': '≥', '\\sum': 'Σ', '\\infty': '∞',
    '\\pi': 'π', '\\Omega': 'Ω', '\\mu': 'µ',
  };
  Object.entries(symbols).forEach(([latex, unicode]) => { cleaned = cleaned.split(latex).join(unicode); });
  const subscripts: Record<string, string> = {
    '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
    'a':'ₐ','e':'ₑ','o':'ₒ','x':'ₓ','h':'ₕ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','p':'ₚ','s':'ₛ','t':'ₜ'
  };
  cleaned = cleaned.replace(/_\{?([0-9a-z])\}?/g, (_, char) => subscripts[char] || char);
  const superscripts: Record<string, string> = {
    '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
    '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ'
  };
  cleaned = cleaned.replace(/\^\{?([0-9+\-n])\}?/g, (_, char) => superscripts[char] || char);
  cleaned = cleaned.replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '($1/$2)');
  return cleaned.trim();
}

// ─── PDF-SAFE TEXT ────────────────────────────────────────────────────────────
// jsPDF Helvetica cannot render Unicode sub/superscripts — they show as garbled
// chars (₂→‚, ₃→ƒ etc.). Strip them back to plain ASCII before any pdf.text() call.
function pdfSafeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/₀/g,'0').replace(/₁/g,'1').replace(/₂/g,'2').replace(/₃/g,'3')
    .replace(/₄/g,'4').replace(/₅/g,'5').replace(/₆/g,'6').replace(/₇/g,'7')
    .replace(/₈/g,'8').replace(/₉/g,'9')
    .replace(/ₐ/g,'a').replace(/ₑ/g,'e').replace(/ₒ/g,'o').replace(/ₓ/g,'x')
    .replace(/ₙ/g,'n').replace(/ₘ/g,'m').replace(/ₖ/g,'k').replace(/ₗ/g,'l')
    .replace(/ₚ/g,'p').replace(/ₛ/g,'s').replace(/ₜ/g,'t').replace(/ₕ/g,'h')
    .replace(/⁰/g,'0').replace(/¹/g,'1').replace(/²/g,'2').replace(/³/g,'3')
    .replace(/⁴/g,'4').replace(/⁵/g,'5').replace(/⁶/g,'6').replace(/⁷/g,'7')
    .replace(/⁸/g,'8').replace(/⁹/g,'9')
    .replace(/⁺/g,'+').replace(/⁻/g,'-').replace(/ⁿ/g,'n');
}

// ─── Render LaTeX to Image DataURL ───────────────────────────────────────────
async function latexToImageData(latex: string): Promise<{ dataUrl: string, width: number, height: number } | null> {
  return new Promise(async (resolve) => {
    try {
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;padding:40px;background:white;color:black;display:inline-block;';
      document.body.appendChild(container);
      const mathSpan = document.createElement('div');
      katex.render(latex, mathSpan, { throwOnError: false, displayMode: true });
      container.appendChild(mathSpan);
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(container, { backgroundColor: '#ffffff', scale: 2 });
      const dataUrl = canvas.toDataURL('image/png');
      resolve({ dataUrl, width: canvas.width, height: canvas.height });
      document.body.removeChild(container);
    } catch (err) {
      console.error("LaTeX rendering error:", err);
      resolve(null);
    }
  });
}

// ─── CSV builder ──────────────────────────────────────────────────────────────
function buildCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape), ...rows.map(r => r.map(escape))].map(r => r.join(',')).join('\r\n');
}

// ─── SVG → PNG buffer ─────────────────────────────────────────────────────────
async function svgToPngBuffer(svgString: string): Promise<{ buffer: Uint8Array, width: number, height: number } | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let safeSvg = svgString;
      if (!safeSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
        safeSvg = safeSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const url = URL.createObjectURL(new Blob([safeSvg], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800; canvas.height = img.height || 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const base64Data = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, "");
          resolve({ buffer: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)), width: canvas.width, height: canvas.height });
        } else { resolve(null); }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch { resolve(null); }
  });
}

// ─── DOCX Builder ─────────────────────────────────────────────────────────────
async function buildDocx(data: any, payloadName: string, isPro = false, clean = false): Promise<Blob> {
  const children: any[] = [];
  const hasArabic = (t: string) => /[؀-ۿ]/.test(t || '');
  const makePara = (text: string, opts: any = {}) => {
    const isRTL = hasArabic(text);
    return new Paragraph({
      ...opts,
      bidirectional: isRTL,
      alignment: isRTL ? 'right' : (opts.alignment || 'left'),
      children: opts.children || [new TextRun({
        text: cleanLaTeX(text), font: isRTL ? 'Arial' : 'Calibri',
        size: opts.size || 22, bold: opts.bold || false, color: opts.color || '1E293B',
      })],
      spacing: opts.spacing || { after: 160 },
    });
  };

  children.push(new Paragraph({
    text: cleanLaTeX(payloadName) || (clean ? "Solved Assignment" : "Mi-Assignment Report"),
    heading: HeadingLevel.TITLE,
    bidirectional: hasArabic(payloadName),
    spacing: { after: 400 }
  }));

  if (data.solution_text && !clean) {
    children.push(new Paragraph({ text: "Executive Summary", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }));
    children.push(new Paragraph({ text: cleanLaTeX(data.solution_text), spacing: { after: 400 } }));
  }

  const doc = data.reconstructed_doc;
  if (doc) {
    if (doc.title) {
      children.push(new Paragraph({ text: cleanLaTeX(doc.title), heading: HeadingLevel.HEADING_1, bidirectional: hasArabic(doc.title), spacing: { before: 400, after: 200 } }));
    }
    for (const block of (doc.blocks || [])) {
      if (block.type === 'heading') {
        children.push(new Paragraph({ text: cleanLaTeX(block.content || ''), heading: HeadingLevel.HEADING_2, bidirectional: hasArabic(block.content || ''), spacing: { before: 300, after: 200 } }));
      } else if (block.type === 'paragraph') {
        children.push(makePara(block.content || '', { size: 22, color: '334155' }));
      } else if (block.type === 'list') {
        const items = Array.isArray(block.content) ? block.content : String(block.content || '').split('\n').filter(Boolean);
        items.forEach((item: string) => {
          children.push(new Paragraph({ text: cleanLaTeX(item.replace(/^[-•]\s*/, '')), bidirectional: hasArabic(item), bullet: { level: 0 }, spacing: { after: 100 } }));
        });
      } else if (block.type === 'math') {
        let renderedMath = false;
        if (!clean) {
          const mathImg = await latexToImageData(block.content);
          if (mathImg) {
            const targetW = 550;
            const targetH = Math.floor(mathImg.height * (targetW / mathImg.width));
            children.push(new Paragraph({ children: [new ImageRun({ type: 'png' as const, data: Uint8Array.from(atob(mathImg.dataUrl.split(',')[1]), c => c.charCodeAt(0)), transformation: { width: targetW, height: targetH } })] }));
            renderedMath = true;
          }
        }
        if (!renderedMath) {
          children.push(new Paragraph({ children: [new TextRun({ text: cleanLaTeX(block.content), font: "Arial", bold: true, size: 24, color: "0F172A" })], shading: { type: "solid", color: "F1F5F9", fill: "F1F5F9" }, spacing: { before: 100, after: 100 } }));
        }
        if (block.solution_steps && !clean) {
          block.solution_steps.forEach((s: string, i: number) => {
            children.push(new Paragraph({ text: `  ${i + 1}. ${cleanLaTeX(s)}`, spacing: { after: 100 } }));
          });
        }
      } else if (block.type === 'table') {
        if (block.headers?.length > 0 && block.rows?.length > 0) {
          const newTableRows = [
            new TableRow({ children: block.headers.map((h: string) => new TableCell({ children: [new Paragraph({ text: String(h), spacing: { after: 80 } })], shading: { fill: 'E2E8F0' } })) }),
            ...(block.rows || []).map((row: string[]) => new TableRow({ children: (Array.isArray(row) ? row : [String(row)]).map((cell: string) => new TableCell({ children: [new Paragraph({ text: String(cell || ''), bidirectional: hasArabic(String(cell || '')), spacing: { after: 80 } })] })) }))
          ];
          children.push(new Table({ rows: newTableRows, width: { size: 9000, type: 'dxa' } }));
          children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
        } else if (block.content && String(block.content) !== 'undefined') {
          const rows = String(block.content).split('\n').filter(Boolean);
          if (rows.length > 0) {
            const tableRows = rows.map((row: string, i: number) => new TableRow({ children: row.split('|').filter(Boolean).map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cleanLaTeX(cell.trim()), bold: i === 0 })] })] })) }));
            children.push(new Table({ rows: tableRows, margins: { top: 100, bottom: 100, left: 100, right: 100 } }));
            children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
          }
        }
      } else if (block.type === 'code') {
        children.push(new Paragraph({ children: [new TextRun({ text: block.content, font: "Courier New", size: 20, color: "1E293B" })], shading: { type: "solid", color: "F1F5F9", fill: "F1F5F9" }, spacing: { before: 200, after: 200 } }));
      } else if (block.type === 'svg') {
        const pngData = await svgToPngBuffer(block.content);
        if (pngData) {
          const targetWidth = 600;
          const targetHeight = Math.floor(pngData.height * (targetWidth / pngData.width));
          children.push(new Paragraph({ children: [new ImageRun({ type: 'png' as const, data: pngData.buffer, transformation: { width: targetWidth, height: targetHeight } })], spacing: { after: 200 } }));
          if (!clean) {
            children.push(new Paragraph({ children: [new TextRun({ text: "Figure: Generated Diagram", italics: true })], alignment: "center", spacing: { after: 400 } }));
          }
        } else {
          children.push(new Paragraph({ children: [new TextRun({ text: "[Technical Diagram — view full interactive version in the Mi-Assignment web app. The diagram shows the engineering schematic for this section.]", italics: true, color: "64748B" })], spacing: { after: 200 } }));
        }
      }
    }
  }

  const document = new Document({
    sections: [{
      properties: {},
      children: children,
      footers: undefined,  // No watermark on any version
    }]
  });
  return Packer.toBlob(document);
}

// ─── PDF Builder ──────────────────────────────────────────────────────────────
async function buildPDF(data: any, payloadName: string, isPro = false, clean = false): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, MARGIN = 18, LINE_H = 7, MAX_Y = 270;
  let y = MARGIN;

  const addPage = () => { pdf.addPage(); y = MARGIN; };
  const checkPage = (needed = LINE_H) => { if (y + needed > MAX_Y) addPage(); };
  const isArabicText = (t: string) => /[؀-ۿ]/.test(t);

  // writeLine: cleanLaTeX first, then pdfSafeText to strip Unicode sub/superscripts
  const writeLine = (text: string, size = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    if (!text || text === 'undefined') return;
    const rawText = pdfSafeText(cleanLaTeX(text));
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(rawText, W - MARGIN * 2);
    const isRTL = isArabicText(rawText);
    lines.forEach((line: string) => {
      checkPage();
      if (isRTL) { pdf.text(line, W - MARGIN, y, { align: 'right' }); }
      else { pdf.text(line, MARGIN, y); }
      y += LINE_H;
    });
  };

  if (!clean) {
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, W, 28, 'F');
    pdf.setFontSize(20); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
    pdf.text('Mi-Assignment', MARGIN, 13);
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(148, 163, 184);
    pdf.text('Full Solution Breakdown', MARGIN, 20);
    pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
    pdf.text(new Date().toLocaleDateString('en-GB'), W - MARGIN - 20, 20);
    y = 38;
  } else {
    y = MARGIN;
  }

  writeLine(payloadName, 15, true, [15, 23, 42]);
  y += 3;

  if (data.solution_text && !clean) {
    writeLine('Summary', 11, true, [34, 211, 238]);
    pdf.setDrawColor(34, 211, 238); pdf.setLineWidth(0.4);
    pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
    writeLine(data.solution_text, 10, false, [71, 85, 105]);
    y += 4;
  }

  const doc = data.reconstructed_doc;
  if (doc) {
    if (doc.title) { writeLine(doc.title, 14, true, [15, 23, 42]); y += 2; }
    for (const block of (doc.blocks || [])) {
      checkPage(10);
      if (block.type === 'heading') {
        y += 3;
        if (!block.content || block.content.trim() === (payloadName || '').trim()) {
          // skip duplicate title
        } else {
          writeLine(block.content, 13, true, [15, 23, 42]);
          pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2);
          pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
        }
      } else if (block.type === 'math') {
        let renderedMath = false;
        if (!clean) {
          const mathImg = await latexToImageData(block.content);
          if (mathImg) {
            const targetW = W - MARGIN * 2 - 20;
            const targetH = (mathImg.height / mathImg.width) * targetW;
            checkPage(targetH + 10);
            pdf.addImage(mathImg.dataUrl, 'PNG', MARGIN + 10, y, targetW, targetH);
            y += targetH + 2;
            renderedMath = true;
          }
        }
        if (!renderedMath) {
          pdf.setFillColor(248, 250, 252); pdf.rect(MARGIN, y - 4, W - MARGIN * 2, LINE_H + 2, 'F');
          writeLine(block.content, 10, true, [30, 64, 175]);
        }
        if (block.solution_steps && !clean) {
          block.solution_steps.forEach((s: string, i: number) => writeLine(`  ${i + 1}. ${s}`, 9, false, [71, 85, 105]));
        }
        y += 2;
      } else if (block.type === 'code') {
        pdf.setFillColor(30, 41, 59); pdf.rect(MARGIN, y - 3, W - MARGIN * 2, LINE_H + 4, 'F');
        pdf.setFont('courier', 'normal'); pdf.setFontSize(8); pdf.setTextColor(148, 163, 184);
        const clines = pdf.splitTextToSize(block.content || '', W - MARGIN * 2 - 4);
        clines.slice(0, 8).forEach((l: string) => { checkPage(); pdf.text(l, MARGIN + 2, y); y += 5; });
        pdf.setFont('helvetica', 'normal');
        y += 2;
      } else if (block.type === 'list') {
        const items = Array.isArray(block.content) ? block.content : String(block.content || '').split('\n').filter(Boolean);
        items.forEach((item: string) => {
          writeLine(`• ${item.replace(/^[-•]\s*/, '')}`, 10, false, [51, 65, 85]);
        });
        y += 2;
      } else if (block.type === 'table') {
        if (block.headers?.length && block.rows?.length) {
          checkPage(20);
          const colW = Math.min(40, (W - MARGIN * 2) / block.headers.length);
          pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
          pdf.setFillColor(226, 232, 240); pdf.rect(MARGIN, y - 4, W - MARGIN * 2, LINE_H, 'F');
          block.headers.forEach((h: string, k: number) => { pdf.text(String(h).substring(0, 20), MARGIN + k * colW + 1, y); });
          y += LINE_H;
          pdf.setFont('helvetica', 'normal'); pdf.setTextColor(51, 65, 85);
          block.rows.forEach((row: string[]) => {
            checkPage();
            (Array.isArray(row) ? row : [row]).forEach((cell: string, k: number) => { pdf.text(String(cell).substring(0, 25), MARGIN + k * colW + 1, y); });
            y += 7; checkPage();
          });
          y += 3;
        } else if (block.content && block.content !== 'undefined') {
          writeLine(String(block.content), 10, false, [51, 65, 85]);
        }
      } else if (block.type === 'svg') {
        if (!clean) {
          writeLine('[Technical diagram — view in Mi-Assignment web app]', 9, false, [100, 116, 139]);
        }
      } else if (block.content && block.content !== 'undefined') {
        writeLine(block.content, 10, false, [51, 65, 85]);
      }
    }
  }

  if (data.code_snippets?.length && !clean) {
    checkPage(20); y += 5;
    writeLine('Code Files Included', 12, true, [34, 211, 238]);
    pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
    data.code_snippets.forEach((s: any) => {
      writeLine(`${s.filename || 'code'} (${s.language})`, 10, true, [15, 23, 42]);
      if (s.explanation) writeLine(s.explanation, 9, false, [100, 116, 139]);
      y += 2;
    });
  }

  // Footer — page numbers only, no watermark on any version
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    if (!clean) {
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(148, 163, 184);
      pdf.text(`Page ${i} of ${totalPages}`, MARGIN, 290);
    }
  }

  return pdf.output('blob');
}

// ─── WATERMARK (kept for PPTX footer text only) ───────────────────────────────
const WATERMARK = "Mi-Assignment";

// ─── MAIN EXPORT FUNCTION ─────────────────────────────────────────────────────
export async function downloadMissionPackage(data: any, payloadName: string = "Mission_Intelligence", isPro = false) {
  const zip = new JSZip();
  const safeName = payloadName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'Mission';

  // README
  const readme = [
    `# Mi-Assignment — Package`,
    `**Mission:** ${payloadName}`,
    `**Date:** ${new Date().toLocaleDateString()}`,
    `**Type:** ${data.assignment_type || 'general'}`,
    ``,
    `## Summary`,
    data.solution_text || 'No summary.',
    ``,
    `## Files Included`,
    `- \`Submission_Clean.pdf\` — Pure solution (No branding, no steps)`,
    `- \`Submission_Clean.docx\` — Pure solution (Editable, No branding, no steps)`,
    `- \`Full_Breakdown_With_Steps.pdf\` — Mi-Assignment report with logic steps`,
    `- \`Full_Breakdown_With_Steps.docx\` — Mi-Assignment report (Editable)`,
    data.presentation_slides?.length ? `- \`Briefing_Deck.pptx\` — ${data.presentation_slides.length} slide presentation` : '',
    data.data_sheet?.rows?.length ? `- \`Data_Sheet.csv\` — Data table (${data.data_sheet.rows.length} rows)` : '',
    (data.data_sheet?.rows?.length && ['computer_science', 'sql_database', 'data_analysis'].includes(data.assignment_type || '')) ? `- \`Database_Import.sql\` — SQL CREATE + INSERT statements` : '',
    data.code_snippets?.length ? `- \`Source_Code/\` — ${data.code_snippets.length} code file(s)` : '',
  ].filter(Boolean).join('\n');
  zip.file('README.md', readme);

  // PDFs
  try {
    const fullPdfBlob = await buildPDF(data, payloadName, isPro, false);
    zip.file('Full_Breakdown_With_Steps.pdf', fullPdfBlob);
    const cleanPdfBlob = await buildPDF(data, payloadName, isPro, true);
    zip.file('Submission_Clean.pdf', cleanPdfBlob);
  } catch (e) { console.warn('PDF generation failed:', e); }

  // DOCX
  try {
    const fullDocxBlob = await buildDocx(data, payloadName, isPro, false);
    zip.file('Full_Breakdown_With_Steps.docx', fullDocxBlob);
    const cleanDocxBlob = await buildDocx(data, payloadName, isPro, true);
    zip.file('Submission_Clean.docx', cleanDocxBlob);
  } catch (e) { console.warn('DOCX generation failed:', e); }

  // XLSX
  if (data.data_sheet?.rows?.length) {
    try {
      const ws = XLSX.utils.aoa_to_sheet([data.data_sheet.headers, ...data.data_sheet.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file('Data_Sheet.xlsx', xlsxBuffer);
    } catch (e) { console.warn('XLSX generation failed:', e); }
  }

  // PPTX
  const slides = data.presentation_slides;
  if (slides?.length) {
    try {
      const pres = new PptxGen();
      pres.author = 'Mi-Assignment';
      pres.title = payloadName;
      pres.layout = 'LAYOUT_16x9';

      pres.defineSlideMaster({
        title: 'DARK',
        background: { color: '0F172A' },
        objects: [
          { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: '22D3EE' } } },
          { rect: { x: 0, y: '95%', w: '100%', h: '5%', fill: { color: '1E293B' } } },
          { text: { text: isPro ? payloadName.slice(0, 40) : 'Mi-Assignment', options: { x: 0.3, y: 7.25, w: 9.4, h: 0.4, fontSize: 8, color: '64748B', fontFace: 'Helvetica' } } },
        ],
      });

      pres.defineSlideMaster({
        title: 'CLEAN',
        background: { color: 'FFFFFF' },
        objects: [],
      });

      const patterns = ['split', 'scholar', 'data', 'split', 'scholar'];
      const getLayout = (idx: number, hasImg: boolean) => {
        if (!hasImg) return 'scholar';
        return (patterns[idx % patterns.length] || 'split') as string;
      };

      slides.forEach((sd: any, slideIdx: number) => {
        const isTitleSlide = slideIdx === 0;
        const hasImg = !!(sd.image_url?.startsWith('http') || sd.image_url?.startsWith('data:'));
        const CYAN = '22D3EE', NAVY = '0F172A', WHITE = 'FFFFFF', DARK = '1E293B', MID = '475569', LIGHT = '94A3B8';
        const totalSlides = slides.length;

        if (isTitleSlide) {
          const slide = pres.addSlide({ masterName: 'CLEAN' });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: NAVY } });
          if (hasImg) {
            slide.addImage({ path: sd.image_url, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover', w: '100%', h: '100%' } });
            slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 50 } });
          }
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: CYAN } });
          slide.addText(sd.power_heading || payloadName, { x: 0.5, y: 1.8, w: 9.0, h: 2.5, fontSize: 40, bold: true, color: WHITE, fontFace: 'Helvetica', align: 'center', valign: 'middle', wrap: true });
          slide.addShape(pres.ShapeType.rect, { x: '30%', y: 4.4, w: '40%', h: 0.05, fill: { color: CYAN } });
          if (sd.narrative) {
            slide.addText(sd.narrative, { x: 1.0, y: 4.7, w: 8.0, h: 0.8, fontSize: 16, color: 'CBD5E1', fontFace: 'Helvetica', align: 'center' });
          }
          slide.addText(payloadName.slice(0, 50), { x: 0.5, y: 6.9, w: 5.0, h: 0.4, fontSize: 9, color: '64748B', fontFace: 'Helvetica' });
          slide.addText('Mi-Assignment', { x: 5.5, y: 6.9, w: 4.0, h: 0.4, fontSize: 9, color: '64748B', fontFace: 'Helvetica', align: 'right' });
        } else {
          const slide = pres.addSlide({ masterName: 'CLEAN' });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: WHITE } });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: CYAN } });
          slide.addText(`${String(slideIdx + 1).padStart(2,'0')} / ${String(totalSlides).padStart(2,'0')}`, { x: 0.4, y: 0.15, w: 1.5, h: 0.35, fontSize: 9, color: LIGHT, fontFace: 'Helvetica' });
          if (sd.slide_type) {
            slide.addText(sd.slide_type.toUpperCase(), { x: 7.5, y: 0.15, w: 2.0, h: 0.35, fontSize: 9, color: CYAN, fontFace: 'Helvetica', bold: true, align: 'right' });
          }

          if (hasImg) {
            const TW = 5.0, TX = 0.4;
            slide.addText(sd.power_heading || `Slide ${slideIdx + 1}`, { x: TX, y: 0.65, w: TW, h: 1.3, fontSize: 22, bold: true, color: DARK, fontFace: 'Helvetica', wrap: true });
            slide.addShape(pres.ShapeType.rect, { x: TX, y: 2.05, w: 0.8, h: 0.05, fill: { color: CYAN } });
            let cy = 2.25;
            if (sd.narrative) {
              slide.addText(sd.narrative, { x: TX, y: cy, w: TW, h: 0.8, fontSize: 13, color: MID, fontFace: 'Helvetica', italic: true });
              cy += 0.95;
            }
            if (sd.content_bullets?.length) {
              const bullets = sd.content_bullets.slice(0, 6).map((b: string) => ({ text: String(b), options: { bullet: { code: '25B6', color: CYAN }, fontSize: 14, color: DARK, fontFace: 'Helvetica', paraSpaceAfter: 10, bold: false } }));
              slide.addText(bullets as any, { x: TX, y: cy, w: TW, h: 7.0 - cy, valign: 'top' });
            }
            slide.addImage({ path: sd.image_url, x: 5.6, y: 0.5, w: 3.8, h: 6.5, sizing: { type: 'contain', w: 3.8, h: 6.5 } });
          } else {
            slide.addText(sd.power_heading || `Slide ${slideIdx + 1}`, { x: 0.5, y: 0.65, w: 9.0, h: 1.3, fontSize: 26, bold: true, color: DARK, fontFace: 'Helvetica', wrap: true });
            slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 2.05, w: 0.8, h: 0.05, fill: { color: CYAN } });
            let cy = 2.25;
            if (sd.narrative) {
              slide.addText(sd.narrative, { x: 0.5, y: cy, w: 9.0, h: 0.8, fontSize: 13, color: MID, fontFace: 'Helvetica', italic: true });
              cy += 0.95;
            }
            if (sd.content_bullets?.length) {
              const bullets = sd.content_bullets.slice(0, 6).map((b: string) => ({ text: String(b), options: { bullet: { code: '25B6', color: CYAN }, fontSize: 15, color: DARK, fontFace: 'Helvetica', paraSpaceAfter: 12, bold: false } }));
              slide.addText(bullets as any, { x: 0.5, y: cy, w: 9.0, h: 7.0 - cy, valign: 'top' });
            }
          }

          slide.addShape(pres.ShapeType.rect, { x: 0, y: 7.3, w: '100%', h: 0.01, fill: { color: 'E2E8F0' } });
          slide.addText('Mi-Assignment', { x: 0.4, y: 7.35, w: 4.0, h: 0.3, fontSize: 8, color: 'CBD5E1', fontFace: 'Helvetica' });
        }

        if (sd.speaker_notes) slide.addNotes(sd.speaker_notes);
      });

      const pptxBlob = await pres.write({ outputType: 'blob' }) as Blob;
      zip.file('Briefing_Deck.pptx', pptxBlob);
    } catch (e) { console.warn('PPTX generation failed:', e); }
  }

  // Data Sheet / SQL / XLSX
  if (data.data_sheet?.headers?.length && data.data_sheet?.rows?.length) {
    const csv = buildCSV(data.data_sheet.headers, data.data_sheet.rows);
    zip.file('Data_Sheet.csv', csv);
    try {
      const ws = XLSX.utils.aoa_to_sheet([data.data_sheet.headers, ...data.data_sheet.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file('Data_Sheet.xlsx', xlsxBuffer);
    } catch (e) { console.error("XLSX export failed", e); }

    const isDbAssignment = ['computer_science', 'sql_database', 'data_analysis'].includes(data.assignment_type || '');
    if (isDbAssignment) {
      const tableName = safeName.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 30) || 'results';
      let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  id SERIAL PRIMARY KEY,\n`;
      data.data_sheet.headers.forEach((h: string, i: number) => {
        sql += `  ${h.toLowerCase().replace(/[^a-z0-9_]/g, '_')} TEXT${i < data.data_sheet.headers.length - 1 ? ',' : ''}\n`;
      });
      sql += `);\n\n`;
      data.data_sheet.rows.forEach((row: string[]) => {
        const vals = row.map((v: string) => `'${String(v ?? '').replace(/'/g, "''")}'`).join(', ');
        sql += `INSERT INTO ${tableName} VALUES (DEFAULT, ${vals});\n`;
      });
      zip.file('Database_Import.sql', sql);
    }
  }

  // Domain extras
  const extras = data.domain_extras;
  if (extras && typeof extras === 'object') {
    const isEngDomain = (data.domain || '').toUpperCase().includes('ENGINEERING');
    if (isEngDomain && extras?.engineering_calculator) {
      try {
        const calc = extras.engineering_calculator;
        const wb5 = XLSX.utils.book_new();
        const wsCalc = XLSX.utils.aoa_to_sheet([
          ['Mi-Assignment Sizing Calculator'],
          ['Project:', data.reconstructed_doc?.title || payloadName],
          [''],
          ['INPUT PARAMETERS', 'Value', 'Unit'],
          ...(calc.inputs || []).map((r: any) => [r.name, r.value, r.unit]),
          [''],
          ['CALCULATED OUTPUTS', 'Result', 'Unit'],
          ...(calc.outputs || []).map((r: any) => [r.name, r.formula || r.value, r.unit]),
          [''],
          ['Note: Change input values to recalculate outputs'],
        ]);
        XLSX.utils.book_append_sheet(wb5, wsCalc, 'Sizing Calculator');
        const buf5 = XLSX.write(wb5, { bookType: 'xlsx', type: 'array' });
        zip.file('Sizing_Calculator.xlsx', buf5);
      } catch (e) { console.warn('Sizing calc failed:', e); }
    }

    const isMedicalDomain = (data.domain || '').toUpperCase().includes('MEDICAL');
    if (isMedicalDomain && extras.medical) {
      const med = extras.medical;
      if (med.drug_interaction_matrix?.length) {
        const headers = ['Drug A', 'Drug B', 'Interaction', 'Severity', 'Management'];
        const rows = med.drug_interaction_matrix.map((r: any) => [r.drug_a, r.drug_b, r.interaction, r.severity, r.management]);
        zip.file('Drug_Interaction_Matrix.csv', buildCSV(headers, rows));
      }
      if (med.patient_leaflet) {
        zip.file('Patient_Leaflet.txt', med.patient_leaflet);
      }
    }

    const isLawDomain = (data.domain || '').toUpperCase().includes('LAW');
    if (isLawDomain && extras.law?.case_references?.length) {
      const refs = extras.law.case_references.map((r: any) => `- ${r.ref || r}`).join('\n');
      zip.file('Case_Law_References.md', `# Case Law References\n\n${refs}\n`);
    }

    const isBusinessDomain = (data.domain || '').toUpperCase().includes('BUSINESS');
    if (isBusinessDomain && extras.business?.financial_projections?.length) {
      try {
        const fp = extras.business.financial_projections;
        const wbB = XLSX.utils.book_new();
        const wsB = XLSX.utils.aoa_to_sheet([['Year', 'Revenue', 'Costs', 'Net Profit'], ...fp.map((r: any) => [r.year, r.revenue, r.costs, r.net_profit])]);
        XLSX.utils.book_append_sheet(wbB, wsB, 'Financial Projections');
        zip.file('Financial_Projections.xlsx', XLSX.write(wbB, { bookType: 'xlsx', type: 'array' }));
      } catch (e) { console.warn('Financial projections failed:', e); }
    }
  }

  // Code snippets
  if (data.code_snippets?.length) {
    const folder = zip.folder('Source_Code')!;
    const extMap: Record<string, string> = { python:'py', javascript:'js', typescript:'ts', java:'java', cpp:'cpp', c:'c', sql:'sql', r:'R', matlab:'m', html:'html', css:'css', bash:'sh' };
    data.code_snippets.forEach((s: any, i: number) => {
      const ext = extMap[s.language?.toLowerCase()] || s.language?.toLowerCase() || 'txt';
      const fname = s.filename || `file_${i + 1}.${ext}`;
      let content = s.code || '';
      if (s.explanation) content = `# ${s.explanation}\n\n${content}`;
      folder.file(fname, content);
    });
  }

  // SVG diagrams
  if (data.reconstructed_doc?.blocks) {
    let svgCount = 0;
    data.reconstructed_doc.blocks.forEach((block: any) => {
      if (block.type === 'svg' && block.content && block.content.trim().startsWith('<svg')) {
        svgCount++;
        const svgFilename = `Diagram_${svgCount}_${(block.title || block.description || 'schematic').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.svg`;
        zip.file(svgFilename, block.content);
      }
    });
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  saveAs(blob, `${safeName}_MI_Package.zip`);
}
