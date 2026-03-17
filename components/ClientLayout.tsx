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

        /* ── NAV ──
           White bg so trimmed logo (transparent bg) renders perfectly.
           Logo is now the cropped version: 301×152px actual content.
           At height 120px → renders at 120px tall × 237px wide. Fully legible. */
        .cl-nav {
          background: #FFFFFF;
          border-bottom: 3px solid #1B4353;
          height: 136px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 2px 24px rgba(0,0,0,0.09);
        }

        /* Trimmed logo — no wasted whitespace, content fills the height */
        .cl-nav-logo {
          height: 110px;
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
          font-size: 16px;
          font-weight: 600;
          color: #1B4353;
          letter-spacing: 0.02em;
        }

        .cl-nav-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #B5B5B5;
          letter-spacing: 0.08em;
          text-decoration: none;
        }
        .cl-nav-link:hover { color: #1B4353; }

        /* ── BODY — flex row: panel | center | panel ── */
        .cl-body {
          flex: 1;
          display: flex;
          min-height: calc(100vh - 136px);
        }

        /* ── SIDE PANELS ──
           Same landscape photo, different crop position = panoramic split effect.
           Left panel: left side of the photo (forest, dock, near shore)
           Right panel: right side (mountain peaks, sky)
           Photo is local — no CDN dependency. */
        .cl-panel {
          width: 200px;
          flex-shrink: 0;
          background-image: url('');
          background-repeat: no-repeat;
          background-size: cover;
          position: relative;
        }

        .cl-panel-left  { background-position: 8% center; }
        .cl-panel-right { background-position: 92% center; }

        /* Dark teal overlay — ties photos to ERS brand */
        .cl-panel::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(11,32,48,0.55) 0%,
            rgba(27,67,83,0.30) 30%,
            rgba(27,67,83,0.30) 70%,
            rgba(11,32,48,0.60) 100%
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
          background: linear-gradient(135deg, #0C2030 0%, #1B4353 100%);
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
          font-family: 'League Spartan', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(168,209,231,0.90);
          letter-spacing: 0.03em;
        }

        .cl-footer-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.30);
          font-family: sans-serif;
        }
        .cl-footer-meta a { color: rgba(168,209,231,0.65); text-decoration: none; }

        /* Logo in white box — original brand colours preserved */
        .cl-footer-logo-wrap {
          background: #FFFFFF;
          border-radius: 10px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cl-footer-logo {
          height: 44px;
          width: auto;
          display: block;
        }

        /* ── MOBILE ── */
        @media (max-width: 960px) {
          .cl-panel { display: none; }
          .cl-nav { padding: 0 24px; height: 100px; }
          .cl-nav-logo { height: 80px; }
          .cl-content { padding: 32px 16px 60px; }
        }
      `}</style>

      <div className="cl-root">

        {/* NAV */}
        <nav className="cl-nav">
          {/* logo-v2-trim.png: 301×152 actual content — no whitespace padding */}
          <img src="/logo-v2-trim.png" alt="Elias Range Stays" className="cl-nav-logo" />
          <div className="cl-nav-right">
            <span className="cl-nav-tagline">Healthy Living, Stronger Communities</span>
            <a href="https://eliasrangestays.ca" className="cl-nav-link">eliasrangestays.ca</a>
          </div>
        </nav>

        {/* BODY */}
        <div className="cl-body">

          {/* Left panel — left portion of Moraine Lake panoramic */}
          <div className="cl-panel cl-panel-left" style={{ backgroundImage: `url("${PANEL_PHOTO}")` }} />

          {/* Center */}
          <div className="cl-center">
            <div className="cl-content">{children}</div>

            {/* Footer — tagline left, logo in white box right */}
            <footer className="cl-footer">
              <div className="cl-footer-text">
                <span className="cl-footer-tagline">Healthy Living, Stronger Communities</span>
                <span className="cl-footer-meta">
                  <a href="mailto:austin@eliasrangestays.ca">austin@eliasrangestays.ca</a>
                  &nbsp;·&nbsp; Registered in British Columbia, Canada
                </span>
              </div>
              {/* Original colours preserved — white box makes logo legible on dark bg */}
              <div className="cl-footer-logo-wrap">
                <img src="/logo-v2-trim.png" alt="Elias Range Stays" className="cl-footer-logo" />
              </div>
            </footer>
          </div>

          {/* Right panel — right portion of Moraine Lake panoramic */}
          <div className="cl-panel cl-panel-right" style={{ backgroundImage: `url("${PANEL_PHOTO}")` }} />

        </div>
      </div>
    </>
  )
}
