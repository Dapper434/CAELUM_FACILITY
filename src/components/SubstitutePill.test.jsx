import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SubstitutePill from './SubstitutePill';

describe('SubstitutePill', () => {
  it('labels the donor type and the requested type', () => {
    render(<SubstitutePill donorType="O-" requestedType="A+" />);
    expect(screen.getByText('Substitute: O- for A+')).toBeInTheDocument();
  });

  it('renders nothing when a type is missing', () => {
    const { container } = render(<SubstitutePill donorType="O-" requestedType="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
