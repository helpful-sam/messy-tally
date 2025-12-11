import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

// Mock Tauri APIs
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn()
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn()
}));

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

  it('renders initial empty state', () => {
    render(<App />);
    expect(screen.getByText(/Please open a CSV file to start/i)).toBeInTheDocument();
    expect(screen.getByText(/Open CSV/i)).toBeInTheDocument();
  });

  it('opens a CSV and populates data', async () => {
    const user = userEvent.setup();
    
    open.mockResolvedValue('/path/to/test.csv');
    readTextFile.mockResolvedValue('Name,Role\nSam,Dev\nDaniel,Manager\nSam,Dev');

    render(<App />);

    const openBtn = screen.getByText('Open CSV');
    await user.click(openBtn);

    await waitFor(() => {
        expect(screen.getByText('Raw Data')).toBeInTheDocument();
    });

    // Check Prompter (should have first unique item)
    // Order of iteration: Column Name -> Sam, Daniel. 
    // "Sam" appears in prompter.
    const prompter = screen.getByTestId('prompter-pane');
    expect(within(prompter).getByTestId('current-value')).toHaveTextContent('Sam');
    expect(within(prompter).getByText('Name')).toBeInTheDocument();
    expect(within(prompter).getByText('Found 2 times')).toBeInTheDocument();
    
    // Check Table
    const table = screen.getByTestId('csv-table-raw');
    expect(within(table).getAllByText('Sam')).toHaveLength(2);
    expect(within(table).getByText('Daniel')).toBeInTheDocument();
  });

  it('allows ignoring columns', async () => {
     open.mockResolvedValue('/path/to.csv');
     readTextFile.mockResolvedValue('Col1,Col2\nA,B');
     const user = userEvent.setup();

     render(<App />);
     await user.click(screen.getByText('Open CSV'));
     await waitFor(() => screen.getByText('Raw Data'));

     // Initially, Prompter should show "A" (from Col1)
     const prompter = screen.getByTestId('prompter-pane');
     expect(within(prompter).getByTestId('current-value')).toHaveTextContent('A');

     // Type in Ignore Cols
     const ignoreInput = screen.getByPlaceholderText('col1, col2 (names)');
     await user.type(ignoreInput, 'Col1');

     // Now Col1 is ignored. Prompter should skip "A" and move to "B" (from Col2)
     await waitFor(() => {
         const currentPrompter = screen.getByTestId('prompter-pane');
         expect(within(currentPrompter).getByTestId('current-value')).toHaveTextContent('B');
     });
     
     // Ensure "A" is not in prompter
     const finalPrompter = screen.getByTestId('prompter-pane');
     expect(within(finalPrompter).queryByText('A')).not.toBeInTheDocument();
  });
});
