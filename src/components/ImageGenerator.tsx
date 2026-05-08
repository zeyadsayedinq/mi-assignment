import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, RefreshCw, X, Copy, Check, Wand2, Image } from 'lucide-react';
import { generateCustomImage } from '../lib/mi';
import { cn } from '../lib/utils';

const STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', emoji: '📷' },
  { id: 'illustration', label: 'Illustration', emoji: '🎨' },
  { id: 'infographic', label: 'Infographic', emoji: '📊' },
  { id: 'technical', label: 'Technical', emoji: '⚙️' },
  { id: '3d', label: '3D Render', emoji: '🧊' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { id: 'watercolor', label: 'Watercolor', emoji: '🖌️' },
  { id: 'abstract', label: 'Abstract', emoji: '🌀' },
];

const ASPECT_RATIOS = [
  { id: 'landscape', label: '16:9', w: 1280, h: 720 },
  { id: 'portrait', label: '9:16', w: 720, h: 1280 },
  { id: 'square', label: '1:1', w: 1024, h: 1024 },
  { id: 'wide', label: '21:9', w: 1920, h: 820 },
];

const QUICK_PROMPTS = [
  "A futuristic city at night with neon lights reflecting on wet streets",
  "Professional business meeting in a modern glass office with city view",
  "Abstract data visualization with flowing lines and particles",
  "Nature landscape with dramatic mountain peaks at golden hour",
  "Clean flat design infographic with charts and data elements",
  "Cyberpunk classroom of the future with holographic displays",
];

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  id: number;
}

interface ImageGeneratorProps {
  onClose?: () => void;
  initialPrompt?: string;
  embedded?: boolean;
}

export function ImageGenerator({ onClose, initialPrompt = '', embedded = false }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [style, setStyle] = useState('photorealistic');
  const [ratio, setRatio] = useState(ASPECT_RATIOS[0]);
  const [count, setCount] = useState(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const generate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const newImages: GeneratedImage[] = [];
      for (let i = 0; i < count; i++) {
        const url = await generateCustomImage(prompt, style, ratio.w, ratio.h);
        newImages.push({ url, prompt, style, id: Date.now() + i });
        // Small delay between generations for different seeds
        await new Promise(r => setTimeout(r, 200));
      }
      setImages(prev => [...newImages, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `mi_image_${img.id}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const handleCopyPrompt = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const Wrapper = embedded ? 'div' : motion.div;

  return (
    <Wrapper
      {...(!embedded ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 z-[200] bg-[#020617]/95 backdrop-blur-sm overflow-y-auto"
      } : {
        className: "w-full"
      })}
    >
      <div className={cn("max-w-5xl mx-auto p-6", !embedded && "min-h-screen flex flex-col")}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A855F7]/20 border border-[#A855F7]/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#A855F7]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Image Lab</h2>
              <p className="text-xs text-gray-500 font-mono">Powered by Pollinations Mi — Free, No Key Required</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Prompt */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Image Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={4}
                className="w-full bg-[#0A0B0E] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#A855F7] transition-all resize-none placeholder:text-gray-600"
              />
              <p className="text-right text-xs text-gray-600 mt-1">{prompt.length} chars</p>
            </div>

            {/* Quick prompts */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Quick Ideas</label>
              <div className="flex flex-col gap-1.5">
                {QUICK_PROMPTS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(q)}
                    className="text-left text-xs text-gray-500 hover:text-[#A855F7] transition-colors py-1 border-b border-gray-900 hover:border-[#A855F7]/20 truncate"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all",
                      style === s.id
                        ? "border-[#A855F7] bg-[#A855F7]/10 text-[#A855F7]"
                        : "border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"
                    )}
                  >
                    <span>{s.emoji}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r)}
                    className={cn(
                      "px-2 py-2 rounded-lg border text-xs font-mono transition-all",
                      ratio.id === r.id
                        ? "border-[#22D3EE] bg-[#22D3EE]/10 text-[#22D3EE]"
                        : "border-gray-800 text-gray-500 hover:border-gray-600"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Number of Images: {count}</label>
              <input type="range" min={1} max={4} value={count} onChange={e => setCount(Number(e.target.value))}
                className="w-full accent-[#A855F7]" />
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full py-4 bg-gradient-to-r from-[#A855F7] to-[#22D3EE] text-black font-black rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
            >
              {isGenerating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Generate Images</>
              )}
            </button>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {images.length === 0 && !isGenerating ? (
              <div className="border border-dashed border-gray-800 rounded-2xl p-20 flex flex-col items-center justify-center text-center h-full min-h-64">
                <Image className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-600 text-sm">Your generated images will appear here</p>
                <p className="text-gray-700 text-xs mt-1">Enter a prompt and click Generate</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isGenerating && Array.from({ length: count }).map((_, i) => (
                  <div key={i} className="aspect-video bg-[#0A0B0E] border border-gray-800 rounded-xl overflow-hidden">
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-2 border-[#A855F7]/30 border-t-[#A855F7] rounded-full animate-spin" />
                      <p className="text-xs text-gray-600 font-mono">Generating...</p>
                    </div>
                  </div>
                ))}
                <AnimatePresence>
                  {images.map((img) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative rounded-xl overflow-hidden border border-gray-800 hover:border-[#A855F7]/40 transition-all bg-[#0A0B0E]"
                    >
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="w-full aspect-video object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1280x720/0A0B0E/22D3EE?text=Image+Loading...'; }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                        <p className="text-white text-xs line-clamp-2">{img.prompt}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(img)}
                            className="flex-1 py-1.5 bg-[#22D3EE] text-black text-xs font-bold rounded-lg flex items-center justify-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Download
                          </button>
                          <button
                            onClick={() => handleCopyPrompt(img.prompt, img.id)}
                            className="py-1.5 px-3 bg-white/10 text-white text-xs rounded-lg flex items-center gap-1"
                          >
                            {copiedId === img.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur rounded-full text-[9px] font-mono text-gray-400 uppercase">
                        {img.style}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
