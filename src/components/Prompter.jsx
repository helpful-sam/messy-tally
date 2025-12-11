import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ArrowRight, Check, Undo2 } from 'lucide-react';

export default function Prompter({ current, onMask, existingMasks, onRename, onUndo, canUndo }) {
  const [maskInput, setMaskInput] = useState("");
  const [renamingTag, setRenamingTag] = useState(null); 
  const [renameValue, setRenameValue] = useState("");
  const [inputWidth, setInputWidth] = useState('auto');
  
  const renameInputRef = useRef(null);
  const measureSpanRef = useRef(null);

  useEffect(() => {
      if (renamingTag && renameInputRef.current) {
          renameInputRef.current.focus();
      }
  }, [renamingTag]);

  // Dynamic width adjustment
  useLayoutEffect(() => {
      if (renamingTag && measureSpanRef.current) {
          setInputWidth(measureSpanRef.current.offsetWidth + 20); // +20 for padding/border
      }
  }, [renameValue, renamingTag]);

  if (!current) {
    return (
      <div className="prompter-pane empty" data-testid="prompter-pane">
        <div style={{ textAlign: 'center', color: '#888' }}>
          <Check size={48} style={{ marginBottom: 10 }} />
          <h3>All caught up!</h3>
          <p>No more values to mask.</p>
          {canUndo && (
              <button onClick={onUndo} className="secondary-btn" style={{marginTop: 20}}>
                  <Undo2 size={16} style={{marginRight: 6}}/> Undo Last
              </button>
          )}
        </div>
      </div>
    );
  }

  const { value, count, column } = current;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (maskInput.trim()) {
      onMask(value, maskInput.trim());
    } else {
        onMask(value, value);
    }
  };

  const handleSelect = (mask) => {
    onMask(value, mask);
  };

  const handleRightClick = (e, mask) => {
      e.preventDefault();
      setRenamingTag(mask);
      setRenameValue(mask);
  };

  const submitRename = () => {
      if (renamingTag && renameValue.trim() && renameValue !== renamingTag) {
          onRename(renamingTag, renameValue.trim());
      }
      setRenamingTag(null);
      setRenameValue("");
  };

  const handleRenameKeyDown = (e) => {
      if (e.key === 'Enter') {
          submitRename();
      } else if (e.key === 'Escape') {
          setRenamingTag(null);
      }
  };

  return (
    <div className="prompter-pane" data-testid="prompter-pane">
      <div className="prompter-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, color: '#888', fontSize: '0.9em' }}>
                Column: <span style={{ color: '#fff' }}>{column}</span>
            </h4>
        </div>
        
        <div className="current-value" data-testid="current-value" style={{ 
            fontSize: '2em', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            wordBreak: 'break-word'
        }}>
          {value}
        </div>
        <div className="stats-badge" style={{ 
            display: 'inline-block', 
            padding: '4px 8px', 
            borderRadius: '12px', 
            backgroundColor: '#333', 
            fontSize: '0.8em',
            marginBottom: '20px'
        }}>
          Found {count} times
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ textAlign: 'left', fontSize: '0.8em', color: '#aaa' }}>Assign Mask Value:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                    type="text" 
                    value={maskInput}
                    onChange={(e) => setMaskInput(e.target.value)}
                    placeholder="Type new value..."
                    style={{ 
                        flex: 1, 
                        padding: '10px', 
                        borderRadius: '6px', 
                        border: '1px solid #444', 
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        fontSize: '1em'
                    }}
                    autoFocus
                />
                
                <button 
                    type="button" 
                    onClick={onUndo} 
                    disabled={!canUndo}
                    className="secondary-btn"
                    title="Undo (Cmd+Z)"
                    style={{ padding: '0 12px', opacity: canUndo ? 1 : 0.5 }}
                >
                    <Undo2 size={20} />
                </button>

                <button type="submit" className="action-btn">
                    <ArrowRight size={20} />
                </button>
            </div>
          </div>
        </form>
        
        {existingMasks.length > 0 && (
            <div style={{ marginTop: '20px', width: '100%', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8em', color: '#aaa' }}>Or choose existing (Right-click to rename):</label>
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px', 
                    marginTop: '8px',
                    maxHeight: '150px',
                    overflowY: 'auto'
                }}>
                    {/* Hidden span for measuring text width */}
                    <span 
                        ref={measureSpanRef}
                        style={{
                            position: 'absolute',
                            visibility: 'hidden',
                            fontSize: '0.85em', 
                            padding: '6px 12px',
                            whiteSpace: 'pre',
                            fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif' // Match button font
                        }}
                    >
                        {renameValue || ' '}
                    </span>

                    {existingMasks.map((mask, idx) => {
                        if (renamingTag === mask) {
                            return (
                                <input
                                    key={idx}
                                    ref={renameInputRef}
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={submitRename}
                                    onKeyDown={handleRenameKeyDown}
                                    style={{
                                        fontSize: '0.85em', 
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #646cff',
                                        backgroundColor: '#333',
                                        color: 'white',
                                        width: inputWidth,
                                        minWidth: '50px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            );
                        }
                        return (
                            <button 
                                key={idx} 
                                onClick={() => handleSelect(mask)}
                                onContextMenu={(e) => handleRightClick(e, mask)}
                                className="secondary-btn"
                                style={{ fontSize: '0.85em', padding: '6px 12px' }}
                            >
                                {mask}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}