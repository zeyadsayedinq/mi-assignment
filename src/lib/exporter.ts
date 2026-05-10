import JSZip from 'jszip';
import PptxGen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, ImageRun, Footer, AlignmentType } from 'docx';
import katex from 'katex';
import html2canvas from 'html2canvas';

import * as XLSX from 'xlsx';

// ─── LATEX TO UNICODE UTILITY ──────────────────────────────────────────────
// This helper makes math/chem readable in text-only environments like PDF/Docx
function cleanLaTeX(text: string): string {
  if (!text) return "";
  
  let cleaned = text;

  // 1. Remove delimiters
  cleaned = cleaned.replace(/(\$\$?|\\\[|\\\]|\\\(|\\\))/g, '');

  // 2. Common LaTeX Symbols
  const symbols: Record<string, string> = {
    '\\longrightarrow': '→',
    '\\rightarrow': '→',
    '\\longleftarrow': '←',
    '\\leftarrow': '←',
    '\\uparrow': '↑',
    '\\downarrow': '↓',
    '\\Delta': 'Δ',
    '\\delta': 'δ',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\degree': '°',
    '\\pm': '±',
    '\\times': '×',
    '\\div': '÷',
    '\\neq': '≠',
    '\\approx': '≈',
    '\\le': '≤',
    '\\ge': '≥',
    '\\sum': 'Σ',
    '\\infty': '∞',
    '\\pi': 'π',
    '\\Omega': 'Ω',
    '\\mu': 'µ',
  };

  Object.entries(symbols).forEach(([latex, unicode]) => {
    cleaned = cleaned.split(latex).join(unicode);
  });

  // 3. Subscripts (basic)
  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', 
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'a': 'ₐ', 'e': 'ₑ', 'o': 'ₒ', 'x': 'ₓ', 'h': 'ₕ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'p': 'ₚ', 's': 'ₛ', 't': 'ₜ'
  };
  cleaned = cleaned.replace(/_\{?([0-9a-z])\}?/g, (_, char) => subscripts[char] || char);

  // 4. Superscripts (basic)
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ'
  };
  cleaned = cleaned.replace(/\^\{?([0-9+\-n])\}?/g, (_, char) => superscripts[char] || char);

  // 5. Fractions (shorthand approach)
  cleaned = cleaned.replace(/\\frac\{(.+?)\}\{(.+?)\}/g, '($1/$2)');

  return cleaned.trim();
}

// ─── Render LaTeX to Image DataURL ───────────────────────────────────────────
async function latexToImageData(latex: string): Promise<{ dataUrl: string, width: number, height: number } | null> {
  return new Promise(async (resolve) => {
    try {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.padding = '40px';
      container.style.background = 'white';
      container.style.color = 'black';
      container.style.display = 'inline-block';
      document.body.appendChild(container);
      
      const mathSpan = document.createElement('div');
      katex.render(latex, mathSpan, {
        throwOnError: false,
        displayMode: true
      });
      container.appendChild(mathSpan);
      
      // Wait a tiny bit for any internal rendering
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(container, {
         backgroundColor: '#ffffff',
         scale: 2 // Higher quality
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      resolve({ dataUrl, width: canvas.width, height: canvas.height });
      
      document.body.removeChild(container);
    } catch (err) {
      console.error("LaTeX rendering error:", err);
      resolve(null);
    }
  });
}

// ─── XLSX-like CSV export (no xlsx dependency needed) ─────────────────────────
function buildCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.map(escape), ...rows.map(r => r.map(escape))].map(r => r.join(',')).join('\r\n');
}

// ─── Convert SVG string to PNG ArrayBuffer ────────────────────────────────────
async function svgToPngBuffer(svgString: string): Promise<{ buffer: Uint8Array, width: number, height: number } | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      // Ensure the SVG has valid xml namespaces to load properly in image tag
      let safeSvg = svgString;
      if (!safeSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
        safeSvg = safeSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      
      const svgBlob = new Blob([safeSvg], { type: 'image/svg+xml;charset=utf-8' });
      
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; // White background for transparency
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL('image/png');
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          resolve({ buffer, width: canvas.width, height: canvas.height });
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

// ─── DOCX Builder for Word export ──────────────────────────────────────────────
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
        text: cleanLaTeX(text),
        font: isRTL ? 'Arial' : 'Calibri',
        size: opts.size || 22,
        bold: opts.bold || false,
        color: opts.color || '1E293B',
      })],
      spacing: opts.spacing || { after: 160 },
    });
  };

  // Title
  children.push(new Paragraph({
    text: cleanLaTeX(payloadName) || (clean ? "Solved Assignment" : "Mi-Assignment Report"),
    heading: HeadingLevel.TITLE,
    bidirectional: hasArabic(payloadName),
    spacing: { after: 400 }
  }));

  if (data.solution_text && !clean) {
    children.push(new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 200, after: 200 }
    }));
    children.push(new Paragraph({
      text: cleanLaTeX(data.solution_text),
      spacing: { after: 400 }
    }));
  }

  const doc = data.reconstructed_doc;
  if (doc) {
    if (doc.title) {
      children.push(new Paragraph({
        text: cleanLaTeX(doc.title),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }));
    }

    for (const block of (doc.blocks || [])) {
      if (block.type === 'heading') {
        children.push(new Paragraph({
          text: cleanLaTeX(block.content || ''),
          heading: HeadingLevel.HEADING_2,
          bidirectional: hasArabic(block.content || ''),
          spacing: { before: 300, after: 200 }
        }));
      } else if (block.type === 'paragraph') {
        children.push(makePara(block.content || '', { size: 22, color: '334155' }));
      } else if (block.type === 'list') {
        const items = Array.isArray(block.content) ? block.content : String(block.content || '').split('\n').filter(Boolean);
        items.forEach((item: string) => {
          children.push(new Paragraph({
            text: cleanLaTeX(item.replace(/^[-•]\s*/, '')),
            bidirectional: hasArabic(item),
            bullet: { level: 0 },
            spacing: { after: 100 }
          }));
        });
      } else if (block.type === 'math') {
        let renderedMath = false;
        if (!clean) {
          const mathImg = await latexToImageData(block.content);
          if (mathImg) {
            const targetW = 550;
            const targetH = Math.floor(mathImg.height * (targetW / mathImg.width));
            children.push(new Paragraph({
              children: [
                new ImageRun({
                  type: 'png' as const,
                  data: Uint8Array.from(atob(mathImg.dataUrl.split(',')[1]), c => c.charCodeAt(0)),
                  transformation: { width: targetW, height: targetH }
                })
              ]
            }));
            renderedMath = true;
          }
        }

        if (!renderedMath) {
          children.push(new Paragraph({
            children: [
              new TextRun({ 
                text: cleanLaTeX(block.content), 
                font: "Arial", 
                bold: true,
                size: 24,
                color: "0F172A" 
              })
            ],
            shading: { type: "solid", color: "F1F5F9", fill: "F1F5F9" },
            spacing: { before: 100, after: 100 }
          }));
        }

        if (block.solution_steps && !clean) {
          block.solution_steps.forEach((s: string, i: number) => {
            children.push(new Paragraph({
              text: `  ${i + 1}. ${cleanLaTeX(s)}`,
              spacing: { after: 100 }
            }));
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
            const tableRows = rows.map((row: string, i: number) => {
              return new TableRow({
                children: row.split('|').filter(Boolean).map(cell => new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: cleanLaTeX(cell.trim()), bold: i === 0 })] })],
                }))
              });
            });
            children.push(new Table({ rows: tableRows, margins: { top: 100, bottom: 100, left: 100, right: 100 } }));
            children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
          }
        }
      } else if (block.type === 'code') {
        children.push(new Paragraph({
          children: [new TextRun({ text: block.content, font: "Courier New", size: 20, color: "1E293B" })],
          shading: { type: "solid", color: "F1F5F9", fill: "F1F5F9" },
          spacing: { before: 200, after: 200 }
        }));
      } else if (block.type === 'svg') {
        const pngData = await svgToPngBuffer(block.content);
        if (pngData) {
          // docx Image dimensions max around 600 width
          const targetWidth = 600;
          const targetHeight = Math.floor(pngData.height * (targetWidth / pngData.width));
          children.push(new Paragraph({
            children: [
              new ImageRun({
                type: 'png' as const,
                data: pngData.buffer,
                transformation: { width: targetWidth, height: targetHeight }
              })
            ],
            spacing: { after: 200 }
          }));
          if (!clean) {
            children.push(new Paragraph({
              children: [new TextRun({ text: "Figure: Generated Diagram", italics: true })],
              alignment: "center",
              spacing: { after: 400 }
            }));
          }
        } else {
          children.push(new Paragraph({
            children: [new TextRun({ text: "[Diagram/SVG rendering failed. Please refer to the web app for the visual representation]", italics: true, color: "64748B" })],
            spacing: { after: 200 }
          }));
        }
      }
    }
  }

  const document = new Document({
    sections: [{
      properties: {},
      children: children,
      footers: clean ? undefined : {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ 
                  text: isPro ? "Mi-Assignment Copyright" : WATERMARK,
                  color: "999999", 
                  size: 16 
                })
              ],
            }),
          ],
        }),
      }
    }]
  });
  
  return Packer.toBlob(document);
}

// ─── PDF builder — full multi-page ───────────────────────────────────────────
async function buildPDF(data: any, payloadName: string, isPro = false, clean = false): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, MARGIN = 18, LINE_H = 7, MAX_Y = 270;
  let y = MARGIN;

  const addPage = () => { pdf.addPage(); y = MARGIN; };
  const checkPage = (needed = LINE_H) => { if (y + needed > MAX_Y) addPage(); };

  const isArabicText = (t: string) => /[؀-ۿ]/.test(t);
  const writeLine = (text: string, size = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    if (!text || text === 'undefined') return;
    const rawText = cleanLaTeX(text);
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    // For Arabic text: jsPDF helvetica can't render Arabic — render as transliterated or skip
    // The PDF will show boxes, but DOCX handles Arabic correctly via TextRun
    const lines = pdf.splitTextToSize(rawText, W - MARGIN * 2);
    const isRTL = isArabicText(rawText);
    lines.forEach((line: string) => {
      checkPage();
      if (isRTL) {
        pdf.text(line, W - MARGIN, y, { align: 'right' });
      } else {
        pdf.text(line, MARGIN, y);
      }
      y += LINE_H;
    });
  };

  if (!clean) {
    // Header
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, W, 28, 'F');
    pdf.setFontSize(20); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
    pdf.text('Mi-Assignment', MARGIN, 13);
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(148, 163, 184);
    pdf.text('Mi-Assignment Report', MARGIN, 20);
    pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
    pdf.text(new Date().toLocaleDateString('en-GB'), W - MARGIN - 20, 20);
    y = 38;
  } else {
    y = MARGIN;
  }

  // Mission name
  writeLine(payloadName, 15, true, [15, 23, 42]);
  y += 3;

  // Summary
  if (data.solution_text && !clean) {
    writeLine('Summary', 11, true, [34, 211, 238]);
    pdf.setDrawColor(34, 211, 238); pdf.setLineWidth(0.4);
    pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
    writeLine(data.solution_text, 10, false, [71, 85, 105]);
    y += 4;
  }

  // Document blocks
  const doc = data.reconstructed_doc;
  if (doc) {
    if (doc.title) { writeLine(doc.title, 14, true, [15, 23, 42]); y += 2; }
    for (const block of (doc.blocks || [])) {
      checkPage(10);
      if (block.type === 'heading') {
        y += 3;
        writeLine(block.content, 13, true, [15, 23, 42]);
        pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2);
        pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
      } else if (block.type === 'math') {
        // For PDF, we'll try image rendering if it's not "clean" mode, 
        // fallback to clean text if image fails or in clean mode
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
        const items = Array.isArray(block.content) ? block.content : String(block.content).split('\n').filter(Boolean);
        items.forEach((item: string) => writeLine(`• ${item.replace(/^[-•]\s*/, '')}`, 10, false, [51, 65, 85]));
      } else if (block.type === 'svg') {
        const pngData = await svgToPngBuffer(block.content);
        if (pngData) {
           const targetW = W - MARGIN * 2 - 10;
           const targetH = (pngData.height / pngData.width) * targetW;
           checkPage(targetH + 10);
           pdf.addImage(pngData.buffer, 'PNG', MARGIN + 5, y, targetW, targetH);
           y += targetH + 5;
           if (!clean) {
             writeLine("Figure: Generated Diagram", 9, true, [148, 163, 184]);
             y += 5;
           }
        } else {
           writeLine("[Diagram/SVG rendering failed. Please refer to the web app for the visual representation]", 10, true, [148, 163, 184]);
           y += 5;
        }
      } else if (block.type === 'table') {
        // Handle table blocks with headers/rows (new format) or content (old format)
        if (block.headers?.length > 0) {
          y += 2;
          // Draw headers
          const colW = (W - MARGIN * 2) / block.headers.length;
          pdf.setFillColor(15, 23, 42); pdf.rect(MARGIN, y - 4, W - MARGIN * 2, 8, 'F');
          pdf.setFontSize(8); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
          block.headers.forEach((h: string, k: number) => {
            pdf.text(String(h).substring(0, 20), MARGIN + k * colW + 1, y);
          });
          y += 6;
          // Draw rows
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(51, 65, 85);
          (block.rows || []).forEach((row: string[], j: number) => {
            if (j % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(MARGIN, y - 4, W - MARGIN * 2, 7, 'F'); }
            (Array.isArray(row) ? row : [row]).forEach((cell: string, k: number) => {
              pdf.text(String(cell).substring(0, 25), MARGIN + k * colW + 1, y);
            });
            y += 7; checkPage();
          });
          y += 3;
        } else if (block.content && block.content !== 'undefined') {
          writeLine(String(block.content), 10, false, [51, 65, 85]);
        }
        // else: empty table — skip, render nothing
      } else if (block.content && block.content !== 'undefined') {
        writeLine(block.content, 10, false, [51, 65, 85]);
      }
    }
  }

  // Code snippets summary
  if (data.code_snippets?.length && !clean) {
    checkPage(20); y += 5;
    writeLine('Code Files Included', 12, true, [34, 211, 238]);
    pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
    data.code_snippets.forEach((s: any) => {
      writeLine(`📄 ${s.filename || 'code'} (${s.language})`, 10, true, [15, 23, 42]);
      if (s.explanation) writeLine(s.explanation, 9, false, [100, 116, 139]);
      y += 2;
    });
  }

  // Footer on every page
  if (!clean) {
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(148, 163, 184);
      pdf.text(`Mi-Assignment © ${new Date().getFullYear()} — Page ${i} of ${totalPages}`, MARGIN, 290);
      if (!isPro) {
        pdf.setFontSize(7); pdf.setTextColor(170, 170, 170);
        pdf.text(WATERMARK, W / 2, 295, { align: 'center' });
      }
    }
  }

  return pdf.output('blob');
}


// ─── WATERMARK ──────────────────────────────────────────────────────────────
const WATERMARK = "Powered by Mi-Assignment · www.mi-assignment.com · Upgrade for unlimited missions";

// ─── MAIN EXPORT FUNCTION ────────────────────────────────────────────────────
export async function downloadMissionPackage(data: any, payloadName: string = "Mission_Intelligence", isPro = false) {
  const zip = new JSZip();
  const safeName = payloadName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'Mission';

  // 1. README
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
    `- \`Full_Breakdown_With_Steps.pdf\` — Branded Mi-Assignment report with logic steps`,
    `- \`Full_Breakdown_With_Steps.docx\` — Branded Mi-Assignment report (Editable)`,
    data.presentation_slides?.length ? `- \`Briefing_Deck.pptx\` — ${data.presentation_slides.length} slide presentation` : '',
    data.data_sheet?.rows?.length ? `- \`Data_Sheet.csv\` — Data table (${data.data_sheet.rows.length} rows)` : '',
    (data.data_sheet?.rows?.length && ['computer_science', 'sql_database', 'data_analysis'].includes(data.assignment_type || '')) ? `- \`Database_Import.sql\` — SQL CREATE + INSERT statements` : '',
    data.code_snippets?.length ? `- \`Source_Code/\` — ${data.code_snippets.length} code file(s)` : '',
    // raw_data.json not included in student package
  ].filter(Boolean).join('\n');
  zip.file('README.md', readme);

  // 2. PDFs
  try {
    const fullPdfBlob = await buildPDF(data, payloadName, isPro, false);
    zip.file('Full_Breakdown_With_Steps.pdf', fullPdfBlob);
    
    const cleanPdfBlob = await buildPDF(data, payloadName, isPro, true);
    zip.file('Submission_Clean.pdf', cleanPdfBlob);
  } catch (e) { console.warn('PDF generation failed:', e); }

  // 2b. DOCX Files
  try {
    const fullDocxBlob = await buildDocx(data, payloadName, isPro, false);
    zip.file('Full_Breakdown_With_Steps.docx', fullDocxBlob);
    
    const cleanDocxBlob = await buildDocx(data, payloadName, isPro, true);
    zip.file('Submission_Clean.docx', cleanDocxBlob);
  } catch (e) { console.warn('DOCX generation failed:', e); }

  // 2c. Excel (.xlsx)
  if (data.data_sheet?.rows?.length) {
    try {
      const ws = XLSX.utils.aoa_to_sheet([data.data_sheet.headers, ...data.data_sheet.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file('Data_Sheet.xlsx', xlsxBuffer);
    } catch (e) { console.warn('XLSX generation failed:', e); }
  }

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
          { text: { text: isPro ? 'Mi-Assignment' : 'Mi-Assignment · www.mi-assignment.com', options: { x: 0.3, y: '96.5%', w: 8, h: 0.18, fontSize: 7, color: '64748B', fontFace: 'Helvetica' } } },
        ],
      });

      pres.defineSlideMaster({
        title: 'LIGHT',
        background: { color: 'F8FAFC' },
        objects: [
          { rect: { x: 0, y: 0, w: '100%', h: 0.08, fill: { color: '0F172A' } } },
          { rect: { x: 0, y: '95%', w: '100%', h: '5%', fill: { color: 'F1F5F9' } } },
          { text: { text: isPro ? 'Mi-Assignment' : 'Mi-Assignment · www.mi-assignment.com', options: { x: 0.3, y: '96.5%', w: 8, h: 0.18, fontSize: 7, color: '94A3B8', fontFace: 'Helvetica' } } },
        ],
      });

      // ── Dynamic Layout Engine — 3 Professional Layouts ──────────────────
      // A: McKinsey Split (50/50) — image left, text right
      // B: Cinematic Hero (full background) — image fills slide, text centered
      // C: Minimalist Scholar (text only) — no image, typography-first
      const BRAND_CYAN = '22D3EE';
      const BRAND_PURPLE = 'A855F7';
      const DARK_BG = '020617';
      const TEXT_DARK = '1E293B';
      const TEXT_MID = '475569';
      const TEXT_LIGHT = '94A3B8';

      // Force-assign layout per slide for visual variety
      const assignLayout = (sd: any, idx: number, hasImg: boolean): 'split' | 'hero' | 'scholar' => {
        if (idx === 0) return hasImg ? 'hero' : 'scholar'; // Title always hero or scholar
        if (!hasImg) return 'scholar';                       // No image = scholar
        const sd_type = sd.slide_type || '';
        if (sd_type === 'hook' || sd_type === 'conclusion') return 'hero';
        if (sd_type === 'analysis' || sd_type === 'recommendation') return 'scholar';
        // Alternate: split for odd, scholar for even (with image fallback)
        const patterns: Array<'split' | 'hero' | 'scholar'> = ['split', 'scholar', 'hero', 'split', 'scholar', 'split', 'hero', 'scholar', 'split', 'hero'];
        return hasImg ? (patterns[idx % patterns.length] || 'split') : 'scholar';
      };

      slides.forEach((sd: any, idx: number) => {
        const imgUrl = sd.image_url?.startsWith('http') || sd.image_url?.startsWith('data:') ? sd.image_url : null;
        const chosenLayout = assignLayout(sd, idx, !!imgUrl);
        const isTitleSlide = idx === 0;

        // ── Layout A: McKinsey Split ─────────────────────────────────────
        if (chosenLayout === 'split') {
          const slide = pres.addSlide({ masterName: 'LIGHT' });
          // Left panel — image
          if (imgUrl) {
            slide.addImage({ path: imgUrl, x: 0, y: 0, w: 4.8, h: '100%', sizing: { type: 'cover', w: 4.8, h: 7.5 } });
            // Cyan accent bar on image edge
            slide.addShape(pres.ShapeType.rect, { x: 4.7, y: 0, w: 0.06, h: '100%', fill: { color: BRAND_CYAN } });
          } else {
            // No image: left panel with brand gradient fill
            slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 4.8, h: '100%', fill: { color: DARK_BG } });
            slide.addText(sd.slide_type?.toUpperCase() || 'ANALYSIS', { x: 0.3, y: 3.2, w: 4.2, h: 1, fontSize: 13, color: BRAND_CYAN, bold: true, fontFace: 'Helvetica', align: 'center' });
          }
          // Right panel — text
          const tx = 5.1, tw = 4.6;
          slide.addText(sd.power_heading || `Slide ${idx + 1}`, { x: tx, y: 0.4, w: tw, h: 1.4, fontSize: 24, bold: true, color: TEXT_DARK, fontFace: 'Helvetica', align: 'left', wrap: true });
          slide.addShape(pres.ShapeType.rect, { x: tx, y: 1.85, w: 0.5, h: 0.04, fill: { color: BRAND_CYAN } });
          let ty = 2.0;
          if (sd.narrative) {
            slide.addText(sd.narrative, { x: tx, y: ty, w: tw, h: 1.0, fontSize: 11, color: TEXT_MID, fontFace: 'Helvetica', lineSpacing: 18, valign: 'top' });
            ty += 1.1;
          }
          if (sd.content_bullets?.length) {
            const bullets = sd.content_bullets.slice(0, 5).map((b: string) => ({ text: `${b}`, options: { bullet: { code: '25AA', color: BRAND_CYAN }, fontSize: 12, color: TEXT_DARK, fontFace: 'Helvetica', paraSpaceAfter: 6 } }));
            slide.addText(bullets as any, { x: tx, y: ty, w: tw, h: 3.5, valign: 'top' });
          }
          slide.addText(String(idx + 1), { x: '93%', y: '96%', w: '6%', h: '3%', fontSize: 8, color: TEXT_LIGHT, align: 'right' });
          if (sd.speaker_notes) slide.addNotes(sd.speaker_notes);
        }

        // ── Layout B: Cinematic Hero ─────────────────────────────────────
        else if (chosenLayout === 'hero') {
          const slide = pres.addSlide({ masterName: 'DARK' });
          if (imgUrl) {
            slide.addImage({ path: imgUrl, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover', w: '100%', h: '100%' } });
          }
          // 40% black overlay
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '000000', transparency: 40 } });
          // Gradient bottom fade
          slide.addShape(pres.ShapeType.rect, { x: 0, y: '60%', w: '100%', h: '40%', fill: { color: '000000', transparency: 10 } });
          // Slide type label
          if (sd.slide_type) {
            slide.addText(sd.slide_type.toUpperCase(), { x: '5%', y: '18%', w: '90%', h: 0.4, fontSize: 11, color: BRAND_CYAN, bold: true, align: 'center', fontFace: 'Helvetica' });
          }
          // Main heading — centered, bold white
          slide.addText(sd.power_heading || payloadName, { x: '5%', y: '28%', w: '90%', h: isTitleSlide ? 2.0 : 1.6, fontSize: isTitleSlide ? 44 : 34, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Helvetica', shadow: { type: 'outer', blur: 6, offset: 2, angle: 45, color: '000000', opacity: 0.6 } });
          if (!isTitleSlide && sd.content_bullets?.length) {
            const firstBullet = sd.content_bullets[0];
            slide.addText(firstBullet, { x: '10%', y: '62%', w: '80%', h: 0.8, fontSize: 16, color: 'E2E8F0', align: 'center', fontFace: 'Helvetica' });
          }
          if (sd.narrative && isTitleSlide) {
            slide.addText(sd.narrative, { x: '10%', y: '62%', w: '80%', h: 1.0, fontSize: 15, color: 'CBD5E1', align: 'center', fontFace: 'Helvetica' });
          }
          // Cyan accent line
          slide.addShape(pres.ShapeType.rect, { x: '40%', y: '55%', w: '20%', h: 0.03, fill: { color: BRAND_CYAN } });
          slide.addText(String(idx + 1), { x: '93%', y: '96%', w: '6%', h: '3%', fontSize: 8, color: '64748B', align: 'right' });
          if (sd.speaker_notes) slide.addNotes(sd.speaker_notes);
        }

        // ── Layout C: Minimalist Scholar ─────────────────────────────────
        else {
          const slide = pres.addSlide({ masterName: 'LIGHT' });
          // Top accent bar
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.06, fill: { color: BRAND_CYAN } });
          // Slide number + type label
          slide.addText(`${String(idx + 1).padStart(2,'0')} / ${slides.length.toString().padStart(2,'0')}`, { x: 0.5, y: 0.2, w: 2, h: 0.4, fontSize: 10, color: TEXT_LIGHT, fontFace: 'Helvetica', bold: false });
          if (sd.slide_type) slide.addText(sd.slide_type.toUpperCase(), { x: 7.5, y: 0.2, w: 2, h: 0.4, fontSize: 10, color: BRAND_CYAN, fontFace: 'Helvetica', bold: true, align: 'right' });
          // Heading — large, left-aligned
          slide.addText(sd.power_heading || `Slide ${idx + 1}`, { x: 0.5, y: 0.7, w: 9.0, h: 1.5, fontSize: 30, bold: true, color: TEXT_DARK, fontFace: 'Helvetica', align: 'left', wrap: true });
          // Cyan divider
          slide.addShape(pres.ShapeType.rect, { x: 0.5, y: 2.2, w: 1.2, h: 0.05, fill: { color: BRAND_CYAN } });
          // Narrative
          let cy = 2.4;
          if (sd.narrative) {
            slide.addText(sd.narrative, { x: 0.5, y: cy, w: 9.0, h: 1.1, fontSize: 13, color: TEXT_MID, fontFace: 'Helvetica', lineSpacing: 20, italic: true });
            cy += 1.2;
          }
          // Bullets — clean, no images competing
          if (sd.content_bullets?.length) {
            const bullets = sd.content_bullets.slice(0, 5).map((b: string) => ({
              text: b,
              options: { bullet: { code: '25AA', color: BRAND_CYAN }, fontSize: 14, color: TEXT_DARK, fontFace: 'Helvetica', paraSpaceAfter: 8, bold: false }
            }));
            slide.addText(bullets as any, { x: 0.5, y: cy, w: 9.0, h: 3.8, valign: 'top' });
          }
          // Bottom accent
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 7.44, w: '100%', h: 0.06, fill: { color: BRAND_PURPLE, transparency: 60 } });
          if (sd.speaker_notes) slide.addNotes(sd.speaker_notes);
        }
      });

      const pptxBlob = await pres.write({ outputType: 'blob' }) as Blob;
      zip.file('Briefing_Deck.pptx', pptxBlob);
    } catch (e) { console.warn('PPTX generation failed:', e); }
  }

  // 4. Data Sheet / SQL / XLSX
  if (data.data_sheet?.headers?.length && data.data_sheet?.rows?.length) {
    const csv = buildCSV(data.data_sheet.headers, data.data_sheet.rows);
    zip.file('Data_Sheet.csv', csv);

    // XLSX
    try {
      const ws = XLSX.utils.aoa_to_sheet([data.data_sheet.headers, ...data.data_sheet.rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file('Data_Sheet.xlsx', xlsxBuffer);
    } catch (e) {
      console.error("XLSX export failed", e);
    }

    // 5. SQL — only for CS/database assignments
    const isDbAssignment = ['computer_science', 'sql_database', 'data_analysis'].includes(data.assignment_type || '');
    if (isDbAssignment) {
    const tableName = (data.data_sheet.sql_table_name || data.data_sheet.sheet_name || 'mi_data')
      .replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase().substring(0, 50);
    let sql = `-- Mi-Assignment SQL Export\n-- Generated: ${new Date().toISOString()}\n\n`;
    sql += `DROP TABLE IF EXISTS ${tableName};\n`;
    sql += `CREATE TABLE ${tableName} (\n  id SERIAL PRIMARY KEY,\n`;
    data.data_sheet.headers.forEach((h: string, i: number) => {
      const col = h.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      sql += `  ${col} TEXT${i < data.data_sheet.headers.length - 1 ? ',' : ''}\n`;
    });
    sql += `);\n\n`;
    data.data_sheet.rows.forEach((row: string[]) => {
      const vals = row.map((v: string) => `'${String(v ?? '').replace(/'/g, "''")}'`).join(', ');
      sql += `INSERT INTO ${tableName} VALUES (DEFAULT, ${vals});\n`;
    });
    zip.file('Database_Import.sql', sql);
    } // end isDbAssignment
  }

  // 5b. Domain-specific extra files
  const extras = data.domain_extras;
  if (extras && typeof extras === 'object') {
    const domain = (data.domain || '').toUpperCase();

    // Alternative approaches — add to Full_Breakdown as extra section (handled in PDF/DOCX)
    // They appear as a section at the end of Full_Breakdown automatically via reconstructed_doc blocks

    // MEDICAL extras
    if (extras.medical) {
      const med = extras.medical;
      // Drug Interaction Matrix CSV
      if (med.drug_interaction_matrix?.length) {
        const headers = ['Drug A', 'Drug B', 'Interaction', 'Severity', 'Management'];
        const rows = med.drug_interaction_matrix.map((r: any) => [r.drug_a, r.drug_b, r.interaction, r.severity, r.management]);
        zip.file('Drug_Interaction_Matrix.csv', buildCSV(headers, rows));
      }
      // Patient Education Leaflet
      if (med.patient_leaflet) {
        zip.file('Patient_Education_Leaflet.txt', med.patient_leaflet);
      }
    }

    // LAW extras
    if (extras.law) {
      const lawData = extras.law;
      let lawRef = '# Case Law References & Legal Framework\n\n';
      if (lawData.legal_framework) lawRef += `## Legal Framework\n${lawData.legal_framework}\n\n`;
      if (lawData.irac) {
        lawRef += `## IRAC Analysis\n**Issue:** ${lawData.irac.issue}\n**Rule:** ${lawData.irac.rule}\n**Application:** ${lawData.irac.application}\n**Conclusion:** ${lawData.irac.conclusion}\n\n`;
      }
      if (lawData.case_references?.length) {
        lawRef += `## Case Precedents\n`;
        lawData.case_references.forEach((c: any) => {
          lawRef += `- **${c.case_name}** (${c.court}, ${c.year}): ${c.relevance}
`;
        });
      }
      zip.file('Case_Law_References.md', lawRef);
    }

    // BUSINESS extras
    if (extras.business) {
      const biz = extras.business;
      try {
        const wb2 = XLSX.utils.book_new();
        // Financial Projections sheet
        if (biz.financial_projections?.rows?.length) {
          const ws2 = XLSX.utils.aoa_to_sheet([biz.financial_projections.headers, ...biz.financial_projections.rows]);
          XLSX.utils.book_append_sheet(wb2, ws2, 'Financial Projections');
        }
        // Consumer Data sheet
        if (biz.consumer_data?.rows?.length) {
          const ws3 = XLSX.utils.aoa_to_sheet([biz.consumer_data.headers, ...biz.consumer_data.rows]);
          XLSX.utils.book_append_sheet(wb3, ws3, 'Consumer Data');
        }
        if (wb2.SheetNames?.length) {
          const xlsxBuf2 = XLSX.write(wb2, { bookType: 'xlsx', type: 'array' });
          zip.file('Financial_Projections.xlsx', xlsxBuf2);
        }
      } catch (e) { console.warn('Business extras xlsx failed:', e); }
    }

    // FINANCE extras
    if (extras.finance?.dcf_model) {
      try {
        const wb3 = XLSX.utils.book_new();
        const dcf = extras.finance.dcf_model;
        if (dcf.rows?.length) {
          const ws4 = XLSX.utils.aoa_to_sheet([dcf.headers, ...dcf.rows]);
          XLSX.utils.book_append_sheet(wb3, ws4, 'DCF Model');
        }
        if (extras.finance.sensitivity_table?.rows?.length) {
          const st = extras.finance.sensitivity_table;
          const ws5 = XLSX.utils.aoa_to_sheet([st.headers, ...st.rows]);
          XLSX.utils.book_append_sheet(wb3, ws5, 'Sensitivity Analysis');
        }
        if (wb3.SheetNames?.length) {
          const xlsxBuf3 = XLSX.write(wb3, { bookType: 'xlsx', type: 'array' });
          zip.file('DCF_Valuation_Model.xlsx', xlsxBuf3);
        }
      } catch (e) { console.warn('Finance extras xlsx failed:', e); }
    }

    // DATA SCIENCE extras
    if (extras.data_science) {
      const ds = extras.data_science;
      let readme = '# Model Documentation\n\n';
      if (ds.model_summary) {
        readme += `## Model Performance\n`;
        readme += `- Algorithm: ${ds.model_summary.algorithm}
`;
        readme += `- Accuracy: ${ds.model_summary.accuracy}
`;
        readme += `- Precision: ${ds.model_summary.precision}
`;
        readme += `- Recall: ${ds.model_summary.recall}
`;
        readme += `- F1 Score: ${ds.model_summary.f1}
`;
        readme += `- AUC-ROC: ${ds.model_summary.auc_roc}

`;
      }
      if (ds.hyperparameters?.length) {
        readme += `## Hyperparameters\n`;
        ds.hyperparameters.forEach((h: any) => { readme += `- **${h.param}** = ${h.value}: ${h.justification}
`; });
      }
      if (ds.environment_setup) readme += `\n## Setup\n\`\`\`\n${ds.environment_setup}\n\`\`\`\n`;
      zip.file('Model_Technical_Audit.md', readme);
    }

    // MEDIA extras
    if (extras.media?.content_calendar?.rows?.length) {
      try {
        const wb4 = XLSX.utils.book_new();
        const cc = extras.media.content_calendar;
        const ws6 = XLSX.utils.aoa_to_sheet([cc.headers, ...cc.rows]);
        XLSX.utils.book_append_sheet(wb4, ws6, 'Content Calendar');
        if (extras.media.sentiment_analysis?.length) {
          const saHeaders = ['Segment', 'Sentiment', 'Score', 'Key Themes'];
          const saRows = extras.media.sentiment_analysis.map((s: any) => [s.segment, s.sentiment, s.score, (s.key_themes || []).join(', ')]);
          const ws7 = XLSX.utils.aoa_to_sheet([saHeaders, ...saRows]);
          XLSX.utils.book_append_sheet(wb4, ws7, 'Sentiment Analysis');
        }
        const xlsxBuf4 = XLSX.write(wb4, { bookType: 'xlsx', type: 'array' });
        zip.file('Content_Calendar.xlsx', xlsxBuf4);
      } catch (e) { console.warn('Media extras failed:', e); }
    }

    // HUMANITIES extras
    if (extras.humanities) {
      const hum = extras.humanities;
      let bib = '# Primary Sources & Bibliography\n\n';
      if (hum.thesis_statement) bib += `**Thesis:** ${hum.thesis_statement}\n\n`;
      if (hum.primary_sources?.length) {
        bib += `## Primary Sources\n`;
        hum.primary_sources.forEach((s: any) => { bib += `- [${s.type?.toUpperCase()}] ${s.source} - ${s.annotation}\n`; });
        bib += '\n';
      }
      if (hum.counter_arguments?.length) {
        bib += `## Counter-Arguments & Rebuttals\n`;
        hum.counter_arguments.forEach((c: any) => { bib += `**Against:** ${c.argument}\n**Rebuttal:** ${c.rebuttal}\n\n`; });
      }
      zip.file('Primary_Sources_Bibliography.md', bib);
    }

    // ALTERNATIVE APPROACHES (all domains)
    if (extras.alternative_approaches?.length) {
      let alt = '# Alternative Approaches Considered\n\n';
      extras.alternative_approaches.forEach((a: any, i: number) => {
        alt += `## Option ${i + 1}: ${a.title}
${a.description}

`;
      });
      zip.file('Alternative_Approaches.md', alt);
    }
  }

  // 6. Code files
  if (data.code_snippets?.length) {
    const folder = zip.folder('Source_Code')!;
    const extMap: Record<string, string> = { python: 'py', javascript: 'js', typescript: 'ts', java: 'java', cpp: 'cpp', c: 'c', sql: 'sql', r: 'R', matlab: 'm', html: 'html', css: 'css', bash: 'sh' };
    data.code_snippets.forEach((s: any, i: number) => {
      const ext = extMap[s.language?.toLowerCase()] || s.language?.toLowerCase() || 'txt';
      const fname = s.filename || `file_${i + 1}.${ext}`;
      let content = s.code || '';
      if (s.explanation) content = `# ${s.explanation}\n\n${content}`;
      folder.file(fname, content);
    });
  }

  // 7. Raw JSON
  // raw_data.json excluded from student package (internal Mi data)
    //zip.file('raw_data.json', JSON.stringify(data, null, 2));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  saveAs(blob, `${safeName}_MI_Package.zip`);
}
