'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
  embed?: boolean // true = no nav/footer, seamless for iframe embed
}

export default function ClientLayout({ children, embed = false }: ClientLayoutProps) {
  if (embed) {
    return (
      <>
        <style>{`
          .cl-embed-root {
            background: #F7F7F5;
            font-family: 'Inter', 'Avenir', sans-serif;
            min-height: 100vh;
          }
          .cl-embed-content {
            max-width: 860px;
            margin: 0 auto;
            padding: 0 24px 60px;
          }
          @media (max-width: 768px) {
            .cl-embed-content { padding: 0 16px 40px; }
          }
        `}</style>
        <div className="cl-embed-root">
          <div className="cl-embed-content">
            {children}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        .cl-root {
          min-height: 100vh;
          background: #F7F7F5;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', 'Avenir', sans-serif;
        }

        /* Top nav */
        .cl-nav {
          background: #1B4353;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 48px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .cl-nav-brand {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cl-nav-wordmark {
          font-family: 'League Spartan', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.01em;
          line-height: 1;
        }

        .cl-nav-tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 12px;
          color: rgba(168, 209, 231, 0.85);
          letter-spacing: 0.01em;
        }

        .cl-nav-contact {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.06em;
        }

        /* Page content */
        .cl-content {
          max-width: 860px;
          width: 100%;
          margin: 0 auto;
          padding: 56px 32px 80px;
          flex: 1;
        }

        /* Footer */
        .cl-footer {
          background: #1B4353;
          text-align: center;
          padding: 36px 24px;
        }

        .cl-footer-logo {
          font-family: 'League Spartan', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: 0.02em;
          margin-bottom: 6px;
        }

        .cl-footer-tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 13px;
          color: rgba(168, 209, 231, 0.8);
          margin-bottom: 10px;
        }

        .cl-footer-contact {
          font-size: 12px;
          color: rgba(255,255,255,0.35);
        }

        .cl-footer-contact a {
          color: rgba(168, 209, 231, 0.8);
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .cl-nav { padding: 0 20px; height: 68px; }
          .cl-nav-wordmark { font-size: 20px; }
          .cl-nav-contact { display: none; }
          .cl-content { padding: 32px 16px 60px; }
        }
      `}</style>

      <div className="cl-root">
        {/* Nav */}
        <nav className="cl-nav">
          <div className="cl-nav-brand">
            <span className="cl-nav-wordmark">Elias Range Stays</span>
            <span className="cl-nav-tagline">Healthy Living, Stronger Communities</span>
          </div>
          <span className="cl-nav-contact">eliasrangestays.ca</span>
        </nav>

        {/* Content */}
        <div className="cl-content">
          {children}
        </div>

        {/* Footer */}
        <footer className="cl-footer">
          <div className="cl-footer-logo">Elias Range Stays</div>
          <div className="cl-footer-tagline">Healthy Living, Stronger Communities</div>
          <div className="cl-footer-contact">
            <a href="mailto:austin@eliasrangestays.ca">austin@eliasrangestays.ca</a>
            &nbsp;·&nbsp; Registered in British Columbia, Canada
          </div>
        </footer>
      </div>
    </>
  )
}
