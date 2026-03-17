'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
  embed?: boolean
}

// Layered BC mountain landscape — left panel
const LEFT_PANEL_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 900" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0C2030"/>
      <stop offset="60%" stop-color="#1B4353"/>
      <stop offset="100%" stop-color="#1E4F62"/>
    </linearGradient>
    <linearGradient id="range1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4F87A0" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#4F87A0" stop-opacity="0.1"/>
    </linearGradient>
    <linearGradient id="range2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#A8D1E7" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#A8D1E7" stop-opacity="0.05"/>
    </linearGradient>
    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0C2030"/>
      <stop offset="100%" stop-color="#071520"/>
    </linearGradient>
  </defs>

  <!-- Sky base -->
  <rect width="160" height="900" fill="url(#sky)"/>

  <!-- Distant range — soft, high -->
  <path d="M0,520 L18,430 L35,470 L55,380 L75,440 L95,360 L115,420 L135,370 L160,410 L160,900 L0,900 Z" fill="url(#range1)"/>

  <!-- Mid range — more defined -->
  <path d="M0,600 L20,510 L40,560 L65,480 L85,530 L105,470 L125,530 L145,490 L160,520 L160,900 L0,900 Z" fill="#163847" opacity="0.9"/>

  <!-- Closer foothills -->
  <path d="M0,680 L25,620 L50,650 L75,590 L100,640 L125,600 L145,635 L160,615 L160,900 L0,900 Z" fill="#112D3E" opacity="1"/>

  <!-- Tree line -->
  <path d="M0,740 L12,720 L20,730 L32,710 L44,725 L55,705 L68,720 L80,700 L92,718 L104,698 L116,715 L128,695 L140,712 L152,700 L160,710 L160,900 L0,900 Z" fill="#2D5A3D" opacity="0.85"/>

  <!-- Snow caps on distant peaks -->
  <path d="M52,384 L55,371 L58,384 Z" fill="white" opacity="0.25"/>
  <path d="M92,363 L95,349 L98,363 Z" fill="white" opacity="0.22"/>
  <path d="M132,373 L135,360 L138,373 Z" fill="white" opacity="0.2"/>

  <!-- Topographic contour lines overlay -->
  <path d="M0,760 Q40,750 80,758 Q120,765 160,755" stroke="#A8D1E7" stroke-width="0.5" fill="none" opacity="0.12"/>
  <path d="M0,790 Q40,780 80,788 Q120,795 160,785" stroke="#A8D1E7" stroke-width="0.5" fill="none" opacity="0.10"/>
  <path d="M0,820 Q40,812 80,818 Q120,825 160,815" stroke="#A8D1E7" stroke-width="0.5" fill="none" opacity="0.08"/>
  <path d="M0,850 Q40,842 80,848 Q120,855 160,845" stroke="#A8D1E7" stroke-width="0.5" fill="none" opacity="0.07"/>

  <!-- Subtle mist layer -->
  <rect x="0" y="530" width="160" height="80" fill="white" opacity="0.03"/>

  <!-- Brand text — vertical -->
  <text x="-50" y="80" transform="rotate(90) translate(0,-150)" font-family="'League Spartan', sans-serif" font-size="9" font-weight="600" fill="white" opacity="0.22" letter-spacing="4">ELIAS RANGE STAYS</text>
</svg>
`)

// Right panel — mirrored feel, slightly different peaks
const RIGHT_PANEL_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 900" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0C2030"/>
      <stop offset="60%" stop-color="#1B4353"/>
      <stop offset="100%" stop-color="#163847"/>
    </linearGradient>
  </defs>

  <!-- Sky base -->
  <rect width="160" height="900" fill="url(#sky2)"/>

  <!-- Distant range -->
  <path d="M0,410 L22,360 L45,400 L68,345 L90,390 L112,350 L135,385 L160,355 L160,900 L0,900 Z" fill="#4F87A0" opacity="0.28"/>

  <!-- Mid range -->
  <path d="M0,520 L30,460 L55,500 L78,445 L100,490 L122,452 L145,480 L160,460 L160,900 L0,900 Z" fill="#163847" opacity="0.9"/>

  <!-- Closer foothills -->
  <path d="M0,620 L28,565 L52,600 L78,555 L102,595 L128,560 L152,590 L160,570 L160,900 L0,900 Z" fill="#112D3E" opacity="1"/>

  <!-- Tree line -->
  <path d="M0,690 L15,668 L28,680 L42,660 L56,675 L70,655 L84,670 L98,650 L112,666 L126,646 L140,663 L154,648 L160,658 L160,900 L0,900 Z" fill="#2D5A3D" opacity="0.85"/>

  <!-- Snow caps -->
  <path d="M65,348 L68,334 L71,348 Z" fill="white" opacity="0.24"/>
  <path d="M108,352 L111,338 L114,352 Z" fill="white" opacity="0.21"/>
  <path d="M22,363 L25,350 L28,363 Z" fill="white" opacity="0.19"/>

  <!-- Contour lines -->
  <path d="M0,710 Q40,700 80,708 Q120,715 160,705" stroke="#A8D1E7" stroke-width="0.5" fill="none" opacity="0.12"/>
  <path d="M0,740 Q40,730 80,738 Q120,745 160,735" stroke="#A8D1E7" stroke-width="0.5" fill="none" opacity="0.10"/>
  <path d="M0,770 Q40,762 80,768 Q120,775 160,765" stroke="#A8D1E7" stroke-width="0.5" fill="none" opacity="0.08"/>

  <!-- Brand text — vertical -->
  <text x="-50" y="80" transform="rotate(90) translate(0,-150)" font-family="'League Spartan', sans-serif" font-size="9" font-weight="600" fill="white" opacity="0.22" letter-spacing="4">HEALTHY LIVING</text>
</svg>
`)

export default function ClientLayout({ children, embed = false }: ClientLayoutProps) {
  if (embed) {
    return (
      <>
        <style>{`
          body { margin: 0; padding: 0; background: #F7F7F5; }
          .cl-embed-root {
            background: #F7F7F5;
            font-family: 'Inter', 'Avenir', sans-serif;
            min-height: 100vh;
          }
          .cl-embed-content {
            max-width: 900px;
            margin: 0 auto;
            padding: 0 24px 60px;
          }
          @media (max-width: 768px) {
            .cl-embed-content { padding: 0 16px 40px; }
          }
        `}</style>
        <div className="cl-embed-root">
          <div className="cl-embed-content">{children}</div>
        </div>
      </>
    )
  }

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

        /* ─── NAV ─── */
        .cl-nav {
          background: #FFFFFF;
          border-bottom: 1px solid #E0E0DE;
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 200;
          box-shadow: 0 1px 12px rgba(0,0,0,0.06);
        }

        .cl-nav-logo {
          height: 40px;
          display: block;
        }

        .cl-nav-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .cl-nav-tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 12px;
          color: #4F87A0;
        }

        .cl-nav-contact {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #B5B5B5;
          letter-spacing: 0.06em;
        }

        /* ─── BODY ─── */
        .cl-body {
          flex: 1;
          display: flex;
          position: relative;
        }

        /* Side panels */
        .cl-panel {
          width: 160px;
          flex-shrink: 0;
          position: sticky;
          top: 76px;
          height: calc(100vh - 76px);
          overflow: hidden;
          background-size: cover;
          background-position: bottom center;
          background-repeat: no-repeat;
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
          padding: 48px 28px 80px;
          flex: 1;
        }

        /* ─── FOOTER ─── */
        .cl-footer {
          background: #1B4353;
          text-align: center;
          padding: 40px 24px;
        }

        .cl-footer-wordmark {
          font-family: 'League Spartan', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: 0.01em;
          margin-bottom: 6px;
        }

        .cl-footer-tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 13px;
          color: rgba(168,209,231,0.85);
          margin-bottom: 12px;
        }

        .cl-footer-meta {
          font-size: 11px;
          color: rgba(255,255,255,0.30);
          font-family: sans-serif;
        }

        .cl-footer-meta a {
          color: rgba(168,209,231,0.75);
          text-decoration: none;
        }

        /* Mobile */
        @media (max-width: 860px) {
          .cl-panel { display: none; }
          .cl-nav { padding: 0 20px; }
          .cl-content { padding: 28px 16px 60px; }
        }
      `}</style>

      <div className="cl-root">

        {/* ─── NAV ─── */}
        <nav className="cl-nav">
          {/* Logo renders perfectly on white background */}
          <img src="/logo-v2.png" alt="Elias Range Stays" className="cl-nav-logo" />
          <div className="cl-nav-right">
            <span className="cl-nav-tagline">Healthy Living, Stronger Communities</span>
            <span className="cl-nav-contact">eliasrangestays.ca</span>
          </div>
        </nav>

        {/* ─── BODY ─── */}
        <div className="cl-body">

          {/* Left panel — BC mountain landscape */}
          <div
            className="cl-panel"
            style={{ backgroundImage: `url("data:image/svg+xml,${LEFT_PANEL_SVG}")` }}
          />

          {/* Center */}
          <div className="cl-center">
            <div className="cl-content">
              {children}
            </div>

            {/* Footer */}
            <footer className="cl-footer">
              <div className="cl-footer-wordmark">Elias Range Stays</div>
              <div className="cl-footer-tagline">Healthy Living, Stronger Communities</div>
              <div className="cl-footer-meta">
                <a href="mailto:austin@eliasrangestays.ca">austin@eliasrangestays.ca</a>
                &nbsp;·&nbsp; Registered in British Columbia, Canada
              </div>
            </footer>
          </div>

          {/* Right panel — BC mountain landscape */}
          <div
            className="cl-panel"
            style={{ backgroundImage: `url("data:image/svg+xml,${RIGHT_PANEL_SVG}")` }}
          />

        </div>
      </div>
    </>
  )
}
