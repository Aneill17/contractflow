'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
  embed?: boolean
}

// Real BC mountain river photography via Unsplash CDN
// Dark teal gradient overlay ties them to ERS brand palette
const LEFT_PHOTO  = 'https://images.unsplash.com/photo-1469521167379-92d7c4e0d9e2?w=360&h=900&fit=crop&crop=center&auto=format&q=80'
const RIGHT_PHOTO = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=360&h=900&fit=crop&crop=center&auto=format&q=80'

export default function ClientLayout({ children, embed = false }: ClientLayoutProps) {

  // ── EMBED MODE ─────────────────────────────────────────────────────────────
  // Matches eliasrangestays.ca "Request a Quote" section:
  // dark navy background, dark inputs, teal CTA — no nav/footer/side panels
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
          /* Override form inputs for dark mode embed */
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
          .em-root label { color: rgba(168,209,231,0.75) !important; }
          /* Section card override */
          .em-root [data-card] {
            background: rgba(255,255,255,0.04) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: 10px !important;
          }
          .em-root [data-section-label] { color: rgba(168,209,231,0.9) !important; }
          @media (max-width: 768px) {
            .em-content { padding: 0 16px; }
          }
        `}</style>
        <div className="em-root">
          <div className="em-content">
            {children}
          </div>
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

        /* NAV — white so logo renders correctly */
        .cl-nav {
          background: #FFFFFF;
          border-bottom: 1px solid #E0E0DE;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 1px 16px rgba(0,0,0,0.07);
        }

        .cl-nav-logo {
          /* 64px height — logo text legible, icon clear */
          height: 64px;
          width: auto;
          display: block;
        }

        .cl-nav-right {
          text-align: right;
        }

        .cl-nav-tagline {
          display: block;
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 13px;
          color: #4F87A0;
          margin-bottom: 2px;
        }

        .cl-nav-link {
          display: block;
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

        /* Side photo panels */
        .cl-panel {
          width: 180px;
          flex-shrink: 0;
          position: sticky;
          top: 80px;
          height: calc(100vh - 80px);
          overflow: hidden;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        /* Dark teal overlay on photo panels */
        .cl-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(11, 32, 48, 0.72) 0%,
            rgba(27, 67, 83, 0.55) 40%,
            rgba(27, 67, 83, 0.60) 70%,
            rgba(11, 32, 48, 0.78) 100%
          );
        }

        /* Vertical brand label on panel */
        .cl-panel-label {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%) rotate(-90deg);
          transform-origin: center;
          white-space: nowrap;
          font-family: 'League Spartan', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: rgba(255,255,255,0.30);
          text-transform: uppercase;
          z-index: 1;
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
          padding: 44px 24px;
        }

        .cl-footer-logo {
          font-family: 'League Spartan', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: 0.01em;
          margin-bottom: 7px;
        }

        .cl-footer-tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 13px;
          color: rgba(168,209,231,0.85);
          margin-bottom: 14px;
        }

        .cl-footer-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.28);
          font-family: sans-serif;
        }

        .cl-footer-meta a { color: rgba(168,209,231,0.7); text-decoration: none; }

        /* Mobile */
        @media (max-width: 900px) {
          .cl-panel { display: none; }
          .cl-nav { padding: 0 20px; height: 70px; }
          .cl-nav-logo { height: 52px; }
          .cl-content { padding: 28px 16px 60px; }
        }
      `}</style>

      <div className="cl-root">

        {/* NAV */}
        <nav className="cl-nav">
          {/* Logo on white background renders perfectly — icon + wordmark fully legible */}
          <img src="/logo-v2.png" alt="Elias Range Stays" className="cl-nav-logo" />
          <div className="cl-nav-right">
            <span className="cl-nav-tagline">Healthy Living, Stronger Communities</span>
            <a href="https://eliasrangestays.ca" className="cl-nav-link">eliasrangestays.ca</a>
          </div>
        </nav>

        {/* BODY */}
        <div className="cl-body">

          {/* Left — BC mountain river photo */}
          <div
            className="cl-panel"
            style={{ backgroundImage: `url("${LEFT_PHOTO}")` }}
          >
            <span className="cl-panel-label">Elias Range Stays</span>
          </div>

          {/* Center */}
          <div className="cl-center">
            <div className="cl-content">
              {children}
            </div>

            <footer className="cl-footer">
              <div className="cl-footer-logo">Elias Range Stays</div>
              <div className="cl-footer-tagline">Healthy Living, Stronger Communities</div>
              <div className="cl-footer-meta">
                <a href="mailto:austin@eliasrangestays.ca">austin@eliasrangestays.ca</a>
                &nbsp;·&nbsp; Registered in British Columbia, Canada
              </div>
            </footer>
          </div>

          {/* Right — BC mountain peaks photo */}
          <div
            className="cl-panel"
            style={{ backgroundImage: `url("${RIGHT_PHOTO}")` }}
          >
            <span className="cl-panel-label">Healthy Living</span>
          </div>

        </div>
      </div>
    </>
  )
}
