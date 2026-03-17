'use client'

import React from 'react'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
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

        /* Top nav — white, clean, ERS wordmark */
        .cl-nav {
          background: #FFFFFF;
          border-bottom: 2px solid #1B4353;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .cl-nav-brand {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cl-nav-wordmark {
          font-family: 'League Spartan', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #1B4353;
          letter-spacing: -0.01em;
          line-height: 1;
        }

        .cl-nav-tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 11px;
          color: #4F87A0;
          letter-spacing: 0.01em;
        }

        .cl-nav-contact {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #888;
          letter-spacing: 0.04em;
        }

        /* Page content */
        .cl-content {
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
          padding: 48px 32px 80px;
          flex: 1;
        }

        /* Footer */
        .cl-footer {
          background: #FFFFFF;
          border-top: 1px solid #E5E5E3;
          text-align: center;
          padding: 32px 24px;
        }

        .cl-footer-logo {
          font-family: 'League Spartan', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #1B4353;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .cl-footer-tagline {
          font-family: 'Source Serif 4', serif;
          font-style: italic;
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
        }

        .cl-footer-contact {
          font-size: 11px;
          color: #aaa;
        }

        .cl-footer-contact a {
          color: #1B4353;
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .cl-nav { padding: 0 20px; }
          .cl-nav-contact { display: none; }
          .cl-content { padding: 28px 16px 60px; }
        }
      `}</style>

      <div className="cl-root">
        {/* Nav */}
        <nav className="cl-nav">
          <div className="cl-nav-brand">
            <span className="cl-nav-wordmark">Elias Range Stays</span>
            <span className="cl-nav-tagline">Healthy Living, Stronger Communities</span>
          </div>
          <span className="cl-nav-contact">austin@eliasrangestays.ca</span>
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
