'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
  embed?: boolean
}

// One panoramic BC river/mountain landscape — split across both panels
const PANORAMIC_PHOTO = 'https://images.unsplash.com/photo-1447752875215-b2761acf3dfd?auto=format&q=80'

export default function ClientLayout({ children, embed = false }: ClientLayoutProps) {

  // ── EMBED MODE ─────────────────────────────────────────────────────────────
  if (embed) {
    return (
      <>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #0B2540; }
          .em-root { background: #0B2540; font-family: 'Inter', sans-serif; min-height: 100vh; padding: 0 0 60px; }
          .em-content { max-width: 860px; margin: 0 auto; padding: 0 24px; }
          .em-root input, .em-root textarea, .em-root select {
            background: #0C1D2E !important; border: 1px solid rgba(255,255,255,0.14) !important;
            color: #FFFFFF !important; border-radius: 6px !important;
          }
          .em-root input::placeholder, .em-root textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
          .em-root input:focus, .em-root textarea:focus { border-color: #00BFA6 !important; outline: none !important; }
          @media (max-width: 768px) { .em-content { padding: 0 16px; } }
        `}</style>
        <div className="em-root"><div className="em-content">{children}</div></div>
      </>
    )
  }

  // ── STANDALONE MODE ─────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; }

        .cl-root {
          min-height: 100vh;
          background: #F7F7F5;
          display: flex;
          flex-direction: column;
        }

        /* ── NAV ── */
        .cl-nav {
          background: #FFFFFF;
          border-bottom: 3px solid #1B4353;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 2px 24px rgba(0,0,0,0.09);
        }

        /* Logo fills nav — large and readable */
        .cl-nav-logo {
          height: 96px;
          width: auto;
          display: block;
        }

        .cl-nav-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .cl-nav-tagline {
          font-family: 'League Spartan', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #1B4353;
          letter-spacing: 0.03em;
        }

        .cl-nav-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #B5B5B5;
          letter-spacing: 0.08em;
          text-decoration: none;
        }
        .cl-nav-link:hover { color: #1B4353; }

        /* ── BODY — three-column: panel | content | panel ── */
        .cl-body {
          flex: 1;
          display: flex;
          /* panels stretch to full height of body automatically */
        }

        /* Side panels — same photo, different position = panoramic split */
        .cl-panel {
          width: 200px;
          flex-shrink: 0;
          background-image: url("${PANORAMIC_PHOTO}");
          background-repeat: no-repeat;
          background-size: cover;
          position: relative;
        }

        .cl-panel-left  { background-position: 15% center; }
        .cl-panel-right { background-position: 85% center; }

        /* Brand colour overlay on photos */
        .cl-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(11,32,48,0.60) 0%,
            rgba(27,67,83,0.38) 35%,
            rgba(27,67,83,0.38) 65%,
            rgba(11,32,48,0.65) 100%
          );
        }

        /* ── CENTER COLUMN ── */
        .cl-center {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .cl-content {
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
          padding: 52px 32px 80px;
          flex: 1;
        }

        /* ── FOOTER ── */
        .cl-footer {
          background: linear-gradient(135deg, #0C2030 0%, #1B4353 100%);
          text-align: center;
          padding: 48px 24px 36px;
        }

        /* White logo via CSS filter on dark footer */
        .cl-footer-logo {
          height: 64px;
          width: auto;
          display: inline-block;
          filter: brightness(0) invert(1);
          opacity: 0.90;
          margin-bottom: 16px;
        }

        .cl-footer-tagline {
          font-family: 'League Spartan', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: rgba(168,209,231,0.85);
          letter-spacing: 0.04em;
          margin-bottom: 12px;
        }

        .cl-footer-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.30);
          font-family: sans-serif;
        }
        .cl-footer-meta a { color: rgba(168,209,231,0.75); text-decoration: none; }

        /* ── MOBILE — hide panels below 960px ── */
        @media (max-width: 960px) {
          .cl-panel { display: none; }
          .cl-nav { padding: 0 24px; height: 90px; }
          .cl-nav-logo { height: 72px; }
          .cl-content { padding: 32px 16px 60px; }
        }
      `}</style>

      <div className="cl-root">

        {/* NAV */}
        <nav className="cl-nav">
          <img src="/logo-v2.png" alt="Elias Range Stays" className="cl-nav-logo" />
          <div className="cl-nav-right">
            <span className="cl-nav-tagline">Healthy Living, Stronger Communities</span>
            <a href="https://eliasrangestays.ca" className="cl-nav-link">eliasrangestays.ca</a>
          </div>
        </nav>

        {/* BODY */}
        <div className="cl-body">

          {/* Left panel — left side of panoramic */}
          <div className="cl-panel cl-panel-left" />

          {/* Center */}
          <div className="cl-center">
            <div className="cl-content">{children}</div>

            <footer className="cl-footer">
              <img src="/logo-v2.png" alt="Elias Range Stays" className="cl-footer-logo" />
              <div className="cl-footer-tagline">Healthy Living, Stronger Communities</div>
              <div className="cl-footer-meta">
                <a href="mailto:austin@eliasrangestays.ca">austin@eliasrangestays.ca</a>
                &nbsp;·&nbsp; Registered in British Columbia, Canada
              </div>
            </footer>
          </div>

          {/* Right panel — right side of panoramic */}
          <div className="cl-panel cl-panel-right" />

        </div>
      </div>
    </>
  )
}
