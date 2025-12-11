import { useState, useMemo, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { Upload } from 'lucide-react';
import CsvViewer from './components/CsvViewer';
import Prompter from './components/Prompter';
import Preview from './components/Preview';
import { parseRowIndices, parseColumnNames } from './utils/csvHelpers';
import './App.css';

function App() {
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const [ignoreColsInput, setIgnoreColsInput] = useState("");
  const [ignoreRowsInput, setIgnoreRowsInput] = useState("");
  
  const [maskMap, setMaskMap] = useState({});
  const [history, setHistory] = useState([]); // Undo Stack
  const [future, setFuture] = useState([]);   // Redo Stack
  
  const [activeTab, setActiveTab] = useState('raw');

  // Derived Ignored Sets
  const ignoredColumns = useMemo(() => parseColumnNames(ignoreColsInput), [ignoreColsInput]);
  const ignoredRows = useMemo(() => parseRowIndices(ignoreRowsInput), [ignoreRowsInput]);

  // Helper to load CSV content
  const loadCsv = (content, name) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta && results.meta.fields) {
            setHeaders(results.meta.fields);
            setCsvData(results.data);
            setFileName(name);
            setMaskMap({});
            setHistory([]);
            setFuture([]);
            setIgnoreColsInput("");
            setIgnoreRowsInput("");
        }
      },
      error: (err) => {
          console.error("CSV Parse Error:", err);
          alert("Failed to parse CSV file.");
      }
    });
  };

  // Handle File Open via Dialog
  const handleOpen = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'CSV', extensions: ['csv'] }]
      });
      
      if (selected) {
        const content = await readTextFile(selected);
        loadCsv(content, selected);
      }
    } catch (err) {
      console.error("Error opening file:", err);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type === "text/csv" || file.name.endsWith('.csv')) {
            const text = await file.text();
            loadCsv(text, file.name);
        } else {
            alert("Please drop a CSV file.");
        }
    }
  };

  // Queue Calculation: Unique values not yet masked
  const queue = useMemo(() => {
    if (!csvData.length) return [];
    
    const seenValues = new Set();
    const q = [];

    // Order: Column by Column
    headers.forEach(col => {
      if (ignoredColumns.has(col)) return;

      csvData.forEach((row, rIdx) => {
        if (ignoredRows.has(rIdx)) return;

        const val = row[col];
        // Skip if already masked or seen in this queue generation
        if (Object.prototype.hasOwnProperty.call(maskMap, val) || seenValues.has(val)) return;
        // Skip empty values? usually yes for masking.
        if (val === "" || val === null || val === undefined) return;

        seenValues.add(val);
        q.push({ value: val, column: col }); 
      });
    });
    
    return q;
  }, [csvData, headers, ignoredColumns, ignoredRows, maskMap]);

  // Current Item Enrichment (Count in valid scope)
  const currentItem = useMemo(() => {
    if (queue.length === 0) return null;
    const item = queue[0];
    
    let count = 0;
    csvData.forEach((row, rIdx) => {
        if (ignoredRows.has(rIdx)) return;
        
        headers.forEach(col => {
            if (ignoredColumns.has(col)) return;
            if (row[col] === item.value) count++;
        });
    });
    
    return { ...item, count };
  }, [queue, csvData, headers, ignoredRows, ignoredColumns]);

  // Mask Stats for Preview
  const maskStats = useMemo(() => {
    const stats = {}; 
    // Structure: { [maskValue]: { total: 0, sources: [{ original, count }] } }
    
    // 1. Initialize stats for existing masks
    // We need to count occurrences of Original Values in the dataset
    
    // First, count all occurrences of EVERYTHING in valid scope
    const valueCounts = {};
    csvData.forEach((row, rIdx) => {
        if (ignoredRows.has(rIdx)) return;
        headers.forEach(col => {
            if (ignoredColumns.has(col)) return;
            const val = row[col];
            if (val) {
                valueCounts[val] = (valueCounts[val] || 0) + 1;
            }
        });
    });

    // Now build stats based on maskMap
    Object.entries(maskMap).forEach(([original, mask]) => {
        if (!stats[mask]) {
            stats[mask] = { total: 0, sources: [] };
        }
        
        const count = valueCounts[original] || 0;
        if (count > 0) {
            stats[mask].total += count;
            stats[mask].sources.push({ original, count });
        }
    });

    return stats;
  }, [maskMap, csvData, headers, ignoredRows, ignoredColumns]);

  // Existing Mask Values (Unique)
  const existingMasks = useMemo(() => {
    return Array.from(new Set(Object.values(maskMap))).sort();
  }, [maskMap]);

  const handleSave = async (rowsToSave, headersToSave) => {
    try {
        const csv = Papa.unparse({
            fields: headersToSave,
            data: rowsToSave.map(row => {
                const newRow = {};
                headersToSave.forEach(h => {
                    const val = row[h];
                    newRow[h] = maskMap[val] || val;
                });
                return newRow;
            })
        });
        
        const path = await save({
            filters: [{ name: 'CSV', extensions: ['csv'] }]
        });
        
        if (path) {
            await writeTextFile(path, csv);
            alert("File saved successfully!");
        }
    } catch (err) {
        console.error("Error saving file:", err);
        alert("Failed to save file.");
    }
  };

  const saveHistory = () => {
    setHistory(prev => [...prev, { ...maskMap }]);
    setFuture([]); // Clear redo stack on new action
  };

  const handleMask = (orig, mask) => {
    saveHistory();
    setMaskMap(prev => ({ ...prev, [orig]: mask }));
  };

  const handleRenameMask = (oldMask, newMask) => {
    if (!newMask || newMask === oldMask) return;
    saveHistory();
    setMaskMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
            if (next[key] === oldMask) {
                next[key] = newMask;
            }
        });
        return next;
    });
  };

  const handleUndo = useCallback(() => {
      if (history.length === 0) return;
      const previous = history[history.length - 1];
      
      // Save current to future before undoing
      setFuture(prev => [...prev, { ...maskMap }]);
      
      setHistory(prev => prev.slice(0, -1));
      setMaskMap(previous);
  }, [history, maskMap]);

  const handleRedo = useCallback(() => {
      if (future.length === 0) return;
      const next = future[future.length - 1];
      
      // Save current to history before redoing
      setHistory(prev => [...prev, { ...maskMap }]);
      
      setFuture(prev => prev.slice(0, -1));
      setMaskMap(next);
  }, [future, maskMap]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
        } else {
            e.preventDefault();
            handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="app-container" data-testid="app-container">
      {/* LEFT PANE */}
      <div className="left-pane">
        <Prompter 
            key={currentItem ? currentItem.value : 'empty'}
            current={currentItem} 
            onMask={handleMask}
            onRename={handleRenameMask}
            existingMasks={existingMasks}
            onUndo={handleUndo}
            canUndo={history.length > 0}
        />
        <Preview maskStats={maskStats} />
      </div>

      {/* RIGHT PANE (Drop Zone) */}
      <div 
        className="right-pane" 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
            border: isDragging ? '2px dashed #646cff' : 'none',
            backgroundColor: isDragging ? '#2d2d2d' : '#1e1e1e',
            transition: 'background-color 0.2s, border 0.2s'
        }}
      >
        {/* Ignore Controls */}
        <div className="ignore-controls">
            {!fileName && (
                <button onClick={handleOpen} className="action-btn" style={{ width: '100%' }}>
                    <Upload size={18} style={{ marginRight: 8 }} /> Open CSV
                </button>
            )}
            {fileName && (
                <>
                    <div className="input-group">
                        <label>Ignore Cols:</label>
                        <input 
                            placeholder="col1, col2 (names)" 
                            value={ignoreColsInput}
                            onChange={e => setIgnoreColsInput(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>Ignore Rows:</label>
                        <input 
                            placeholder="1, 2-5 (indices)" 
                            value={ignoreRowsInput}
                            onChange={e => setIgnoreRowsInput(e.target.value)}
                        />
                    </div>
                </>
            )}
        </div>

        {/* Tabs */}
        {fileName && (
            <>
                <div className="tab-header">
                    <button 
                        className={`tab ${activeTab === 'raw' ? 'active' : ''}`}
                        onClick={() => setActiveTab('raw')}
                    >
                        Raw Data
                    </button>
                    <button 
                        className={`tab ${activeTab === 'formatted' ? 'active' : ''}`}
                        onClick={() => setActiveTab('formatted')}
                    >
                        Formatted
                    </button>
                    <button 
                        className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Stats
                    </button>
                </div>

                {/* Viewer */}
                <CsvViewer 
                    headers={headers}
                    rows={csvData}
                    maskMap={maskMap}
                    activeTab={activeTab}
                    ignoredColumns={ignoredColumns}
                    ignoredRows={ignoredRows}
                    onSave={handleSave}
                />
            </>
        )}
        
        {!fileName && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', flexDirection: 'column', gap: 10 }}>
                <div>Please open a CSV file to start.</div>
                <div style={{fontSize: '0.8em', opacity: 0.7}}>Or drag and drop here</div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;
