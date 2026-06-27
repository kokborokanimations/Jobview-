/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Palette, 
  Heading1, 
  Heading2, 
  Type,
  Link2,
  Trash2,
  Undo
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function WysiwygEditor({ value, onChange, placeholder = 'Write beautiful banner content...' }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColors, setShowColors] = useState(false);

  // Sync editor content with external value changes when not focused to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg: string = '') => {
    document.execCommand(command, false, arg);
    handleInput();
    // Focus back on editor
    editorRef.current?.focus();
  };

  const handleLink = () => {
    const url = prompt('Enter the link URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const colors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Slate', value: '#cbd5e1' },
    { name: 'Teal Light', value: '#2dd4bf' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
  ];

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col font-sans">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100/80 border-b border-slate-200 text-slate-700 select-none">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          title="Bold"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <Bold size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('italic')}
          title="Italic"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <Italic size={15} />
        </button>

        <span className="w-[1px] h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h1>')}
          title="Heading 1"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <Heading1 size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<h2>')}
          title="Heading 2"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <Heading2 size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('formatBlock', '<p>')}
          title="Normal Text"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <Type size={15} />
        </button>

        <span className="w-[1px] h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          title="Align Left"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <AlignLeft size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          title="Align Center"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <AlignCenter size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          title="Align Right"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <AlignRight size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          title="Justify"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <AlignJustify size={15} />
        </button>

        <span className="w-[1px] h-4 bg-slate-200 mx-1" />

        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          title="Bullet List"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <List size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          title="Numbered List"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <ListOrdered size={15} />
        </button>

        <span className="w-[1px] h-4 bg-slate-200 mx-1" />

        {/* Color Palette Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColors(!showColors)}
            title="Text Color"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showColors ? 'bg-white text-teal-600 shadow-sm' : 'hover:bg-white hover:text-teal-600'}`}
          >
            <Palette size={15} />
          </button>
          {showColors && (
            <div className="absolute left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1.5 z-50">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    executeCommand('foreColor', color.value);
                    setShowColors(false);
                  }}
                  title={color.name}
                  style={{ backgroundColor: color.value }}
                  className="w-5 h-5 rounded-full border border-slate-300 focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLink}
          title="Add Link"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <Link2 size={15} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          title="Clear Format"
          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors cursor-pointer ml-auto"
        >
          <Trash2 size={14} />
        </button>

        <button
          type="button"
          onClick={() => executeCommand('undo')}
          title="Undo"
          className="p-1.5 hover:bg-white hover:text-teal-600 rounded-lg transition-colors cursor-pointer"
        >
          <Undo size={14} />
        </button>
      </div>

      {/* Editable Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        placeholder={placeholder}
        className="min-h-[120px] p-4 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500/10 outline-none overflow-y-auto wysiwyg-content"
        style={{ minHeight: '120px' }}
      />
    </div>
  );
}
