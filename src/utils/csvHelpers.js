export const parseRowIndices = (input) => {
  const indices = new Set();
  if (!input) return indices;
  
  const parts = input.split(',');
  parts.forEach(part => {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1); // 0-based index, assuming user inputs 1-based
        }
      }
    } else {
      const num = Number(trimmed);
      if (!isNaN(num)) {
        indices.add(num - 1);
      }
    }
  });
  return indices;
};

export const parseColumnNames = (input) => {
  const cols = new Set();
  if (!input) return cols;
  
  input.split(',').forEach(c => {
    const trimmed = c.trim();
    if (trimmed) cols.add(trimmed);
  });
  return cols;
};

export const generateColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Helper to get text color based on background
export const getContrastColor = (hexcolor) => {
  // If a leading # is provided, remove it
  if (hexcolor.slice(0, 1) === '#') {
    hexcolor = hexcolor.slice(1);
  }

  // Convert to RGB value
  var r = parseInt(hexcolor.substr(0,2),16);
  var g = parseInt(hexcolor.substr(2,2),16);
  var b = parseInt(hexcolor.substr(4,2),16);

  // Get YIQ ratio
  var yiq = ((r*299)+(g*587)+(b*114))/1000;

  // Check contrast
  return (yiq >= 128) ? 'black' : 'white';
};
