import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Preview from './Preview';

describe('Preview', () => {
  const mockStats = {
    'CleanA': {
      total: 10,
      sources: [
        { original: 'MessyA1', count: 6 },
        { original: 'MessyA2', count: 4 }
      ]
    },
    'CleanB': {
      total: 5,
      sources: [
        { original: 'MessyB', count: 5 }
      ]
    }
  };

  it('renders empty state message', () => {
    render(<Preview maskStats={{}} />);
    expect(screen.getByText(/No masks created yet/i)).toBeInTheDocument();
  });

  it('renders masked values and sources', () => {
    render(<Preview maskStats={mockStats} />);
    
    // Use container logic or specific text matching if simple getByText fails due to duplicates.
    // Or just check that the text exists in the document somewhere.
    // The issue before was "Found multiple elements".
    // "CleanB" -> Unique.
    // "(5)" -> Not unique (Header has it, source has it).
    
    // We can check "CleanB" exists.
    expect(screen.getByText('CleanB')).toBeInTheDocument();
    
    // We can check that we have "(5)" at least twice?
    const fives = screen.getAllByText('(5)');
    expect(fives.length).toBeGreaterThanOrEqual(2);
    
    // Check Source names (Unique enough)
    expect(screen.getByText(/MessyA1/)).toBeInTheDocument();
    expect(screen.getByText('(6)')).toBeInTheDocument();
  });
});