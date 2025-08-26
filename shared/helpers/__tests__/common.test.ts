import { describe, it, expect } from 'vitest';
import {
  createErrorObject,
  fillDTO,
  generateRandomValue,
  getErrorMessage,
  getFullServerPath,
  getRandomItem,
  getRandomItems,
  reduceValidationErrors
} from '../common.js';

class SampleDto {
  a!: number;
}

describe('helpers/common', () => {
  it('generateRandomValue returns value within range inclusive of min', () => {
    const value = generateRandomValue(1, 2);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(2);
  });

  it('getRandomItem returns one of items', () => {
    const items = [1, 2, 3];
    const value = getRandomItem(items);
    expect(items).toContain(value);
  });

  it('getRandomItems returns subarray not exceeding limit', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const result = getRandomItems(items, 3);
    expect(result.length).toBeLessThanOrEqual(3);
    for (const v of result) {
      expect(items).toContain(v);
    }
  });

  it('getErrorMessage returns message for Error', () => {
    expect(getErrorMessage(new Error('oops'))).toBe('oops');
  });

  it('getErrorMessage returns empty string for non-Error', () => {
    expect(getErrorMessage('oops')).toBe('');
  });

  it('fillDTO returns instance of given class', () => {
    const dto = fillDTO(SampleDto, { a: 1, b: 2 });
    expect(dto).toBeInstanceOf(SampleDto);
  });

  it('createErrorObject forms shape', () => {
    const obj = createErrorObject('VALIDATION_ERROR' as any, 'bad', []);
    expect(obj).toEqual({
      errorType: 'VALIDATION_ERROR',
      error: 'bad',
      details: []
    });
  });

  it('reduceValidationErrors normalizes messages', () => {
    const input: any = [
      {
        property: 'a',
        value: 1,
        constraints: { min: 'too small', type: 'bad type' }
      },
      { property: 'b', value: 2 }
    ];
    const result = reduceValidationErrors(input);
    expect(result).toEqual([
      { property: 'a', value: 1, messages: ['too small', 'bad type'] },
      { property: 'b', value: 2, messages: [] }
    ]);
  });

  it('getFullServerPath builds http url', () => {
    expect(getFullServerPath('localhost', 3000)).toBe('http://localhost:3000');
  });
});
