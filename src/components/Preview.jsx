import { generateColor, getContrastColor } from '../utils/csvHelpers';

export default function Preview({ maskStats }) {
  const masks = Object.entries(maskStats).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="preview-pane">
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        Mapped Values
      </h3>
      {masks.length === 0 && (
        <div style={{ color: '#666', fontStyle: 'italic' }}>
          No masks created yet. Start typing in the prompter!
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {masks.map(([maskVal, data]) => {
           const bgColor = generateColor(maskVal);
           const textColor = getContrastColor(bgColor);
           
           return (
            <div key={maskVal} style={{ fontSize: '0.9em' }}>
                <div style={{ marginBottom: '4px' }}>
                    <span style={{ 
                        fontWeight: 'bold', 
                        backgroundColor: bgColor, 
                        color: textColor,
                        padding: '2px 6px',
                        borderRadius: '4px'
                    }}>
                        {maskVal}
                    </span>
                    <span style={{ marginLeft: '8px', color: '#888' }}>
                        ({data.total})
                    </span>
                </div>
                <div style={{ 
                    marginLeft: '20px', 
                    color: '#aaa', 
                    fontSize: '0.9em',
                    lineHeight: '1.4'
                }}>
                    = {data.sources.map((src, i) => (
                        <span key={i}>
                            {src.original} <span style={{color: '#666'}}>({src.count})</span>
                            {i < data.sources.length - 1 ? ', ' : ''}
                        </span>
                    ))}
                </div>
            </div>
           );
        })}
      </div>
    </div>
  );
}