import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BrandMark from './BrandMark';

describe('BrandMark', () => {
  it('renders the C monogram with the shared burgundy badge classes plus the caller size', () => {
    const { container } = render(<BrandMark className="w-9 h-9" />);
    const mark = container.querySelector('span');
    expect(mark).toHaveTextContent('C');
    expect(mark.className).toBe('w-9 h-9 rounded-xl bg-brand-burgundy flex items-center justify-center text-white font-extrabold');
    render(<BrandMark className="w-8 h-8 shrink-0" />);
    expect(screen.getAllByText('C')[1].className).toBe('w-8 h-8 shrink-0 rounded-xl bg-brand-burgundy flex items-center justify-center text-white font-extrabold');
  });
});
