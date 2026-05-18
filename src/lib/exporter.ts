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
// Strip hidden AI watermark / invisible unicode characters from all output text
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  return text.split('').filter(ch => {
    const c = ch.charCodeAt(0);
    if (c === 0x200B || c === 0x200C || c === 0x200D || c === 0x200E || c === 0x200F) return false;
    if (c >= 0x2060 && c <= 0x2064) return false;
    if (c === 0xFEFF) return false;
    if (c >= 0x202A && c <= 0x202E) return false;
    if (c === 0x2028 || c === 0x2029) return false;
    if (c === 0x00AD) return false;
    return true;
  }).join('').replace(/ /g, ' ').replace(/ /g, ' ').trim();
}

function cleanLaTeX(text: string): string {
  if (!text) return "";
  
  // Strip hidden chars first
  let cleaned = sanitizeText(text);

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
            children: [new TextRun({ text: "[Technical Diagram — view full interactive version in the Mi-Assignment web app. The diagram shows the engineering schematic for this section.]", italics: true, color: "64748B" })],
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

  // Render Arabic text via canvas → PNG → embed in PDF (bypasses jsPDF font limitation)
  const writeArabicLine = async (text: string, size = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    try {
      const canvas = document.createElement('canvas');
      const pxPerMm = 3.78;
      const canvasW = Math.round((W - MARGIN * 2) * pxPerMm);
      const fontSize = size * pxPerMm * 0.85;
      canvas.width = canvasW;
      canvas.height = Math.round(fontSize * 1.6);
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
      ctx.font = `${bold ? 'bold' : 'normal'} ${fontSize}px Cairo, Arial, sans-serif`;
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      // Word-wrap manually
      const words = text.split(' ');
      let line = '';
      const lineHeight = fontSize * 1.4;
      const lines: string[] = [];
      for (const word of words) {
        const testLine = line ? word + ' ' + line : word;
        if (ctx.measureText(testLine).width > canvasW - 10 && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line);
      canvas.height = Math.round(lineHeight * lines.length + 4);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
      ctx.font = `${bold ? 'bold' : 'normal'} ${fontSize}px Cairo, Arial, sans-serif`;
      ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, canvasW - 2, i * lineHeight + 2));
      const dataUrl = canvas.toDataURL('image/png');
      const imgH = (canvas.height / pxPerMm);
      const imgW = W - MARGIN * 2;
      checkPage(imgH + 2);
      pdf.addImage(dataUrl, 'PNG', MARGIN, y - 2, imgW, imgH);
      y += imgH;
    } catch {
      // Fallback: just skip unrenderable Arabic — DOCX has full Arabic support
    }
  };

  const writeLine = (text: string, size = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    if (!text || text === 'undefined') return;
    const rawText = cleanLaTeX(text);
    const isRTL = isArabicText(rawText);
    if (isRTL) {
      // Queue async Arabic render — handled below via writeLineAsync
      return;
    }
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(rawText, W - MARGIN * 2);
    lines.forEach((line: string) => {
      checkPage();
      pdf.text(line, MARGIN, y);
      y += LINE_H;
    });
  };

  // Async version for Arabic (must be awaited where used)
  const writeLineAsync = async (text: string, size = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    if (!text || text === 'undefined') return;
    const rawText = cleanLaTeX(text);
    if (isArabicText(rawText)) {
      await writeArabicLine(rawText, size, bold, color);
    } else {
      writeLine(rawText, size, bold, color);
    }
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
  await writeLineAsync(payloadName, 15, true, [15, 23, 42]);
  y += 3;

  // Summary
  if (data.solution_text && !clean) {
    writeLine('Summary', 11, true, [34, 211, 238]);
    pdf.setDrawColor(34, 211, 238); pdf.setLineWidth(0.4);
    pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
    await writeLineAsync(data.solution_text, 10, false, [71, 85, 105]);
    y += 4;
  }

  // Document blocks
  const doc = data.reconstructed_doc;
  if (doc) {
    if (doc.title) { await writeLineAsync(doc.title, 14, true, [15, 23, 42]); y += 2; }
    for (const block of (doc.blocks || [])) {
      checkPage(10);
      if (block.type === 'heading') {
        y += 3;
        // Skip heading if it duplicates the document title (already written at top)
        if (!block.content || block.content.trim() === (payloadName || '').trim()) {
          // skip - duplicate title
        } else {
          await writeLineAsync(block.content, 13, true, [15, 23, 42]);
        pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2);
        pdf.line(MARGIN, y, W - MARGIN, y); y += 5;
        }
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
          for (const [i, s] of (block.solution_steps as string[]).entries()) {
            await writeLineAsync(`  ${i + 1}. ${s}`, 9, false, [71, 85, 105]);
          }
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
        for (const item of items) {
          await writeLineAsync(`• ${item.replace(/^[-•]\s*/, '')}`, 10, false, [51, 65, 85]);
        }
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
           writeLine("[Technical Diagram — view full interactive version in the Mi-Assignment web app. The diagram shows the engineering schematic for this section.]", 10, true, [148, 163, 184]);
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
          await writeLineAsync(String(block.content), 10, false, [51, 65, 85]);
        }
        // else: empty table — skip, render nothing
      } else if (block.content && block.content !== 'undefined') {
        await writeLineAsync(block.content, 10, false, [51, 65, 85]);
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
const WATERMARK = "Powered by Mi-Assignment · www.mi-assignment.com";

// ─── MAIN EXPORT FUNCTION ────────────────────────────────────────────────────
export async function downloadMissionPackage(data: any, payloadName: string = "Mission_Intelligence", isPro = false) {
  const zip = new JSZip();
  // RTL detection for Arabic assignments
  const _hasArabic = (t: string) => /[؀-ۿ]/.test(t || '');
  const isRTLDoc = _hasArabic(payloadName) || _hasArabic(data?.solution_text || '');
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
      pres.layout = 'LAYOUT_WIDE'; // 13.33" × 7.5"

      // ── EDITORIAL MINIMAL COLOUR SYSTEM ─────────────────────────────────
      // Inspired by: clean agency decks, Behance editorial, minimal magazine
      const C = {
        white:    'FFFFFF',
        warm:     'FAFAF9',       // off-white warm
        stone50:  'F5F5F4',       // very light stone
        stone100: 'E7E5E4',       // light rule line
        stone300: 'D6D3D1',       // medium border
        stone400: 'A8A29E',       // muted text
        stone600: '57534E',       // body text
        stone800: '292524',       // heading dark
        stone900: '1C1917',       // near black
        black:    '0C0A09',       // true black for impact
        accent:   '22D3EE',       // Mi brand cyan — used sparingly
        accentDim:'0E7490',
        gold:     'D4A853',       // optional warm accent for awards/stats
      };

      // ── TYPOGRAPHY SCALE ─────────────────────────────────────────────────
      // Title: 52pt bold caps / Heading: 36pt bold / Sub: 13pt regular italic
      // Body: 13pt regular / Label: 8pt tracked caps / Number: 60pt bold

      // ── MASTER — single clean white master ───────────────────────────────
      pres.defineSlideMaster({
        title: 'EDITORIAL',
        background: { color: C.white },
        objects: [],  // no master chrome — everything per-slide for full control
      });
      pres.defineSlideMaster({
        title: 'DARK',
        background: { color: C.stone900 },
        objects: [],
      });

      const W = 13.33, H = 7.5;

      // ── HELPERS ───────────────────────────────────────────────────────────
      const rule = (slide: any, x: number, y: number, w: number, color = C.stone100) =>
        slide.addShape(pres.ShapeType.rect, { x, y, w, h: 0.012, fill: { color } });

      const label = (slide: any, text: string, x: number, y: number, w: number, color = C.stone400) =>
        slide.addText(text.toUpperCase(), {
          x, y, w, h: 0.3, fontSize: 7.5, bold: true, color,
          fontFace: 'Helvetica', charSpacing: 2.5, align: 'left',
        });

      const counter = (slide: any, cur: number, total: number, dark = false) =>
        slide.addText(`${String(cur).padStart(2,'0')} — ${String(total).padStart(2,'0')}`, {
          x: W - 1.6, y: 0.28, w: 1.4, h: 0.25,
          fontSize: 8, color: dark ? C.stone400 : C.stone300,
          fontFace: 'Helvetica', align: 'right', charSpacing: 1,
        });

      const accentDot = (slide: any, x: number, y: number, dark = false) =>
        slide.addShape(pres.ShapeType.ellipse, {
          x, y, w: 0.1, h: 0.1, fill: { color: dark ? C.accent : C.accent },
        });

      // ── LAYOUT ASSIGNMENT ─────────────────────────────────────────────────
      // COVER | CHAPTER | SPLIT | GRID | STAT_GRID | FULLBLEED | CLOSER
      const getLayout = (sd: any, idx: number, total: number, hasImg: boolean): string => {
        if (idx === 0) return 'COVER';
        if (idx === total - 1) return 'CLOSER';
        const bullets: string[] = sd.content_bullets || [];
        const statCount = bullets.filter((b: string) => /\d+[%+]?/.test(b)).length;
        if (statCount >= 3 && !hasImg) return 'STAT_GRID';
        if (hasImg && idx % 3 === 1) return 'FULLBLEED';
        if (hasImg) return 'SPLIT';
        if (bullets.length >= 5) return 'GRID';
        return 'CHAPTER';
      };

      slides.forEach((sd: any, idx: number) => {
        const total = slides.length;
        const hasImg = !!(sd.image_url?.startsWith('http') || sd.image_url?.startsWith('data:'));
        const layout = getLayout(sd, idx, total, hasImg);
        const heading = (sd.power_heading || (idx === 0 ? payloadName : `Slide ${idx + 1}`)).toUpperCase();
        const narrative = sd.narrative || '';
        const bullets: string[] = sd.content_bullets || [];
        let slide: any;

        // ════════════════════════════════════════════════════════════════════
        // COVER — editorial magazine title page
        // Left: large title + subtitle | Right: image or geometric block
        // ════════════════════════════════════════════════════════════════════
        if (layout === 'COVER') {
          slide = pres.addSlide({ masterName: 'EDITORIAL' });
          // Full white base
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.white } });
          // Right panel — image or dark block
          const panelX = W * 0.52;
          if (hasImg) {
            slide.addImage({ path: sd.image_url, x: panelX, y: 0, w: W - panelX, h: H,
              sizing: { type: 'cover', w: W - panelX, h: H } });
          } else {
            slide.addShape(pres.ShapeType.rect, { x: panelX, y: 0, w: W - panelX, h: H,
              fill: { color: C.stone800 } });
            // Subtle grid lines on dark panel
            for (let i = 1; i < 4; i++) {
              slide.addShape(pres.ShapeType.rect, {
                x: panelX, y: H * i / 4, w: W - panelX, h: 0.005,
                fill: { color: C.stone600 },
              });
            }
          }
          // Left text area
          // Top label
          label(slide, 'Mi — Assignment', 0.7, 0.4, 4.0);
          // Rule under label
          rule(slide, 0.7, 0.78, 4.0);
          // Main title — large, bold, stacked
          slide.addText(heading, {
            x: 0.7, y: 1.1, w: W * 0.48, h: 3.8,
            fontSize: 48, bold: true, color: C.stone900,
            fontFace: 'Helvetica', align: 'left', valign: 'top', wrap: true,
          });
          // Divider rule
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: 5.1, w: W * 0.46, h: 0.04, fill: { color: C.stone200 } });
          // Accent dot
          accentDot(slide, 0.7, 5.03);
          // Subtitle / narrative — always show something
          slide.addText(narrative || 'Prepared with Mi-Assignment', {
            x: 0.85, y: 5.25, w: W * 0.44, h: 1.5,
            fontSize: 13, color: C.stone600, fontFace: 'Helvetica',
            align: 'left', italic: true, wrap: true,
          });
          // Bottom left year/date label
          label(slide, new Date().getFullYear().toString(), 0.7, H - 0.55, 2.0, C.stone300);

        // ════════════════════════════════════════════════════════════════════
        // CHAPTER — clean typography-first, rule lines, left heading
        // ════════════════════════════════════════════════════════════════════
        } else if (layout === 'CHAPTER') {
          slide = pres.addSlide({ masterName: 'EDITORIAL' });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.warm } });
          counter(slide, idx + 1, total);
          // Top rule
          rule(slide, 0.7, 0.6, W - 1.4);
          // Section label
          label(slide, `${String(idx + 1).padStart(2,'0')} / Analysis`, 0.7, 0.7, 3.0);
          // Big heading
          slide.addText(heading, {
            x: 0.7, y: 1.05, w: W * 0.65, h: 1.9,
            fontSize: 32, bold: true, color: C.stone900,
            fontFace: 'Helvetica', align: 'left', valign: 'top', wrap: true,
          });
          // Mid rule
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: 3.05, w: W - 1.4, h: 0.04, fill: { color: C.stone200 } });
          // Narrative italic
          let ty = 3.2;
          if (narrative) {
            slide.addText(narrative, {
              x: 0.7, y: ty, w: W - 1.4, h: 0.7,
              fontSize: 13, color: C.stone600, fontFace: 'Helvetica', italic: true,
            });
            ty += 0.85;
          }
          // Bullets — 2 columns for 4+
          if (bullets.length >= 4) {
            const half = Math.ceil(bullets.length / 2);
            const colW = (W - 1.6) / 2 - 0.3;
            [bullets.slice(0, half), bullets.slice(half)].forEach((col, ci) => {
              const cx = 0.7 + ci * (colW + 0.6);
              col.forEach((b: string, bi: number) => {
                slide.addText(`${String(bi + 1 + ci * half).padStart(2,'0')}  ${b}`, {
                  x: cx, y: ty + bi * 0.52, w: colW, h: 0.5,
                  fontSize: 12.5, color: C.stone800, fontFace: 'Helvetica',
                });
                rule(slide, cx, ty + bi * 0.52 + 0.45, colW, C.stone100);
              });
            });
          } else {
            bullets.forEach((b: string, bi: number) => {
              slide.addText(`${String(bi + 1).padStart(2,'0')}  ${b}`, {
                x: 0.7, y: ty + bi * 0.6, w: W - 1.4, h: 0.55,
                fontSize: 13, color: C.stone800, fontFace: 'Helvetica',
              });
              rule(slide, 0.7, ty + bi * 0.6 + 0.5, W - 1.4, C.stone100);
            });
          }
          // Bottom rule
          rule(slide, 0.7, H - 0.35, W - 1.4);

        // ════════════════════════════════════════════════════════════════════
        // SPLIT — text left, image right with editorial caption zone
        // ════════════════════════════════════════════════════════════════════
        } else if (layout === 'SPLIT') {
          slide = pres.addSlide({ masterName: 'EDITORIAL' });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.white } });
          const splitX = W * 0.5;
          // Right image
          if (hasImg) {
            slide.addImage({ path: sd.image_url, x: splitX, y: 0, w: W - splitX, h: H,
              sizing: { type: 'cover', w: W - splitX, h: H } });
          } else {
            slide.addShape(pres.ShapeType.rect, { x: splitX, y: 0, w: W - splitX, h: H,
              fill: { color: C.stone50 } });
          }
          // Thin vertical divider
          slide.addShape(pres.ShapeType.rect, { x: splitX - 0.01, y: 0, w: 0.01, h: H, fill: { color: C.stone100 } });
          counter(slide, idx + 1, total);
          // Top rule
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: 0.55, w: splitX - 1.0, h: 0.04, fill: { color: C.stone200 } });
          label(slide, `Section ${String(idx + 1).padStart(2,'0')}`, 0.7, 0.65, 3.0);
          // Heading tighter
          slide.addText(heading, {
            x: 0.7, y: 1.05, w: splitX - 1.0, h: 1.9,
            fontSize: 28, bold: true, color: C.stone900,
            fontFace: 'Helvetica', align: 'left', valign: 'top', wrap: true,
          });
          // Divider under heading
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: 3.05, w: splitX - 1.0, h: 0.04, fill: { color: C.stone200 } });
          // Narrative always visible
          slide.addText(narrative || 'Key findings from this section:', {
            x: 0.7, y: 3.2, w: splitX - 1.0, h: 0.6,
            fontSize: 11.5, color: C.stone500, fontFace: 'Helvetica', italic: true,
          });
          // Bullets with visible rule lines
          bullets.slice(0, 5).forEach((b: string, bi: number) => {
            const by = 3.95 + bi * 0.62;
            slide.addText(`${String(bi + 1).padStart(2,'0')}   ${b}`, {
              x: 0.7, y: by, w: splitX - 1.0, h: 0.5,
              fontSize: 12.5, color: C.stone800, fontFace: 'Helvetica',
            });
            slide.addShape(pres.ShapeType.rect, { x: 0.7, y: by + 0.5, w: splitX - 1.1, h: 0.025, fill: { color: C.stone100 } });
          });
          // Bottom rule
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: H - 0.38, w: splitX - 1.0, h: 0.04, fill: { color: C.stone200 } });

        // ════════════════════════════════════════════════════════════════════
        // FULLBLEED — image fills entire slide, text overlay bottom-left
        // ════════════════════════════════════════════════════════════════════
        } else if (layout === 'FULLBLEED') {
          slide = pres.addSlide({ masterName: 'DARK' });
          if (hasImg) {
            slide.addImage({ path: sd.image_url, x: 0, y: 0, w: W, h: H,
              sizing: { type: 'cover', w: W, h: H } });
          }
          // Layered dark overlays for readability
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.stone900, transparency: 55 } });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: H * 0.38, w: W, h: H * 0.62, fill: { color: C.stone900, transparency: 20 } });
          // Counter top-right
          counter(slide, idx + 1, total, true);
          // Slide number top-left + rule
          slide.addText(`${String(idx + 1).padStart(2,'0')}`, {
            x: 0.7, y: 0.4, w: 1.5, h: 0.3,
            fontSize: 9, color: 'FFFFFF', fontFace: 'Helvetica', charSpacing: 2,
          });
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: 0.76, w: 1.5, h: 0.04, fill: { color: C.white } });
          // Heading at 42% down
          slide.addText(heading, {
            x: 0.7, y: H * 0.42, w: W * 0.72, h: 1.8,
            fontSize: 36, bold: true, color: C.white,
            fontFace: 'Helvetica', align: 'left', valign: 'top', wrap: true,
          });
          // Divider
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: H * 0.42 + 1.92, w: W * 0.68, h: 0.04, fill: { color: C.white } });
          // Narrative
          slide.addText(narrative || '', {
            x: 0.7, y: H * 0.42 + 2.06, w: W * 0.68, h: 0.55,
            fontSize: 12, color: 'D6D3D1', fontFace: 'Helvetica', italic: true,
          });
          // Bottom bullets in 3 columns
          if (bullets.length) {
            const bCount = Math.min(bullets.length, 3);
            const bW = (W - 1.4) / bCount;
            bullets.slice(0, bCount).forEach((b: string, bi: number) => {
              const bx = 0.7 + bi * bW;
              slide.addShape(pres.ShapeType.rect, { x: bx, y: H - 1.55, w: bW - 0.25, h: 0.04, fill: { color: C.accent } });
              slide.addText(b, {
                x: bx, y: H - 1.38, w: bW - 0.25, h: 0.9,
                fontSize: 11, color: 'E7E5E4', fontFace: 'Helvetica', wrap: true, valign: 'top',
              });
            });
          }
          // Mi-Assignment badge
          slide.addText('Mi-Assignment', {
            x: W - 2.2, y: H - 0.32, w: 2.0, h: 0.25,
            fontSize: 7.5, color: 'A8A29E', fontFace: 'Helvetica', align: 'right',
          });

        // ════════════════════════════════════════════════════════════════════
        // STAT_GRID — 2×2 or 1×3 big number cards, ultra minimal
        // ════════════════════════════════════════════════════════════════════
        } else if (layout === 'STAT_GRID') {
          slide = pres.addSlide({ masterName: 'EDITORIAL' });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.white } });
          counter(slide, idx + 1, total);
          rule(slide, 0.7, 0.6, W - 1.4);
          label(slide, `Key Figures`, 0.7, 0.7, 3.0);
          slide.addText(heading, {
            x: 0.7, y: 1.0, w: W - 1.4, h: 1.1,
            fontSize: 30, bold: true, color: C.stone900,
            fontFace: 'Helvetica', align: 'left', wrap: true,
          });
          rule(slide, 0.7, 2.2, W - 1.4);
          // Cards
          const stats = bullets.slice(0, 4);
          const cols = stats.length <= 3 ? stats.length : 2;
          const rows = Math.ceil(stats.length / cols);
          const cW = (W - 1.4) / cols;
          const cH = (H - 2.8) / rows;
          stats.forEach((b: string, bi: number) => {
            const col = bi % cols, row = Math.floor(bi / cols);
            const cx = 0.7 + col * cW, cy = 2.5 + row * cH;
            // Card border
            rule(slide, cx, cy, cW - 0.3, C.stone100);
            // Extract number
            const numMatch = b.match(/([\d,\.]+[%+×x]?)/);
            const num = numMatch ? numMatch[1] : '—';
            const lbl = b.replace(/([\d,\.]+[%+×x]?\s*)/, '').trim();
            // Big number
            slide.addText(num, {
              x: cx, y: cy + 0.15, w: cW - 0.3, h: cH * 0.55,
              fontSize: cols === 2 ? 52 : 44, bold: true, color: C.stone900,
              fontFace: 'Helvetica', align: 'left', valign: 'middle',
            });
            // Accent dot next to number
            accentDot(slide, cx + (num.length * (cols === 2 ? 0.35 : 0.28)), cy + 0.2);
            // Label
            slide.addText(lbl, {
              x: cx, y: cy + cH * 0.62, w: cW - 0.3, h: cH * 0.35,
              fontSize: 12, color: C.stone400,
              fontFace: 'Helvetica', align: 'left', wrap: true,
            });
            // Bottom rule per card
            rule(slide, cx, cy + cH - 0.1, cW - 0.3);
          });

        // ════════════════════════════════════════════════════════════════════
        // GRID — 3 or 4 content cards in a clean grid layout
        // ════════════════════════════════════════════════════════════════════
        } else if (layout === 'GRID') {
          slide = pres.addSlide({ masterName: 'EDITORIAL' });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.stone50 } });
          // Dark header bar
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: 1.9, fill: { color: C.stone900 } });
          counter(slide, idx + 1, total, true);
          slide.addText(heading, {
            x: 0.7, y: 0.3, w: W - 1.4, h: 1.3,
            fontSize: 28, bold: true, color: C.white,
            fontFace: 'Helvetica', align: 'left', valign: 'middle', wrap: true,
          });
          // Accent line in header
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 1.9, w: W, h: 0.035, fill: { color: C.accent } });
          // Bullet cards
          const cols = bullets.length <= 3 ? bullets.length : bullets.length <= 4 ? 2 : 3;
          const cardW = (W - 0.7 * 2 - 0.25 * (cols - 1)) / cols;
          const cardH = H - 2.35 - 0.35;
          bullets.slice(0, cols <= 2 ? 4 : 6).forEach((b: string, bi: number) => {
            const col = bi % cols, row = Math.floor(bi / cols);
            const cx = 0.7 + col * (cardW + 0.25);
            const cy = 2.1 + row * (cardH / Math.ceil(bullets.length / cols) + 0.15);
            // Card bg
            slide.addShape(pres.ShapeType.rect, { x: cx, y: cy, w: cardW, h: cardH / Math.ceil(bullets.length / cols),
              fill: { color: C.white }, line: { color: C.stone100, width: 0.5 } });
            // Card number
            label(slide, String(bi + 1).padStart(2,'0'), cx + 0.2, cy + 0.18, 0.6, C.stone300);
            // Card content
            slide.addText(b, {
              x: cx + 0.2, y: cy + 0.48, w: cardW - 0.4, h: cardH / Math.ceil(bullets.length / cols) - 0.65,
              fontSize: 12, color: C.stone800, fontFace: 'Helvetica', wrap: true, valign: 'top',
            });
          });

        // ════════════════════════════════════════════════════════════════════
        // CLOSER — clean dark conclusion
        // ════════════════════════════════════════════════════════════════════
        } else {
          slide = pres.addSlide({ masterName: 'DARK' });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: C.stone900 } });
          if (hasImg) {
            slide.addImage({ path: sd.image_url, x: W * 0.55, y: 0, w: W * 0.45, h: H,
              sizing: { type: 'cover', w: W * 0.45, h: H } });
            slide.addShape(pres.ShapeType.rect, { x: W * 0.55, y: 0, w: W * 0.45, h: H,
              fill: { color: C.stone900, transparency: 40 } });
            // Vertical divider
            slide.addShape(pres.ShapeType.rect, { x: W * 0.55, y: 0, w: 0.012, h: H, fill: { color: C.stone600 } });
          }
          counter(slide, idx + 1, total, true);
          // White rule
          slide.addShape(pres.ShapeType.rect, { x: 0.7, y: 1.8, w: 2.0, h: 0.012, fill: { color: C.white } });
          label(slide, 'Conclusion', 0.7, 1.35, 4.0, C.stone400);
          slide.addText(heading, {
            x: 0.7, y: 2.0, w: W * 0.5, h: 2.5,
            fontSize: 36, bold: true, color: C.white,
            fontFace: 'Helvetica', align: 'left', valign: 'top', wrap: true,
          });
          if (narrative) {
            slide.addText(narrative, {
              x: 0.7, y: 4.7, w: W * 0.5, h: 0.7,
              fontSize: 13, color: C.stone400, fontFace: 'Helvetica', italic: true,
            });
          }
          bullets.slice(0, 4).forEach((b: string, bi: number) => {
            const by = 5.3 + bi * 0.46;
            slide.addShape(pres.ShapeType.rect, { x: 0.7, y: by + 0.07, w: 0.07, h: 0.07, fill: { color: C.accent } });
            slide.addText(b, {
              x: 0.9, y: by, w: W * 0.5, h: 0.38,
              fontSize: 12, color: C.stone400, fontFace: 'Helvetica', wrap: true,
            });
          });
          // Mi-Assignment branding
          label(slide, 'Mi — Assignment', 0.7, H - 0.5, 4.0, C.stone600);
        }

        if (sd.speaker_notes && slide) slide.addNotes(sd.speaker_notes);
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

    // ENGINEERING sizing calculator — when data_sheet exists for engineering
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

    // MEDICAL extras — ONLY for medical domain assignments
    const isMedicalDomain = (data.domain || '').toUpperCase().includes('MEDICAL');
    if (isMedicalDomain && extras.medical) {
      const med = extras.medical;
      // Drug Interaction Matrix CSV
      if (med.drug_interaction_matrix?.length) {
        const headers = ['Drug A', 'Drug B', 'Interaction', 'Severity', 'Management'];
        const rows = med.drug_interaction_matrix.map((r: any) => [r.drug_a, r.drug_b, r.interaction, r.severity, r.management]);
        zip.file('Drug_Interaction_Matrix.csv', buildCSV(headers, rows));
      }
      // Patient Education Leaflet — only for medical
      if (isMedicalDomain && med.patient_leaflet) {
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
  // ── SVG Diagrams — add each svg block as a standalone file ──────────────
  if (data.reconstructed_doc?.blocks) {
    let svgCount = 0;
    data.reconstructed_doc.blocks.forEach((block: any) => {
      if (block.type === 'svg' && block.content && block.content.trim().startsWith('<svg')) {
        svgCount++;
        const svgFilename = `Diagram_${svgCount}_${(block.title || block.description || 'schematic').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.svg`;
        zip.file(svgFilename, block.content);
      }
    });
    if (svgCount > 0) console.log(`Mi Exporter: added ${svgCount} SVG diagram(s) to ZIP`);
  }

  // raw_data.json excluded from student package (internal Mi data)
    //zip.file('raw_data.json', JSON.stringify(data, null, 2));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  saveAs(blob, `${safeName}_MI_Package.zip`);
}
