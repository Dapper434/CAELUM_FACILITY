import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LandingPage, { HEADLINE } from './LandingPage';
import FacilityBadge, { facilityInitials } from '../components/FacilityBadge';
import { NETWORK_HOSPITALS } from '../components/landing/networkHospitals';

const renderPage = () => render(<MemoryRouter><LandingPage /></MemoryRouter>);

describe('LandingPage', () => {
  it('leads with the two-line headline and sends every Sign in to /login', () => {
    renderPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(HEADLINE[0]);
    expect(h1).toHaveTextContent(HEADLINE[1]);
    const signIns = screen.getAllByRole('link', { name: /^sign in/i });
    expect(signIns.length).toBeGreaterThanOrEqual(3);
    signIns.forEach((a) => expect(a).toHaveAttribute('href', '/login'));
    expect(screen.queryByText(/sign up/i)).toBeNull();
  });

  it('only links to sections that exist on the page', () => {
    const { container } = renderPage();
    const hashes = [...container.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href'));
    expect(hashes).toEqual(expect.arrayContaining(['#how-it-works', '#network', '#about', '#roles']));
    hashes.forEach((h) => expect(container.querySelector(h), h).not.toBeNull());
  });

  it('lists all 16 hospitals once for assistive tech: 8 official logos and 8 initials badges, no county emblems', () => {
    renderPage();
    const band = screen.getByRole('region', { name: 'Hospitals on the CAELUM network' });
    const visible = within(band).getAllByRole('list').filter((ul) => ul.getAttribute('aria-hidden') !== 'true');
    expect(visible).toHaveLength(1);
    expect(within(visible[0]).getAllByRole('listitem')).toHaveLength(16);
    expect(NETWORK_HOSPITALS.filter((h) => h.logo)).toHaveLength(8);
    expect(NETWORK_HOSPITALS.filter((h) => !h.logo && h.code)).toHaveLength(8);
    const emblemOnly = /kiambu|thika|nakuru|naivasha|machakos|narok|kapsabet|port-reitz/;
    band.querySelectorAll('img').forEach((img) => expect(img.getAttribute('src')).not.toMatch(emblemOnly));
    expect(new Set(NETWORK_HOSPITALS.filter((h) => h.code).map((h) => h.code)).size).toBe(8);
  });

  it('lets the marquee be paused from the keyboard', () => {
    renderPage();
    const toggle = screen.getByRole('button', { name: /pause hospital list animation/i });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /play hospital list animation/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('loads the hero eagerly and every image below it lazily', () => {
    const { container } = renderPage();
    const imgs = [...container.querySelectorAll('img')];
    const hero = container.querySelector('picture img');
    expect(hero).not.toHaveAttribute('loading', 'lazy');
    imgs.filter((img) => img !== hero).forEach((img) => expect(img).toHaveAttribute('loading', 'lazy'));
  });
});

describe('FacilityBadge', () => {
  it('derives short initials', () => {
    expect(facilityInitials('Thika Level 5 Hospital')).toBe('TL5');
    expect(facilityInitials('Mama Lucy Kibaki Hospital')).toBe('MLK');
    expect(facilityInitials('Moi Teaching and Referral Hospital')).toBe('MTR');
    expect(facilityInitials('')).toBe('C');
  });

  it('shows initials with the full name beside them when there is no logo', () => {
    render(<FacilityBadge name="Kiambu Level 5 Hospital" />);
    expect(screen.getByText('KL5')).toBeInTheDocument();
    expect(screen.getByText('Kiambu Level 5 Hospital')).toBeInTheDocument();
  });

  it('names the mark itself when the visible name is hidden', () => {
    render(<FacilityBadge name="Mbagathi County Hospital" logo="/x.webp" showName={false} />);
    expect(screen.getByRole('img', { name: 'Mbagathi County Hospital' })).toBeInTheDocument();
  });
});
