import { useState, useMemo } from 'react';
import { generateColor, getContrastColor } from '../utils/csvHelpers';
import { Download, Eye, EyeOff } from 'lucide-react';

export default function CsvViewer({ 
    headers, 
    rows, 
    maskMap, 
    activeTab, 
    ignoredColumns, 
    ignoredRows,
    onSave
}) {
    const [hideIgnored, setHideIgnored] = useState(true);

    // Derived: Formatted Rows
    const formattedData = useMemo(() => {
        if (activeTab !== 'formatted') return null;
        
        let displayHeaders = headers;
        let displayRows = rows;

        if (hideIgnored) {
            displayHeaders = headers.filter(h => !ignoredColumns.has(h));
            displayRows = rows.filter((_, idx) => !ignoredRows.has(idx));
        }

        return { displayHeaders, displayRows };

    }, [headers, rows, ignoredColumns, ignoredRows, hideIgnored, activeTab]);

    // Derived: Stats
    const statsData = useMemo(() => {
        if (activeTab !== 'stats') return null;

        const stats = {}; // { colName: { val: count } }
        
        headers.forEach(h => {
            // Include all columns in stats? Or only non-ignored?
            // "Column 1: ..."
            // Usually stats on the dataset. Let's include all for now.
            // Or maybe filter if ignored? Let's check user intent. 
            // "total numbers of values by column"
            // Let's exclude ignored rows though?
            // Let's use ALL rows and columns for Stats to be comprehensive, 
            // unless we want "Formatted Stats".
            // Let's stick to "Raw Data Stats" but with Masked values applied?
            // "Sam 13, Daniel 3" implies masked values.
            
            stats[h] = {};
        });

        rows.forEach((row, rIdx) => {
            // Should we ignore ignored rows in stats? 
            // "discounted or added to the queue... ignored rows... discounted"
            // So stats should probably reflect the "Active" dataset.
            if (ignoredRows.has(rIdx)) return;

            headers.forEach(col => {
                if (ignoredColumns.has(col)) return;

                const val = row[col];
                const finalVal = maskMap[val] || val; // Use mask if exists
                
                stats[col][finalVal] = (stats[col][finalVal] || 0) + 1;
            });
        });

        return stats;
    }, [headers, rows, ignoredRows, ignoredColumns, maskMap, activeTab]);

    if (!headers.length) {
        return <div className="tab-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            No CSV loaded.
        </div>;
    }

    const renderRaw = () => (
        <table className="csv-table" data-testid="csv-table-raw">
            <thead>
                <tr>
                    <th style={{width: '50px'}}>#</th>
                    {headers.map(h => (
                        <th key={h} style={{ opacity: ignoredColumns.has(h) ? 0.4 : 1 }}>
                            {h} {ignoredColumns.has(h) && '(Ignored)'}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rIdx) => {
                    const isRowIgnored = ignoredRows.has(rIdx);
                    return (
                        <tr key={rIdx} style={{ opacity: isRowIgnored ? 0.4 : 1 }}>
                            <td style={{ color: '#666' }}>{rIdx + 1}</td>
                            {headers.map((col, cIdx) => {
                                const val = row[col];
                                const mask = maskMap[val];
                                const isIgnored = ignoredColumns.has(col);
                                
                                let cellStyle = {};
                                if (mask && !isIgnored && !isRowIgnored) {
                                    const bg = generateColor(mask);
                                    cellStyle = {
                                        backgroundColor: bg,
                                        color: getContrastColor(bg)
                                    };
                                }

                                return (
                                    <td key={cIdx} style={cellStyle}>
                                        {val}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );

    const renderFormatted = () => {
        const { displayHeaders, displayRows } = formattedData;
        
        return (
            <>
                <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                    <button 
                        className="secondary-btn" 
                        onClick={() => setHideIgnored(!hideIgnored)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {hideIgnored ? <Eye size={16}/> : <EyeOff size={16}/>}
                        {hideIgnored ? 'Show Ignored' : 'Hide Ignored'}
                    </button>
                    
                    <button 
                        className="action-btn"
                        onClick={() => onSave(displayRows, displayHeaders)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Download size={16}/>
                        Save as CSV
                    </button>
                </div>
                <table className="csv-table">
                    <thead>
                        <tr>
                            {displayHeaders.map(h => <th key={h}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {displayRows.map((row, rIdx) => (
                            <tr key={rIdx}>
                                {displayHeaders.map((col, cIdx) => {
                                    const val = row[col]; // This is original value from row object
                                    // But we need the Masked value here!
                                    // Wait, formattedData.displayRows is just filtered 'rows'.
                                    // I need to Apply the mask.
                                    
                                    // Access original value via the original column name?
                                    // Wait, if I filtered headers, 'col' is the correct key.
                                    // But 'row' is the original row object.
                                    const originalVal = val; 
                                    const finalVal = maskMap[originalVal] || originalVal;
                                    
                                    return <td key={cIdx}>{finalVal}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        );
    };

    const renderStats = () => {
        return (
            <div className="stats-container">
                {Object.entries(statsData).map(([col, counts]) => {
                    const sortedEntries = Object.entries(counts).sort((a, b) => {
                        // If one is empty/null, move it to end
                        const aEmpty = !a[0];
                        const bEmpty = !b[0];
                        if (aEmpty && !bEmpty) return 1;
                        if (!aEmpty && bEmpty) return -1;
                        // Otherwise sort by count desc
                        return b[1] - a[1];
                    });

                    return (
                        <div key={col} style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #444', paddingBottom: '4px' }}>
                                {col}
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {sortedEntries.map(([val, count]) => (
                                    <div key={val} style={{ 
                                        backgroundColor: '#333', 
                                        padding: '4px 8px', 
                                        borderRadius: '4px',
                                        fontSize: '0.9em'
                                    }}>
                                        <span style={{ fontWeight: 'bold' }}>{val || "--"}</span>
                                        <span style={{ marginLeft: '6px', color: '#aaa' }}>{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="tab-content">
            {activeTab === 'raw' && renderRaw()}
            {activeTab === 'formatted' && renderFormatted()}
            {activeTab === 'stats' && renderStats()}
        </div>
    );
}