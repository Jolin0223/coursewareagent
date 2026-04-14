import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image,
  Paperclip,
  Link,
  SendHorizontal,
  Square,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isGenerating?: boolean;
  onStop?: () => void;
  centered?: boolean;
  placeholder?: string;
}

const LINE_HEIGHT = 22.5;
const MAX_LINES = 5;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES;

const HOVER_CSS = `
  .ci-icon-btn:hover { color: #22C55E !important; background: #F0FDF4 !important; }
  .ci-popup-item:hover { background: #F0FDF4 !important; }
`;

import toast from '../../utils/toast';

interface AttachedFile {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, isGenerating, onStop, centered, placeholder = '输入修改意见或继续追问' }) => {
  const appMode = useUIStore((s) => s.appMode);
  const linkedCoursewareCount = useUIStore((s) => s.linkedCoursewareCount);
  const setLinkedCoursewareCount = useUIStore((s) => s.setLinkedCoursewareCount);
  const isEmbedded = appMode === 'embedded';
  const [text, setText] = useState('');
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [stopTooltip, setStopTooltip] = useState(false);

  const canSend = text.trim().length > 0 && !disabled;

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [text, resizeTextarea]);

  useEffect(() => {
    if (!attachMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [attachMenuOpen]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithFiles();
    }
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          setAttachedFiles(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            type: 'image',
            name: file.name,
            url,
          }]);
          toast(`图片 "${file.name}" 已添加`);
        }
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        setAttachedFiles(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          type: 'file',
          name: file.name,
        }]);
        toast(`文件 "${file.name}" 已添加`);
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let hasHandled = false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const url = URL.createObjectURL(file);
          setAttachedFiles(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            type: 'image',
            name: `粘贴图片 ${prev.filter(f => f.type === 'image').length + 1}`,
            url,
          }]);
          toast('图片已粘贴添加');
          hasHandled = true;
        }
      }
    }

    // 如果没有处理图片，让默认粘贴行为处理文本
    if (!hasHandled) {
      return;
    }
    e.preventDefault();
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.url) {
        URL.revokeObjectURL(file.url);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSendWithFiles = () => {
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(f => f.name).join(', ');
      toast(`发送消息（包含 ${attachedFiles.length} 个附件：${fileNames}）`);
      // 清理附件
      attachedFiles.forEach(f => {
        if (f.url) URL.revokeObjectURL(f.url);
      });
      setAttachedFiles([]);
    }
    handleSend();
  };

  // Keep references to prevent unused-variable build errors (demo placeholders)
  void handleImageUpload; void handleFileUpload; void handleImageSelect;
  void handleFileSelect; void handlePaste; void removeAttachedFile;

  return (
    <>
      <style>{HOVER_CSS}</style>
      <div style={centered ? styles.wrapperCentered : styles.wrapperBottom}>
        <div
          style={{
            ...styles.container,
            border: isFocused ? '2px solid #00C9A7' : '1px solid #E2E8F0',
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            style={styles.textarea}
          />

          <div style={styles.toolbar}>
            <div style={styles.toolGroup}>
              <button
                className="ci-icon-btn"
                style={styles.iconBtn}
                onClick={() => toast('图片上传（Demo 模拟）')}
                title="上传图片"
              >
                <Image size={20} />
              </button>

              <div ref={attachRef} style={{ position: 'relative' }}>
                <button
                  className="ci-icon-btn"
                  style={styles.iconBtn}
                  onClick={() => setAttachMenuOpen((v) => !v)}
                  title="上传附件"
                >
                  <Paperclip size={20} />
                </button>
                {attachMenuOpen && (
                  <div style={styles.popup}>
                    <div
                      className="ci-popup-item"
                      style={styles.popupItem}
                      onClick={() => {
                        toast('本地上传（Demo 模拟）');
                        setAttachMenuOpen(false);
                      }}
                    >
                      本地上传
                    </div>
                    {isEmbedded && (
                      <div
                        className="ci-popup-item"
                        style={styles.popupItem}
                        onClick={() => {
                          toast('云盘上传（Demo 模拟）');
                          setAttachMenuOpen(false);
                        }}
                      >
                        云盘上传
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isEmbedded && (
                <button
                  className="ci-icon-btn"
                  style={styles.iconBtn}
                  onClick={() => setLinkModalOpen(true)}
                  title="关联课件"
                >
                  <Link size={20} />
                </button>
              )}
            </div>

            {isGenerating ? (
              <div style={{ position: 'relative' }}
                onMouseEnter={() => setStopTooltip(true)}
                onMouseLeave={() => setStopTooltip(false)}
              >
                {stopTooltip && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                    padding: '5px 10px',
                    background: 'rgba(0,0,0,0.75)',
                    color: '#fff',
                    fontSize: 12,
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}>停止输出</div>
                )}
                <button
                  style={{
                    ...styles.sendBtn,
                    background: '#00C9A7',
                    cursor: 'pointer',
                  }}
                  onClick={onStop}
                >
                  <Square size={14} color="#FFFFFF" fill="#FFFFFF" />
                </button>
              </div>
            ) : (
              <button
                style={{
                  ...styles.sendBtn,
                  background: canSend ? '#00C9A7' : '#CBD5E1',
                  cursor: canSend ? 'pointer' : 'not-allowed',
                }}
                disabled={!canSend}
                onClick={handleSend}
              >
                <SendHorizontal size={18} color="#FFFFFF" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 关联课件回显 */}
      {isEmbedded && linkedCoursewareCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', marginTop: 6,
          fontSize: 12, color: '#00C9A7', fontWeight: 500,
        }}>
          <Link size={13} />
          已关联 {linkedCoursewareCount} 个课件页面
        </div>
      )}

      {/* 关联课件弹窗 */}
      {linkModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={() => setLinkModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              maxWidth: 960, width: '95%',
              maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, overflow: 'auto' }}>
              <img
                src="/editor-assets/课件关联弹窗.png"
                alt="关联课件"
                style={{ width: '100%', display: 'block' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid #E2E8F0' }}>
              <button
                onClick={() => setLinkModalOpen(false)}
                style={{
                  padding: '7px 20px', borderRadius: 6, border: '1px solid #E2E8F0',
                  background: '#fff', color: '#64748B', fontSize: 13, cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  setLinkedCoursewareCount(3);
                  setLinkModalOpen(false);
                  toast('已关联 3 个课件页面');
                }}
                style={{
                  padding: '7px 20px', borderRadius: 6, border: 'none',
                  background: '#00C9A7', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                确认关联
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapperCentered: {
    width: '100%',
    maxWidth: 720,
    margin: '0 auto',
  },
  wrapperBottom: {
    width: '100%',
  },
  container: {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    padding: '20px 24px',
    minWidth: 320,
  },
  textarea: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 15,
    lineHeight: 1.5,
    resize: 'none' as const,
    background: 'transparent',
    color: '#1E293B',
    overflowY: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    transition: 'color 0.15s, background 0.15s',
  },
  sendBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    transition: 'background 0.15s',
  },
  popup: {
    position: 'absolute' as const,
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    background: '#FFFFFF',
    borderRadius: 10,
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '4px 0',
    zIndex: 10,
    minWidth: 120,
    animation: 'fadeIn 0.15s ease',
  },
  popupItem: {
    padding: '8px 16px',
    fontSize: 14,
    color: '#334155',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
};

export default ChatInput;
