'use client'

import React from 'react'

const MOUNTAIN_SVG_LEFT = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 400' preserveAspectRatio='xMidYMax meet'%3E%3Cpolygon points='0,400 40,200 80,280 120,150 160,230 160,400' fill='white' fill-opacity='0.08'/%3E%3Cpolygon points='0,400 20,280 60,180 100,250 140,160 160,220 160,400' fill='white' fill-opacity='0.06'/%3E%3C/svg%3E`

const MOUNTAIN_SVG_RIGHT = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 400' preserveAspectRatio='xMidYMax meet'%3E%3Cpolygon points='0,230 40,150 80,280 120,200 160,400 0,400' fill='white' fill-opacity='0.08'/%3E%3Cpolygon points='0,220 20,160 60,250 100,180 140,280 160,400 0,400' fill='white' fill-opacity='0.06'/%3E%3C/svg%3E`

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;600;700&family=Source+Serif+4:ital,wght@0,400;1,400&display=swap');

        .cl-root {
          min-height: 100vh;
          background: #F7F7F5;
          display: flex;
          flex-direction: column;
        }

        /* Sticky nav */
        .cl-nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #1B4353;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          width: 100%;
        }

        /* Layout body: side panels + center */
        .cl-body {
          flex: 1;
          display: flex;
          position: relative;
        }

        .cl-panel {
          position: fixed;
          top: 64px;
          width: 160px;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cl-panel-left  { left: 0; }
        .cl-panel-right { right: 0; }

        .cl-panel-label {
          font-family: 'League Spartan', sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: rgba(255,255,255,0.30);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          white-space: nowrap;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-90deg);
          pointer-events: none;
        }

        /* Center content column */
        .cl-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin: 0 160px;
        }

        .cl-content {
          max-width: 740px;
          width: 100%;
          margin: 0 auto;
          padding: 40px 24px 60px;
          flex: 1;
        }

        /* Footer */
        .cl-footer {
          background: #F0EDE8;
          border-top: 1px solid #D5D5D5;
          text-align: center;
          padding: 28px 24px;
        }

        /* Mobile: hide panels, remove margin */
        @media (max-width: 768px) {
          .cl-panel { display: none; }
          .cl-center { margin: 0; }
          .cl-content { padding: 24px 16px 48px; }
        }
      `}</style>

      <div className="cl-root">
        {/* Top Nav */}
        <nav className="cl-nav">
          <img src="/logo-v2.png" height={36} alt="Elias Range Stays" style={{ display: 'block' }} />
          <span style={{
            fontFamily: "'Source Serif 4', serif",
            fontStyle: 'italic',
            fontSize: 12,
            color: 'rgba(255,255,255,0.60)',
          }}>
            Healthy Living, Stronger Communities
          </span>
        </nav>

        {/* Body */}
        <div className="cl-body">
          {/* Left Panel */}
          <div
            className="cl-panel cl-panel-left"
            style={{
              background: `#1B4353 url("${MOUNTAIN_SVG_LEFT}") bottom/cover no-repeat`,
            }}
          >
            <span className="cl-panel-label">Elias Range Stays</span>
          </div>

          {/* Right Panel */}
          <div
            className="cl-panel cl-panel-right"
            style={{
              background: `#1B4353 url("${MOUNTAIN_SVG_RIGHT}") bottom/cover no-repeat`,
            }}
          >
            <span className="cl-panel-label">Elias Range Stays</span>
          </div>

          {/* Center */}
          <div className="cl-center">
            <div className="cl-content">
              {children}
            </div>

            {/* Footer */}
            <footer className="cl-footer">
              <img src="/logo-v3.png" height={32} alt="ERS" style={{ display: 'inline-block', marginBottom: 10 }} />
              <p style={{
                fontFamily: "'Source Serif 4', serif",
                fontSize: 12,
                color: '#555',
                marginBottom: 6,
                fontStyle: 'italic',
              }}>
                Healthy Living, Stronger Communities
              </p>
              <p style={{ fontFamily: 'sans-serif', fontSize: 11, color: '#888', marginBottom: 4 }}>
                <a href="mailto:austin@eliasrangestays.ca" style={{ color: '#1B4353', textDecoration: 'none' }}>
                  austin@eliasrangestays.ca
                </a>
              </p>
              <p style={{ fontFamily: 'sans-serif', fontSize: 10, color: '#aaa' }}>
                Elias Range Stays Ltd. · Registered in British Columbia, Canada
              </p>
            </footer>
          </div>
        </div>
      </div>
    </>
  )
}
