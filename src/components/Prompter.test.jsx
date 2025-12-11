import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Prompter from './Prompter';
import userEvent from '@testing-library/user-event';

describe('Prompter', () => {
  const mockCurrent = {
    value: 'MessyValue',
    count: 5,
    column: 'ColumnA'
  };

  it('renders "All caught up" when no current item', () => {
    render(<Prompter current={null} onMask={vi.fn()} existingMasks={[]} />);
    expect(screen.getByText(/All caught up!/i)).toBeInTheDocument();
  });

  it('renders current value and stats', () => {
    render(<Prompter current={mockCurrent} onMask={vi.fn()} existingMasks={[]} />);
    expect(screen.getByText('MessyValue')).toBeInTheDocument();
    expect(screen.getByText('ColumnA')).toBeInTheDocument();
    expect(screen.getByText('Found 5 times')).toBeInTheDocument();
  });

  it('submits typed value on form submit', async () => {
    const onMask = vi.fn();
    const user = userEvent.setup();
    render(<Prompter current={mockCurrent} onMask={onMask} existingMasks={[]} />);

    const input = screen.getByPlaceholderText('Type new value...');
    await user.type(input, 'CleanValue');
    // Submit button is the one with type="submit"
    // We can also just hit Enter
    await user.keyboard('{Enter}');

    expect(onMask).toHaveBeenCalledWith('MessyValue', 'CleanValue');
  });

  it('submits original value if input is empty', async () => {
    const onMask = vi.fn();
    const user = userEvent.setup();
    render(<Prompter current={mockCurrent} onMask={onMask} existingMasks={[]} />);

    const submitBtn = screen.getAllByRole('button').find(b => b.type === 'submit'); 
    await user.click(submitBtn);

    expect(onMask).toHaveBeenCalledWith('MessyValue', 'MessyValue');
  });

  it('allows selecting an existing mask', async () => {
    const onMask = vi.fn();
    const user = userEvent.setup();
    const existing = ['Option1', 'Option2'];
    render(<Prompter current={mockCurrent} onMask={onMask} existingMasks={existing} />);

    const optionBtn = screen.getByText('Option1');
    await user.click(optionBtn);

    expect(onMask).toHaveBeenCalledWith('MessyValue', 'Option1');
  });

  it('allows renaming existing mask via right-click (inline)', async () => {
    const onRename = vi.fn();
    const existing = ['Option1'];
    const user = userEvent.setup();
    render(<Prompter current={mockCurrent} onMask={vi.fn()} existingMasks={existing} onRename={onRename} />);

    // Right Click to Trigger Edit Mode
    const optionBtn = screen.getByText('Option1');
    await user.pointer({ keys: '[MouseRight]', target: optionBtn });

    // Should now be an input with value 'Option1'
    const input = screen.getByDisplayValue('Option1');
    expect(input.tagName).toBe('INPUT');

    // Type new name
    await user.clear(input);
    await user.type(input, 'RenamedOption{Enter}');

    expect(onRename).toHaveBeenCalledWith('Option1', 'RenamedOption');
  });

  it('triggers undo when undo button clicked', async () => {
    const onUndo = vi.fn();
    const user = userEvent.setup();
    render(<Prompter current={mockCurrent} onMask={vi.fn()} existingMasks={[]} onUndo={onUndo} canUndo={true} />);

    // The undo button has title "Undo (Cmd+Z)"
    const undoBtn = screen.getByTitle('Undo (Cmd+Z)');
    await user.click(undoBtn);

    expect(onUndo).toHaveBeenCalled();
  });
});