"use client";

import { useEffect, useRef, useState } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CodeEditor({ value, onChange, placeholder = 'Paste code or upload a file for review...', className = '' }: CodeEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused && ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value || '';
    }
  }, [value, focused]);

  const handleInput = () => {
    if (!ref.current) return;
    onChange(ref.current.textContent || '');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const tabNode = document.createTextNode('  ');
      range.deleteContents();
      range.insertNode(tabNode);
      range.setStartAfter(tabNode);
      range.setEndAfter(tabNode);
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {!focused && !value ? (
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-transparent bg-transparent p-4 text-sm text-slate-500">
          {placeholder}
        </div>
      ) : null}
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        contentEditable
        spellCheck={false}
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          handleInput();
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[300px] w-full overflow-auto rounded-3xl border border-white/10 bg-slate-950/80 p-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400/30"
      />
    </div>
  );
}
