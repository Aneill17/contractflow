'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
  embed?: boolean
}

// One panoramic BC river/mountain landscape — split across both panels
// Left panel shows left portion, right panel shows right portion = full picture effect
const PANORAMIC_PHOTO = 'https://images.unsplash.com/photo-1447752875215-b2761acf3dfd?auto=format&q=80'

export default function ClientLayout({ children, embed = false }: ClientLayoutProps) {

  // ── EMBED MODE ─────────────────────────────────────────────────────────────
  if (embed) {
    return (
      <>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #0B2540; }
          .em-root {
            background: #0B2540;
            font-family: 'Inter', 'Avenir', sans-serif;
            min-height: 100vh;
            padding: 0 0 60px;
          }
          .em-content {
            max-width: 860px;
            margin: 0 auto;
            padding: 0 24px;
          }
          .em-root input,
          .em-root textarea,
          .em-root select {
            background: #0C1D2E !important;
            border: 1px solid rgba(255,255,255,0.14) !important;
            color: #FFFFFF !important;
            border-radius: 6px !important;
          }
          .em-root input::placeholder,
          .em-root textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
          .em-root input:focus,
          .em-root textarea:focus { border-color: #00BFA6 !important; outline: none !important; }
          @media (max-width: 768px) {
            .em-content { padding: 0 16px; }
          }
        `}</style>
        <div className="em-root">
          <div className="em-content">{children}</div>
        </div>
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

        /* NAV — white so logo colours render correctly */
        .cl-nav {
          background: #FFFFFF;
          border-bottom: 2px solid #1B4353;
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
        }

        /* Logo fills the nav height — very prominent */
        .cl-nav-logo {
          height: 82px;
          width: auto;
          display: block;
        }

        .cl-nav-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* Tagline matches body font — League Spartan, consistent with everything else */
        .cl-nav-tagline {
          font-family: 'League Spartan', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #1B4353;
          letter-spacing: 0.04em;
        }

        .cl-nav-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #B5B5B5;
          letter-spacing: 0.08em;
          text-decoration: none;
        }
        .cl-nav-link:hover { color: #1B4353; }

        /* BODY */
        .cl-body {
          flex: 1;
          display: flex;
        }

        /* Side panels — left half and right half of the SAME panoramic photo */
        .cl-panel {
          width: 180px;
          flex-shrink: 0;
          position: sticky;
          top: 100px;
          height: calc(100vh - 100px);
          overflow: hidden;
          background-image: url("${PANORAMIC_PHOTO}");
          background-size: cover;
          background-repeat: no-repeat;
        }

        /* Left panel shows left side of the photo */
        .cl-panel-left  { background-position: 0% center; }

        /* Right panel shows right side of the photo */
        .cl-panel-right { background-position: 100% center; }

        /* Teal brand overlay on both panels */
        .cl-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(11, 32, 48, 0.65) 0%,
            rgba(27, 67, 83, 0.45) 45%,
            rgba(27, 67, 83, 0.50) 75%,
            rgba(11, 32, 48, 0.70) 100%
          );
          pointer-events: none;
        }

        /* Center column */
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
          padding: 52px 28px 80px;
          flex: 1;
        }

        /* FOOTER */
        .cl-footer {
          background: linear-gradient(135deg, #0C2030 0%, #1B4353 100%);
          text-align: center;
          padding: 44px 24px 36px;
        }

        /* Footer logo — CSS filter makes the PNG all-white on dark bg */
        .cl-footer-logo-img {
          height: 52px;
          width: auto;
          display: inline-block;
          filter: brightness(0) invert(1);
          opacity: 0.90;
          margin-bottom: 14px;
        }

        .cl-footer-tagline {
          font-family: 'League Spartan', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(168,209,231,0.85);
          letter-spacing: 0.04em;
          margin-bottom: 12px;
        }

        .cl-footer-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          font-family: sans-serif;
        }

        .cl-footer-meta a { color: rgba(168,209,231,0.7); text-decoration: none; }

        @media (max-width: 900px) {
          .cl-panel { display: none; }
          .cl-nav { padding: 0 20px; height: 80px; }
          .cl-nav-logo { height: 64px; }
          .cl-content { padding: 28px 16px 60px; }
        }
      `}</style>

      <div className="cl-root">

        {/* NAV — large logo, consistent typography */}
        <nav className="cl-nav">
          <img src="/logo-v2.png" alt="Elias Range Stays" className="cl-nav-logo" />
          <div className="cl-nav-right">
            <span className="cl-nav-tagline">Healthy Living, Stronger Communities</span>
            <a href="https://eliasrangestays.ca" className="cl-nav-link">eliasrangestays.ca</a>
          </div>
        </nav>

        {/* BODY */}
        <div className="cl-body">

          {/* Left panel — left half of panoramic */}
          <div className="cl-panel cl-panel-left" />

          {/* Center */}
          <div className="cl-center">
            <div className="cl-content">
              {children}
            </div>

            {/* Footer with white logo */}
            <footer className="cl-footer">
              <img src="/logo-v2.png" alt="Elias Range Stays" className="cl-footer-logo-img" />
              <div className="cl-footer-tagline">Healthy Living, Stronger Communities</div>
              <div className="cl-footer-meta">
                <a href="mailto:austin@eliasrangestays.ca">austin@eliasrangestays.ca</a>
                &nbsp;·&nbsp; Registered in British Columbia, Canada
              </div>
            </footer>
          </div>

          {/* Right panel — right half of panoramic */}
          <div className="cl-panel cl-panel-right" />

        </div>
      </div>
    </>
  )
}
