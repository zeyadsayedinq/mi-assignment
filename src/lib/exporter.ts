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
  
  // Title
  children.push(new Paragraph({
    text: cleanLaTeX(payloadName) || (clean ? "Solved Assignment" : "Mi-Assignment Report"),
    heading: HeadingLevel.TITLE,
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
          text: cleanLaTeX(block.content),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 }
        }));
      } else if (block.type === 'paragraph') {
        children.push(new Paragraph({
          text: cleanLaTeX(block.content),
          spacing: { after: 200 }
        }));
      } else if (block.type === 'list') {
        const items = Array.isArray(block.content) ? block.content : String(block.content).split('\n').filter(Boolean);
        items.forEach((item: string) => {
          children.push(new Paragraph({
            text: cleanLaTeX(item.replace(/^[-•]\s*/, '')),
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
        const rows = String(block.content).split('\n').filter(Boolean);
        if (rows.length > 0) {
          const tableRows = rows.map((row: string, i: number) => {
            return new TableRow({
              children: row.split('|').filter(Boolean).map(cell => new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: cleanLaTeX(cell.trim()), bold: i === 0 })] })],
              }))
            });
          });
          children.push(new Table({
            rows: tableRows,
            margins: { top: 100, bottom: 100, left: 100, right: 100 }
          }));
          children.push(new Paragraph({ text: "", spacing: { after: 200 } })); // spacer
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

  const writeLine = (text: string, size = 11, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    const rawText = cleanLaTeX(text);
    pdf.setFontSize(size);
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(rawText, W - MARGIN * 2);
    lines.forEach((line: string) => { checkPage(); pdf.text(line, MARGIN, y); y += LINE_H; });
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
      } else {
        writeLine(block.content || '', 10, false, [51, 65, 85]);
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
    data.data_sheet?.rows?.length ? `- \`Database_Import.sql\` — SQL CREATE + INSERT statements` : '',
    data.code_snippets?.length ? `- \`Source_Code/\` — ${data.code_snippets.length} code file(s)` : '',
    `- \`raw_data.json\` — Complete Mi response data`,
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

      slides.forEach((sd: any, idx: number) => {
        const isTitleSlide = idx === 0;
        const slide = pres.addSlide({ masterName: isTitleSlide ? 'DARK' : 'LIGHT' });
        const layout = sd.image_layout || 'right';
        const imgUrl = sd.image_url?.startsWith('http') ? sd.image_url : null;

        if (isTitleSlide) {
          if (imgUrl) slide.addImage({ path: imgUrl, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover', w: '100%', h: '100%' } });
          slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '0F172A', transparency: 55 } });
          slide.addText(sd.power_heading || payloadName, { x: '5%', y: '33%', w: '90%', h: 1.5, fontSize: 44, bold: true, color: 'FFFFFF', align: 'center', fontFace: 'Helvetica' });
          if (sd.narrative) slide.addText(sd.narrative, { x: '10%', y: '60%', w: '80%', h: 1, fontSize: 16, color: '94A3B8', align: 'center', fontFace: 'Helvetica' });
        } else {
          // Heading
          const titleColor = '0F172A';
          let textX = 0.4, textW = 9.0, imgX = 0, imgH = 4.6, imgY = 1.3;

          if (imgUrl && layout === 'left') { imgX = 0.4; textX = 4.7; textW = 4.8; }
          else if (imgUrl && layout === 'right') { textX = 0.4; textW = 4.8; imgX = 5.3; }

          slide.addText(sd.power_heading || `Slide ${idx + 1}`, { x: 0.4, y: 0.25, w: '90%', h: 0.75, fontSize: 28, bold: true, color: titleColor, fontFace: 'Helvetica', align: 'left' });
          slide.addShape(pres.ShapeType.rect, { x: 0.4, y: 1.1, w: 0.9, h: 0.04, fill: { color: '22D3EE' } });

          if (imgUrl) {
            if (layout === 'background' || layout === 'full') {
              slide.addImage({ path: imgUrl, x: 0, y: 0, w: '100%', h: '100%', sizing: { type: 'cover', w: '100%', h: '100%' } });
              slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: 'FFFFFF', transparency: 20 } });
            } else {
              slide.addImage({ path: imgUrl, x: imgX, y: imgY, w: 4.4, h: imgH, sizing: { type: 'cover', w: 4.4, h: imgH }, rounding: true });
            }
          }

          let curY = 1.3;
          if (sd.narrative) {
            slide.addText(sd.narrative, { x: textX, y: curY, w: textW, h: 1.2, fontSize: 13, color: '475569', fontFace: 'Helvetica', lineSpacing: 20, valign: 'top' });
            curY += 1.3;
          }
          if (sd.content_bullets?.length) {
            slide.addText(sd.content_bullets.map((b: string) => ({ text: b, options: { bullet: true, fontSize: 15, color: '1E293B', fontFace: 'Helvetica', breakLine: true } })) as any, { x: textX, y: curY, w: textW, h: 3.2, valign: 'top', lineSpacing: 26 });
          }
          slide.addText(String(idx + 1), { x: '93%', y: '96%', w: '6%', h: '3%', fontSize: 9, color: '94A3B8', align: 'right' });
        }

        if (sd.speaker_notes) slide.addNotes(sd.speaker_notes);
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

    // 5. SQL
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
  zip.file('raw_data.json', JSON.stringify(data, null, 2));

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  saveAs(blob, `${safeName}_MI_Package.zip`);
}
