import { describe, it, expect } from 'vitest';
import { parseRowIndices, parseColumnNames, generateColor, getContrastColor } from './csvHelpers';

describe('csvHelpers', () => {
  describe('parseRowIndices', () => {
    it('returns empty set for empty input', () => {
      expect(parseRowIndices('')).toEqual(new Set());
      expect(parseRowIndices(null)).toEqual(new Set());
    });

    it('parses single numbers', () => {
      const result = parseRowIndices('1, 3, 5');
      // 1-based input becomes 0-based index
      expect(result.has(0)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(4)).toBe(true);
      expect(result.size).toBe(3);
    });

    it('parses ranges', () => {
      const result = parseRowIndices('1-3');
      expect(result.has(0)).toBe(true);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.size).toBe(3);
    });

    it('parses mixed input', () => {
      const result = parseRowIndices('1, 3-4');
      expect(result.has(0)).toBe(true); // 1
      expect(result.has(2)).toBe(true); // 3
      expect(result.has(3)).toBe(true); // 4
      expect(result.size).toBe(3);
    });

    it('handles invalid inputs gracefully', () => {
      const result = parseRowIndices('abc, 1-b, 5');
      expect(result.has(4)).toBe(true); // 5 -> 4
      expect(result.size).toBe(1);
    });
  });

  describe('parseColumnNames', () => {
    it('splits by comma and trims', () => {
      const result = parseColumnNames(' name ,  age ');
      expect(result.has('name')).toBe(true);
      expect(result.has('age')).toBe(true);
      expect(result.size).toBe(2);
    });
  });

  describe('generateColor', () => {
    it('generates a consistent hex string for a given input', () => {
      const color1 = generateColor('test');
      const color2 = generateColor('test');
      const color3 = generateColor('other');
      
      expect(color1).toMatch(/^#[0-9A-F]{6}$/);
      expect(color1).toBe(color2);
      expect(color1).not.toBe(color3);
    });
  });

  describe('getContrastColor', () => {
      it('returns black for light colors', () => {
          expect(getContrastColor('#FFFFFF')).toBe('black');
      });
      it('returns white for dark colors', () => {
          expect(getContrastColor('#000000')).toBe('white');
      });
  });
});
