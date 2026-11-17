import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Building2, ClipboardCheck, LineChart, Network, Truck, Send } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import HospitalMarquee from '../components/landing/HospitalMarquee';
import hero1280 from '../assets/landing/hero-1280.webp';
import hero900 from '../assets/landing/hero-900.webp';
import coldChain from '../assets/landing/cold-chain-800.webp';
import shotHospital from '../assets/landing/shot-hospital.webp';
import shotAdmin from '../assets/landing/shot-admin.webp';
import shotCourier from '../assets/landing/shot-courier.webp';

// Public landing page (caelum-design/04_LANDING_PAGE.md). One action: Sign in.
// Figures on this page come from API/config.yaml and the workflow code, not from outside statistics.

export const HEADLINE = ['Blood, where it’s needed.', 'On time.'];
// Kevin to supply a public contact. Until then the footer points people to their administrator.
const CONTACT_EMAIL = null;
const MAX = 'max-w-[1120px] mx-auto px-5 sm:px-8';

const NAV = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#network', label: 'Network' },
  { href: '#about', label: 'About' },
];

const STORY = [
  { title: 'The problem', tag: 'Why it matters', href: '#step-forecast',
    text: 'Blood banks need to see shortages early and move units without breaking the cold chain or losing track of who handled them.' },
  { title: 'What CAELUM does', tag: 'Platform', href: '#step-request',
    text: 'Forecasts shortages, finds a nearby donor hospital and tracks every unit from the shelf to the handover.' },
  { title: 'How it works', tag: 'Workflow', href: '#how-it-works',
    text: 'Request, offer, pack, courier, receive. Every step is timed, sealed and written to an audit trail.' },
  { title: 'Who it serves', tag: 'People', href: '#roles',
    text: 'Blood-bank and lab staff, couriers on the road, and the national team that runs the network.' },
];

const STEPS = [
  { id: 'step-forecast', icon: LineChart, title: 'Forecast shortage', fact: 'Alert below 3 days of cover',
    text: 'CAELUM forecasts each hospital’s demand for the next 7 days. When stock drops below 3 days of cover, it raises an alert and drafts a request for staff to confirm.' },
  { id: 'step-request', icon: Send, title: 'Request or offer units', fact: 'Donor answers within 5 min',
    text: 'CAELUM ranks nearby donor hospitals by road time, shelf life and the reserve they must keep. The donor has 5 minutes to accept, hold or decline.' },
  { id: 'step-courier', icon: Truck, title: 'Courier moves them in the cold chain', fact: 'Red cells 2–6 °C · ≤ 4 h by road',
    text: 'The donor packs and seals the units. The courier scans a signed QR code at pickup, and the cooler temperature is watched all the way.' },
  { id: 'step-receive', icon: ClipboardCheck, title: 'Received and recorded', fact: 'One-time code + matching seal',
    text: 'Handover needs a one-time code and the matching seal. The receiving hospital confirms the condition, and every step joins a tamper-evident audit log.' },
];

const ROLES = [
  { title: 'Hospitals', icon: Building2, img: shotHospital, w: 730, h: 578,
    alt: 'CAELUM Facility app: a transfer timeline and its live tracking map.',
    text: 'Check stock and days of cover, confirm suggested requests, answer donor offers, pack and seal units, and track transfers on a live map.' },
  { title: 'National admin', icon: Network, img: shotAdmin, w: 482, h: 362,
    alt: 'CAELUM admin console: network tiles for active transfers, deliveries, temperature excursions, couriers and requests.',
    text: 'See every hospital, alert and transfer across the network, manage facilities, users and couriers, and check the audit chain.' },
  { title: 'Couriers', icon: Truck, img: shotCourier, w: 520, h: 513,
    alt: 'CAELUM Courier app on a phone: a job card for one unit of AB- packed red cells in transit.',
    text: 'Accept jobs on a phone, scan the QR code at pickup, log the cooler temperature and hand over with a one-time code.' },
];

const signInPrimary = 'inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl bg-accent-yellow text-slate-900 text-sm font-bold shadow-sm hover:bg-amber-400 active:translate-y-px transition-colors duration-200';

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark className="w-8 h-8 text-sm" />
      <span className="text-base font-extrabold tracking-tight text-white">CAELUM</span>
    </span>
  );
}

function LandingNav() {
  const scrolled = useScrolled();
  return (
    <header className={`landing-dark landing-nav sticky top-0 z-50 border-b border-white/10 ${scrolled ? 'is-scrolled' : ''}`}>
      <nav aria-label="Main" className={`${MAX} h-16 flex items-center justify-between gap-4`}>
        <a href="#top" className="inline-flex items-center min-h-11 rounded-lg" aria-label="CAELUM, back to top"><Wordmark /></a>
        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="inline-flex items-center min-h-11 px-3 rounded-lg text-sm font-medium text-white/75 hover:text-white transition-colors duration-200">{n.label}</a>
              </li>
            ))}
          </ul>
          <span className="hidden md:block w-px h-5 bg-white/15 mx-2" aria-hidden="true" />
          <Link to="/login" className="group inline-flex items-center min-h-11 rounded-full">
            <span className="inline-flex items-center h-9 px-4 rounded-full bg-white text-brand-navy text-sm font-semibold group-hover:bg-slate-100 transition-colors duration-200">Sign in</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="landing-dark relative bg-brand-navy text-white overflow-hidden">
      {/* Image: a top band on phones, the right ~60% on wider screens. Solid navy shows if it fails to load. */}
      <div className="relative h-64 sm:h-80 md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[62%]" aria-hidden="true">
        <picture>
          <source media="(max-width: 767px)" srcSet={hero900} width="900" height="762" />
          <img src={hero1280} width="1280" height="720" alt="" fetchpriority="high" decoding="async"
            className="w-full h-full object-cover object-[70%_40%] md:object-right" />
        </picture>
        <div className="landing-hero-fade absolute inset-0" />
      </div>
      <div className={`${MAX} relative`}>
        <div className="max-w-[44rem] pt-2 pb-14 md:py-28 lg:py-36">
          <p className="landing-rise text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.18em] text-white/75">Blood &amp; cold-chain logistics for Kenya</p>
          <h1 id="hero-title" className="landing-rise landing-rise-2 mt-4 text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] font-extrabold tracking-tight leading-[1.05]">
            <span className="block lg:whitespace-nowrap">{HEADLINE[0]}</span>
            <span className="block text-white/85">{HEADLINE[1]}</span>
          </h1>
          <p className="landing-rise landing-rise-3 mt-5 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed">
            CAELUM helps Kenyan hospitals find, move and track blood inside a safe cold chain.
          </p>
          <div className="landing-rise landing-rise-4 mt-8 flex flex-wrap gap-3">
            <Link to="/login" className={signInPrimary}>Sign in <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
            <a href="#how-it-works" className="inline-flex items-center justify-center min-h-12 px-6 rounded-xl border border-white/60 text-white text-sm font-semibold hover:bg-white/10 hover:border-white transition-colors duration-200">
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Eyebrow({ children, className = '' }) {
  return <p className={`text-xs font-bold uppercase tracking-[0.18em] text-brand-burgundy ${className}`}>{children}</p>;
}

function Story() {
  return (
    <section id="about" aria-labelledby="about-title" className="bg-bg-canvas py-20 sm:py-28 scroll-mt-16">
      <div className={MAX}>
        <Eyebrow>Our mission</Eyebrow>
        <h2 id="about-title" className="mt-4 max-w-4xl text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight leading-[1.12]">
          <span className="block text-slate-900">Blood belongs where patients need it.</span>
          <span className="block text-slate-500">CAELUM gets it there cold, on time and accounted for.</span>
        </h2>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
          {STORY.map((c, i) => (
            <li key={c.title} className={`landing-stagger-${i} group bg-bg-surface border border-border-warm rounded-2xl p-6 flex flex-col min-h-[15rem] shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition duration-200`}>
              <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.text}</p>
              <div className="mt-auto pt-6 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-brand-burgundy" aria-hidden="true" />{c.tag}
                </span>
                <a href={c.href} aria-label={`More on ${c.title.toLowerCase()}`}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-bg-inset border border-border-warm text-slate-800 hover:bg-white hover:border-slate-300 transition-colors duration-200">
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="bg-bg-surface py-20 sm:py-28 border-y border-border-warm scroll-mt-16">
      <div className={`${MAX} grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16 items-start`}>
        <div>
          <Eyebrow>How it works</Eyebrow>
          <h2 id="how-title" className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">From shortage to safe handover, in four steps.</h2>
          <ol className="mt-10 space-y-8">
            {STEPS.map((s, i) => (
              <li key={s.id} id={s.id} className="relative flex gap-5 scroll-mt-24">
                <div className="flex flex-col items-center">
                  <span className="w-11 h-11 shrink-0 rounded-full bg-brand-cobalt text-white inline-flex items-center justify-center text-sm font-extrabold">{i + 1}</span>
                  {i < STEPS.length - 1 && <span className="w-px flex-1 mt-2 bg-border-warm" aria-hidden="true" />}
                </div>
                <div className="pb-2">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <s.icon className="w-5 h-5 text-brand-cobalt" aria-hidden="true" />{s.title}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl">{s.text}</p>
                  <p className="mt-3 inline-flex rounded-lg bg-bg-inset border border-border-warm px-2.5 py-1 font-mono text-xs font-medium text-slate-700">{s.fact}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <figure className="lg:sticky lg:top-24">
          <img src={coldChain} width="800" height="720" loading="lazy" decoding="async"
            alt="A blood bag packed in an insulated cold-chain carrier with a stethoscope."
            className="w-full h-auto rounded-2xl bg-brand-navy shadow-card" />
          <figcaption className="mt-3 text-xs text-slate-600">Sealed at the donor, scanned at pickup, checked at handover.</figcaption>
        </figure>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" aria-labelledby="roles-title" className="bg-bg-canvas py-20 sm:py-28 scroll-mt-16">
      <div className={MAX}>
        <Eyebrow>Built for each role</Eyebrow>
        <h2 id="roles-title" className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">One network, three views.</h2>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {ROLES.map((r) => (
            <li key={r.title} className="bg-bg-surface border border-border-warm rounded-2xl overflow-hidden shadow-card flex flex-col">
              <div className="aspect-[4/3] overflow-hidden bg-bg-inset border-b border-border-warm">
                <img src={r.img} width={r.w} height={r.h} alt={r.alt} loading="lazy" decoding="async" className="w-full h-full object-cover object-left-top" />
              </div>
              <div className="p-6">
                <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <r.icon className="w-5 h-5 text-brand-cobalt" aria-hidden="true" />{r.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-slate-600">Screens from the live demo apps, 16 Nov 2026.</p>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="landing-dark bg-brand-navy text-white">
      <div className={`${MAX} py-20 sm:py-24 flex flex-col md:flex-row md:items-center md:justify-between gap-8`}>
        <div>
          <h2 id="cta-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready when your blood bank is.</h2>
          <p className="mt-3 text-base text-white/80">Sign in with the account your CAELUM administrator set up for you.</p>
        </div>
        <div className="shrink-0">
          <Link to="/login" className={signInPrimary}>Sign in <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
          <p className="mt-3 text-xs text-white/75">No account yet? Ask your CAELUM administrator for an invite.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-bg-canvas border-t border-border-warm">
      <div className={`${MAX} py-10 grid gap-6 sm:grid-cols-[1fr_auto] text-sm text-slate-600`}>
        <div>
          <p className="inline-flex items-center gap-2 font-extrabold text-slate-900"><BrandMark className="w-7 h-7 text-xs" />CAELUM</p>
          <p className="mt-2 max-w-md">Blood and cold-chain logistics for Kenyan public hospitals. Built by Team ORIZEN.</p>
          <p className="mt-2 text-xs">Hospital names and logos belong to their owners and are shown for demonstration.</p>
        </div>
        <div className="sm:text-right">
          <p>
            Contact:{' '}
            {CONTACT_EMAIL
              ? <a className="font-semibold text-brand-cobalt underline underline-offset-2" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              : 'your CAELUM administrator'}
          </p>
          <p className="mt-2">&copy; {year} CAELUM &middot; Team ORIZEN</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'CAELUM – Blood, where it’s needed';
    return () => { document.title = prev; };
  }, []);
  return (
    <div id="top" className="landing min-h-screen bg-bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:text-slate-900 focus:px-4 focus:py-3 focus:rounded-xl">Skip to content</a>
      <LandingNav />
      <main id="main">
        <Hero />
        <HospitalMarquee />
        <Story />
        <HowItWorks />
        <Roles />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
