import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CsvViewer from './CsvViewer';

describe('CsvViewer', () => {
  const headers = ['Col1', 'Col2'];
  const rows = [
    { 'Col1': 'A', 'Col2': 'B' },
    { 'Col1': 'C', 'Col2': 'D' }
  ];
  const maskMap = { 'A': 'MaskedA' };
  
  const defaultProps = {
    headers,
    rows,
    maskMap,
    activeTab: 'raw',
    ignoredColumns: new Set(),
    ignoredRows: new Set(),
    onSave: vi.fn()
  };

  it('renders "No CSV loaded" if headers empty', () => {
    render(<CsvViewer {...defaultProps} headers={[]} />);
    expect(screen.getByText('No CSV loaded.')).toBeInTheDocument();
  });

  it('renders raw data correctly', () => {
    render(<CsvViewer {...defaultProps} activeTab="raw" />);
    // Headers
    expect(screen.getByText('Col1')).toBeInTheDocument();
    expect(screen.getByText('Col2')).toBeInTheDocument();
    
    // Values
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    
    // Check if mask styling is applied? (Hard to check style directly easily, but we can check existence)
    // 'A' should be styled.
  });

  it('renders formatted data correctly (applying masks)', () => {
    render(<CsvViewer {...defaultProps} activeTab="formatted" />);
    
    // Should see MaskedA instead of A
    expect(screen.getByText('MaskedA')).toBeInTheDocument();
    expect(screen.queryByText('A')).not.toBeInTheDocument(); // A should be replaced
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('hides ignored columns in formatted view', () => {
      const ignoredCols = new Set(['Col2']);
      render(<CsvViewer {...defaultProps} activeTab="formatted" ignoredColumns={ignoredCols} />);
      
      expect(screen.queryByText('Col2')).not.toBeInTheDocument();
      // Should still see Col1
      expect(screen.getByText('MaskedA')).toBeInTheDocument();
  });

  it('renders stats view', () => {
    render(<CsvViewer {...defaultProps} activeTab="stats" />);
    // Should show Col1 and Col2 headers for stats
    expect(screen.getAllByText('Col1')[0]).toBeInTheDocument();
    
    // A was mapped to MaskedA, so stats should show MaskedA: 1
    expect(screen.getByText('MaskedA')).toBeInTheDocument();
  });
});
