import { describe, expect, it } from 'vitest';
import { formatDuration } from '../src/logic/duration';

describe('formatDuration', () => {
  it('正确格式化小于 60 秒的时间', () => {
    expect(formatDuration(0)).toBe('0 秒');
    expect(formatDuration(400)).toBe('0 秒');
    expect(formatDuration(800)).toBe('1 秒');
    expect(formatDuration(15000)).toBe('15 秒');
    expect(formatDuration(45200)).toBe('45 秒');
  });

  it('正确格式化整分钟', () => {
    expect(formatDuration(60000)).toBe('1 分钟');
    expect(formatDuration(120000)).toBe('2 分钟');
  });

  it('正确格式化包含分和秒的时间', () => {
    expect(formatDuration(75000)).toBe('1 分 15 秒');
    expect(formatDuration(124000)).toBe('2 分 4 秒');
    expect(formatDuration(204000)).toBe('3 分 24 秒');
  });

  it('负数处理为 0 秒', () => {
    expect(formatDuration(-5000)).toBe('0 秒');
  });
});
