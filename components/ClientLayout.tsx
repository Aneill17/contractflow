'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
  embed?: boolean
}

// The mountain/alpine photo Austin approved — used on both side panels
const PANEL_PHOTO = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop&crop=center&auto=format&q=85'

export default function ClientLayout({ children, embed = false }: ClientLayoutProps) {

  // ── EMBED MODE ─────────────────────────────────────────────────────────────
  if (embed) {
    return (
      <>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body { margin: 0; padding: 0; background: #0B2540; }
          .em-root { background: #0B2540; font-family: 'Segoe UI', system-ui, sans-serif; min-height: 100vh; padding: 0 0 60px; }
          .em-content { max-width: 860px; margin: 0 auto; padding: 0 24px; }
          .em-root input, .em-root textarea, .em-root select {
            background: rgba(255,255,255,0.06) !important;
            border: 1px solid rgba(255,255,255,0.14) !important;
            color: #FFFFFF !important;
            border-radius: 7px !important;
            font-family: 'Segoe UI', system-ui, sans-serif !important;
          }
          .em-root input::placeholder, .em-root textarea::placeholder { color: rgba(255,255,255,0.3) !important; }
          .em-root input:focus, .em-root textarea:focus {
            border-color: #00BFA6 !important;
            outline: none !important;
            box-shadow: 0 0 0 3px rgba(0,191,166,0.15) !important;
          }
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
          background: #f8f9fb;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        /* ── NAV — white background, navy accent ── */
        .cl-nav {
          background: #ffffff;
          border-bottom: 3px solid #0B2540;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 2px 16px rgba(11,37,64,0.08);
        }

        .cl-nav-logo {
          height: 96px;
          width: auto;
          display: block;
        }

        .cl-nav-right {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .cl-nav-tagline {
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #0B2540;
          letter-spacing: 0.01em;
        }

        .cl-nav-link {
          font-size: 12px;
          color: #94a3b8;
          letter-spacing: 0.04em;
          text-decoration: none;
          transition: color 0.15s;
        }
        .cl-nav-link:hover { color: #00BFA6; }

        /* ── BODY — flex row: panel | center | panel ── */
        .cl-body {
          flex: 1;
          display: flex;
          min-height: calc(100vh - 120px);
        }

        /* ── SIDE PANELS ── */
        .cl-panel {
          width: 200px;
          flex-shrink: 0;
          background-repeat: no-repeat;
          background-size: cover;
          position: relative;
        }

        .cl-panel-left  { background-position: 8% center; }
        .cl-panel-right { background-position: 92% center; }

        /* Navy teal overlay — ERS brand */
        .cl-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(11,37,64,0.60) 0%,
            rgba(11,37,64,0.35) 40%,
            rgba(11,37,64,0.35) 60%,
            rgba(11,37,64,0.65) 100%
          );
          pointer-events: none;
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
          background: #0B2540;
          padding: 28px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .cl-footer-text {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .cl-footer-tagline {
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #00BFA6;
          letter-spacing: 0.03em;
        }

        .cl-footer-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.30);
        }
        .cl-footer-meta a { color: rgba(0,191,166,0.65); text-decoration: none; }
        .cl-footer-meta a:hover { color: #00BFA6; }

        /* Logo in white box */
        .cl-footer-logo-wrap {
          background: #ffffff;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cl-footer-logo {
          height: 40px;
          width: auto;
          display: block;
        }

        /* ── MOBILE ── */
        @media (max-width: 960px) {
          .cl-panel { display: none; }
          .cl-nav { padding: 0 24px; height: 90px; }
          .cl-nav-logo { height: 72px; }
          .cl-content { padding: 32px 16px 60px; }
          .cl-footer { padding: 24px; }
        }
      `}</style>

      <div className="cl-root">

        {/* NAV */}
        <nav className="cl-nav">
          <img src="/logo.png" alt="Elias Range Stays" className="cl-nav-logo" />
          <div className="cl-nav-right">
            <span className="cl-nav-tagline">Healthy Living · Stronger Communities</span>
            <a href="https://eliasrangestays.ca" className="cl-nav-link">eliasrangestays.ca</a>
          </div>
        </nav>

        {/* BODY */}
        <div className="cl-body">

          {/* Left panel */}
          <div className="cl-panel cl-panel-left" style={{ backgroundImage: `url("${PANEL_PHOTO}")` }} />

          {/* Center */}
          <div className="cl-center">
            <div className="cl-content">{children}</div>

            {/* Footer */}
            <footer className="cl-footer">
              <div className="cl-footer-text">
                <span className="cl-footer-tagline">Healthy Living · Stronger Communities</span>
                <span className="cl-footer-meta">
                  <a href="mailto:austin@eliasrangestays.ca">austin@eliasrangestays.ca</a>
                  &nbsp;·&nbsp; Registered in British Columbia, Canada
                </span>
              </div>
              <div className="cl-footer-logo-wrap">
                <img src="/logo.png" alt="Elias Range Stays" className="cl-footer-logo" />
              </div>
            </footer>
          </div>

          {/* Right panel */}
          <div className="cl-panel cl-panel-right" style={{ backgroundImage: `url("${PANEL_PHOTO}")` }} />

        </div>
      </div>
    </>
  )
}
