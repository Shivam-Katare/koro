"use client";

import React, { useEffect } from "react";
import Link from "next/link";

/* -------------------------------------------------------------------------- */
/*                               SVG DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

export function KoroSvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
      <defs>
        <symbol
          id="pin"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M32 59S12 39 12 24a20 20 0 0140 0c0 15-20 35-20 35z" fill="#f64932" />
          <circle cx="32" cy="24" r="9" fill="#fff" />
          <path d="M27 22h10M27 26h10" />
        </symbol>

        <symbol
          id="tag"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M6 32L30 8h26v26L32 58z" fill="#ffb110" />
          <circle cx="44" cy="20" r="3.5" fill="#fff" />
          <text x="22" y="40" fontSize="19" fontWeight="700" fill="#12315a" stroke="none" fontFamily="Inter">
            ₹
          </text>
        </symbol>

        <symbol
          id="basket"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M8 28h48l-6 28H14z" fill="#e8b36a" />
          <path d="M20 28l2 28M32 28v28M44 28l-2 28" />
          <circle cx="23" cy="19" r="8" fill="#f64932" />
          <path d="M33 28l7-15 8 15z" fill="#14a44d" />
          <circle cx="46" cy="17" r="5" fill="#ffb110" />
        </symbol>

        <symbol
          id="jar"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <rect x="13" y="22" width="38" height="36" rx="9" fill="#fbd5e6" />
          <rect x="11" y="9" width="42" height="14" rx="6" fill="#0075de" />
          <rect x="21" y="32" width="22" height="12" rx="3" fill="#fff" />
          <path d="M26 38h12" />
        </symbol>

        <symbol id="bangles" viewBox="0 0 64 64" fill="none" strokeWidth="7">
          <circle cx="23" cy="36" r="16" stroke="#f64932" />
          <circle cx="41" cy="36" r="16" stroke="#ffb110" />
          <circle cx="32" cy="24" r="16" stroke="#0075de" />
        </symbol>

        <symbol
          id="truck"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <rect x="3" y="14" width="36" height="30" rx="5" fill="#62aef0" />
          <path d="M39 23h12l10 11v10H39z" fill="#ffb110" />
          <path d="M10 24h20M10 31h12" />
          <circle cx="16" cy="48" r="6" fill="#fff" />
          <circle cx="49" cy="48" r="6" fill="#fff" />
        </symbol>

        <symbol
          id="bag"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <rect x="9" y="22" width="46" height="35" rx="7" fill="#e8f7ee" />
          <path d="M21 22v-4a11 11 0 0122 0v4" />
          <path d="M19 38l4 4 6-8M35 37h11M35 46h11" />
        </symbol>

        <symbol
          id="bell"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M32 8c-10 0-16 8-16 18v10l-6 8h44l-6-8V26c0-10-6-18-16-18z" fill="#ffb110" />
          <path d="M26 54a6 6 0 0012 0" />
          <circle cx="49" cy="12" r="6" fill="#f64932" />
        </symbol>

        <symbol
          id="chat"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <rect x="5" y="7" width="38" height="26" rx="8" fill="#e6f3fe" />
          <path d="M13 33l-2 11 12-11" />
          <rect x="22" y="30" width="37" height="25" rx="8" fill="#e8f7ee" />
          <path d="M31 42h19M31 48h12" />
        </symbol>

        <symbol
          id="shelf"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M5 26h54M5 50h54" />
          <rect x="10" y="10" width="12" height="16" fill="#62aef0" />
          <rect x="26" y="15" width="12" height="11" fill="#14a44d" />
          <rect x="12" y="34" width="14" height="16" fill="#fbd5e6" />
          <path d="M50 3l11 19H39z" fill="#f64932" />
        </symbol>

        <symbol
          id="stamp"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <rect x="13" y="6" width="38" height="28" rx="7" fill="#f64932" />
          <path d="M24 20l7 7 11-14" stroke="#fff" />
          <rect x="7" y="34" width="50" height="14" rx="4" fill="#e8f7ee" />
          <path d="M12 56h40" />
        </symbol>

        <symbol
          id="ledger"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M5 12h25v42H5zM34 12h25v42H34z" fill="#e6f3fe" />
          <path d="M11 23h13M11 32h13M40 23h13M40 32h13M40 43l5 5 9-11" />
          <path d="M14 12V5l5 4 5-4v7" fill="#f64932" />
        </symbol>

        <symbol
          id="scan"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <rect x="14" y="5" width="36" height="26" rx="7" fill="#0075de" />
          <path d="M22 13v10M28 13v10M34 13v10M40 13v10" stroke="#fff" strokeWidth="2.5" />
          <rect x="25" y="31" width="14" height="27" rx="6" fill="#62aef0" />
          <path d="M54 8l5-3M55 17h6" />
        </symbol>

        <symbol
          id="reg"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <rect x="7" y="28" width="50" height="26" rx="5" fill="#e6f3fe" />
          <rect x="13" y="8" width="38" height="20" rx="4" fill="#12315a" />
          <text x="32" y="24" textAnchor="middle" fontSize="15" fontWeight="700" fill="#ffb110" stroke="none" fontFamily="Inter">
            ₹
          </text>
          <path d="M14 40h14M38 40h12" />
        </symbol>

        <symbol
          id="tray"
          viewBox="0 0 64 64"
          fill="none"
          stroke="#12315a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path d="M7 22l25-13 25 13v25L32 60 7 47z" fill="#e8b36a" />
          <path d="M7 22l25 13 25-13M32 35v25" />
          <path d="M40 16l-17 9" strokeWidth="2" />
        </symbol>

        <symbol id="play" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" fill="#fff" />
        </symbol>
      </defs>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   NAVBAR                                   */
/* -------------------------------------------------------------------------- */

export function KoroNav() {
  return (
    <nav id="nav">
      <div className="w">
        <Link href="/" className="wm" aria-label="Koro">
          <i>K</i><i>o</i><i>r</i><i>o</i><b></b>
        </Link>
        <div className="l">
          <a href="#why">Why Koro</a>
          <a href="#what">What it does</a>
          <a href="#rush">Rush hour</a>
        </div>
        <Link href="/login" className="btn g">
          Log in
        </Link>
        <Link href="/signup" className="btn p">
          Create your shop
        </Link>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    HERO                                    */
/* -------------------------------------------------------------------------- */

export function KoroHero() {
  return (
    <header className="hero">
      <div className="w">
        <span className="pill">Voice assistant for local shops</span>
        <h1>
          Where did I keep it? <mark>Just ask</mark> Koro.
        </h1>
        <p className="sub">
          Koro remembers every product in your shop. Ask in Hindi, Hinglish or English to find an item, check stock, note
          a sale or plan tomorrow&apos;s restock.
        </p>
        <div className="cta">
          <Link href="/signup" className="btn p lg">
            Create your shop →
          </Link>
          <a href="#demo" className="btn t lg">
            Watch Koro work
          </a>
        </div>
        <p className="note">Works beside your existing billing. Start with just a few products.</p>

        <div className="float" style={{ left: "2%", top: "120px" }}>
          <svg>
            <use href="#pin" />
          </svg>
        </div>
        <div className="float" style={{ right: "3%", top: "150px", animationDelay: "-2s" }}>
          <svg>
            <use href="#tag" />
          </svg>
        </div>
        <div className="float" style={{ left: "7%", top: "330px", animationDelay: "-4s" }}>
          <svg>
            <use href="#bell" />
          </svg>
        </div>
        <div className="float" style={{ right: "8%", top: "360px", animationDelay: "-1s" }}>
          <svg>
            <use href="#chat" />
          </svg>
        </div>

        <div className="demo" id="demo">
          <div className="dc">
            <button aria-label="Play demo" type="button">
              <svg width="30" height="30">
                <use href="#play" />
              </svg>
            </button>
            <h3>Watch Koro work</h3>
            <p>Interactive demo coming here</p>
          </div>
          <div className="float" style={{ left: "-28px", bottom: "-30px", animationDelay: "-3s" }}>
            <svg>
              <use href="#basket" />
            </svg>
          </div>
          <div className="float" style={{ right: "-24px", top: "-36px", animationDelay: "-5s" }}>
            <svg>
              <use href="#scan" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  WHY KORO                                  */
/* -------------------------------------------------------------------------- */

export function KoroWhy() {
  return (
    <section id="why">
      <div className="w r">
        <div className="eb">Why Koro</div>
        <h2>Shops run on memory. Memory forgets.</h2>
        <p className="lead">
          Handwritten slips, a notebook, and whatever the owner remembers. Koro turns all of it into something you can
          simply ask.
        </p>
        <div className="three">
          <div className="card">
            <svg className="m">
              <use href="#ledger" />
            </svg>
            <span className="was">Stock lives in a notebook</span>
            <h3>Stop flipping through pages</h3>
            <div className="fix">Ask by voice. Koro already knows the answer.</div>
          </div>
          <div className="card">
            <svg className="m">
              <use href="#tray" />
            </svg>
            <span className="was">Items hide in drawers and boxes</span>
            <h3>Know exactly where it is</h3>
            <div className="fix">Koro names the shelf, drawer or box.</div>
          </div>
          <div className="card">
            <svg className="m">
              <use href="#shelf" />
            </svg>
            <span className="was">You learn it ran out when a customer asks</span>
            <h3>See it before it runs out</h3>
            <div className="fix">Low stock is flagged early, with a restock list ready.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                WHAT IT DOES                                */
/* -------------------------------------------------------------------------- */

export function KoroWhat() {
  return (
    <section id="what" style={{ paddingTop: 0 }}>
      <div className="w r">
        <div className="eb">What Koro does</div>
        <h2>One helper for every counter task.</h2>
        <div className="panel">
          <h3>
            Ask the way you talk. Get the answer, not a search page.
            <p>
              Say the item. Koro replies with the exact place and what is left, and you keep serving the customer.
            </p>
          </h3>
          <div className="win">
            <div className="dots">
              <i />
              <i />
              <i />
            </div>
            <div className="me">Where is Lakmé kajal?</div>
            <div className="ko">
              Found it. Next to the second drawer.
              <div className="res">
                <svg className="m">
                  <use href="#pin" />
                </svg>
                <div>
                  <b>Lakmé Eyconic Kajal</b>
                  <small>Next to the 2nd drawer</small>
                </div>
                <span className="ok">7 in stock</span>
              </div>
            </div>
            <div className="mic">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0014 0M12 18v3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="mini">
          <a href="#what">
            <svg className="m">
              <use href="#pin" />
            </svg>
            <b>Find by voice</b>
            <span>Say an item and hear exactly where it is kept.</span>
          </a>
          <a href="#what">
            <svg className="m">
              <use href="#shelf" />
            </svg>
            <b>Know what is left</b>
            <span>Ask for stock any time. Low items are flagged.</span>
          </a>
          <a href="#what">
            <svg className="m">
              <use href="#stamp" />
            </svg>
            <b>Read sales slips</b>
            <span>Photograph a slip and confirm before stock changes.</span>
          </a>
          <a href="#what">
            <svg className="m">
              <use href="#scan" />
            </svg>
            <b>Scan or type</b>
            <span>Barcode when there is one, a name when there is not.</span>
          </a>
          <a href="#what">
            <svg className="m">
              <use href="#tag" />
            </svg>
            <b>Price in a second</b>
            <span>Ask the price without opening the register.</span>
          </a>
          <a href="#what">
            <svg className="m">
              <use href="#reg" />
            </svg>
            <b>Today&apos;s sales</b>
            <span>Ask what sold today and how much came in.</span>
          </a>
          <a href="#what">
            <svg className="m">
              <use href="#truck" />
            </svg>
            <b>Restock on WhatsApp</b>
            <span>Build the purchase list and send it to your supplier.</span>
          </a>
          <a href="#what">
            <svg className="m">
              <use href="#bell" />
            </svg>
            <b>Gentle reminders</b>
            <span>A nudge before an item runs out, not after.</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  RUSH HOUR                                 */
/* -------------------------------------------------------------------------- */

export function KoroRush() {
  return (
    <section id="rush" style={{ paddingTop: 0 }}>
      <div className="w r">
        <div className="rush">
          <div>
            <div className="eb">Built for rush hour</div>
            <h2>When the shop is full, Koro keeps up.</h2>
            <p className="lead">
              No typing, no scrolling. Talk the way you talk at the counter, in Hindi, Hinglish or English, and keep your
              hands on the customer.
            </p>
          </div>
          <div className="chat">
            <div className="a">Bhaiya, Parle-G 250g kitna bacha hai?</div>
            <div className="b">12 packets left. Shelf B3, bottom row.</div>
            <div className="a">Aur chahiye, restock list bhej do.</div>
            <div className="b">Done. The list is ready for WhatsApp.</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                               CLOSING SECTION                              */
/* -------------------------------------------------------------------------- */

export function KoroClosing() {
  return (
    <section className="cl" style={{ paddingTop: 0 }}>
      <div className="w r">
        <div className="row">
          <svg className="m">
            <use href="#basket" />
          </svg>
          <svg className="m">
            <use href="#jar" />
          </svg>
          <svg className="m">
            <use href="#bangles" />
          </svg>
          <svg className="m">
            <use href="#bag" />
          </svg>
        </div>
        <h2>Start with what you already know.</h2>
        <p className="lead">Add a few products today. Koro learns the rest as you go.</p>
        <div className="cta">
          <Link href="/signup" className="btn p lg">
            Create your shop →
          </Link>
          <Link href="/login" className="btn t lg">
            Log in
          </Link>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   FOOTER                                   */
/* -------------------------------------------------------------------------- */

export function KoroFooter() {
  return (
    <footer>
      <div className="w">
        <Link href="/" className="wm" aria-label="Koro">
          <i>K</i><i>o</i><i>r</i><i>o</i><b></b>
        </Link>
        <span>A helpful hand at the shop counter.</span>
        <a href="#what">What it does</a>
        <a href="#demo">Demo</a>
        <Link href="/login">Log in</Link>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*                              EMBEDDED STYLES                               */
/* -------------------------------------------------------------------------- */

export function KoroStyles() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&family=Inter:wght@400;500;600;700&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --paper: #f6f5f4;
          --ink: #111;
          --mut: #615d59;
          --line: rgba(0,0,0,.08);
          --blue: #0075de;
          --tint: #e6f3fe;
          --gold: #ffb110;
          --coral: #f64932;
          --sky: #62aef0;
          --night: #02093a;
          --green: #14a44d;
          --navy: #12315a;
        }

        .koro-page {
          background: var(--paper);
          color: var(--ink);
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 17px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
          width: 100%;
        }

        .koro-page * {
          box-sizing: border-box;
          margin: 0;
        }

        .koro-page a {
          color: inherit;
          text-decoration: none;
        }

        .koro-page .w {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .koro-page svg.m {
          width: 64px;
          height: 64px;
          flex: none;
        }

        /* wordmark: Baloo 2, letters blur in, then bounce on hover */
        .koro-page .wm {
          font: 800 30px/1 'Baloo 2', 'Inter', sans-serif;
          letter-spacing: -.01em;
          display: inline-flex;
          align-items: baseline;
        }

        .koro-page .wm i {
          font-style: normal;
          display: inline-block;
          animation: koro-blur .9s cubic-bezier(.2,.7,.2,1) both;
          transition: transform .25s;
        }

        .koro-page .wm i:nth-child(2) { animation-delay: .12s; }
        .koro-page .wm i:nth-child(3) { animation-delay: .24s; }
        .koro-page .wm i:nth-child(4) { animation-delay: .36s; }

        .koro-page .wm:hover i { transform: translateY(-4px); }
        .koro-page .wm:hover i:nth-child(even) { transform: translateY(2px); }

        .koro-page .wm b {
          width: .2em;
          height: .2em;
          border-radius: 50%;
          background: var(--gold);
          margin-left: .06em;
          animation: koro-pop .6s .7s both;
        }

        @keyframes koro-blur {
          from { filter: blur(10px); opacity: 0; transform: translateY(8px) scale(1.15); }
        }

        @keyframes koro-pop {
          from { transform: scale(0); }
        }

        .koro-page nav {
          position: sticky;
          top: 0;
          z-index: 99;
          background: rgba(246,245,244,.78);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid transparent;
          transition: border-color .2s;
        }

        .koro-page nav.s {
          border-color: var(--line);
        }

        .koro-page nav .w {
          display: flex;
          align-items: center;
          gap: 32px;
          height: 68px;
        }

        .koro-page nav .l {
          display: flex;
          gap: 24px;
          font-size: 15px;
          color: var(--mut);
          margin-right: auto;
        }

        .koro-page nav .l a:hover {
          color: var(--ink);
        }

        .koro-page .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
          transition: transform .15s, background .15s;
          cursor: pointer;
        }

        .koro-page .btn:hover {
          transform: translateY(-1px);
        }

        .koro-page .p {
          background: var(--blue);
          color: #fff;
        }

        .koro-page .p:hover {
          background: #005db2;
        }

        .koro-page .t {
          background: var(--tint);
          color: var(--blue);
        }

        .koro-page .t:hover {
          background: #d4eafd;
        }

        .koro-page .g {
          color: var(--ink);
        }

        .koro-page .lg {
          min-height: 52px;
          padding: 0 26px;
          font-size: 16px;
        }

        /* hero */
        .koro-page .hero {
          text-align: center;
          padding: 72px 0 40px;
          position: relative;
          overflow: hidden;
        }

        .koro-page .hero:before {
          content: "";
          position: absolute;
          left: 50%;
          top: -120px;
          width: 760px;
          height: 420px;
          transform: translateX(-50%);
          background: radial-gradient(closest-side, rgba(98,174,240,.35), transparent);
          filter: blur(30px);
          z-index: 0;
          pointer-events: none;
        }

        .koro-page .hero > .w {
          position: relative;
          z-index: 1;
        }

        .koro-page .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--blue);
          background: var(--tint);
          padding: 6px 14px;
          border-radius: 99px;
        }

        .koro-page .pill:before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--blue);
          animation: koro-pulse 1.6s infinite;
        }

        @keyframes koro-pulse {
          50% { opacity: .3; }
        }

        .koro-page h1 {
          font: 700 clamp(40px, 7vw, 84px)/1.02 'Inter', sans-serif;
          letter-spacing: -.045em;
          margin: 22px auto 20px;
          max-width: 900px;
        }

        .koro-page mark {
          background: var(--gold);
          color: #000;
          padding: 0 .18em;
          border-radius: 99px;
          display: inline-block;
          transform: rotate(-1.5deg);
          background-size: 0;
          animation: koro-sweep .8s .5s both;
        }

        @keyframes koro-sweep {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0); }
        }

        .koro-page .sub {
          font-size: 20px;
          color: var(--mut);
          max-width: 640px;
          margin: 0 auto 30px;
        }

        .koro-page .cta {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .koro-page .note {
          font-size: 14px;
          color: var(--mut);
          margin-top: 18px;
        }

        .koro-page .float {
          position: absolute;
          animation: koro-fl 6s ease-in-out infinite;
        }

        .koro-page .float svg {
          width: 84px;
          height: 84px;
          filter: drop-shadow(0 10px 14px rgba(0,0,0,.1));
        }

        @keyframes koro-fl {
          50% { transform: translateY(-14px) rotate(4deg); }
        }

        .koro-page .demo {
          margin-top: 48px;
          position: relative;
        }

        .koro-page .dc {
          background: linear-gradient(#fff, #f0f7fe);
          border: 1px solid var(--line);
          border-radius: 12px;
          height: min(46vw, 420px);
          display: grid;
          place-content: center;
          justify-items: center;
          gap: 8px;
          box-shadow: 0 30px 60px -20px rgba(0,60,120,.18);
        }

        .koro-page .dc button {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--blue);
          display: grid;
          place-items: center;
          border: 0;
          cursor: pointer;
          margin-bottom: 8px;
          transition: transform .2s;
        }

        .koro-page .dc button:hover {
          transform: scale(1.08);
        }

        .koro-page .dc h3 {
          font-size: 24px;
          letter-spacing: -.02em;
        }

        .koro-page .dc p {
          color: var(--mut);
          font-size: 15px;
        }

        .koro-page .demo .float {
          z-index: 2;
        }

        /* sections */
        .koro-page section {
          padding: 96px 0;
        }

        .koro-page .eb {
          font-size: 14px;
          font-weight: 600;
          color: var(--blue);
          margin-bottom: 12px;
        }

        .koro-page h2 {
          font: 700 clamp(32px, 4.4vw, 52px)/1.08 'Inter', sans-serif;
          letter-spacing: -.04em;
          max-width: 760px;
        }

        .koro-page .lead {
          color: var(--mut);
          font-size: 19px;
          max-width: 620px;
          margin-top: 16px;
        }

        .koro-page .three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 48px;
        }

        .koro-page .card {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 28px;
          transition: transform .2s;
        }

        .koro-page .card:hover {
          transform: translateY(-4px);
        }

        .koro-page .card svg.m {
          width: 72px;
          height: 72px;
          margin-bottom: 20px;
        }

        .koro-page .card .was {
          color: var(--mut);
          text-decoration: line-through;
          text-decoration-color: var(--coral);
          font-size: 15px;
        }

        .koro-page .card h3 {
          font-size: 22px;
          letter-spacing: -.02em;
          margin: 6px 0 10px;
          line-height: 1.25;
        }

        .koro-page .card .fix {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          font-size: 15px;
          color: var(--ink);
          background: var(--tint);
          border-radius: 8px;
          padding: 12px 14px;
        }

        .koro-page .card .fix:before {
          content: "✓";
          color: var(--blue);
          font-weight: 700;
        }

        /* feature panel */
        .koro-page .panel {
          margin-top: 48px;
          border-radius: 12px;
          background: var(--gold);
          padding: 56px 40px 0;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 40px;
          align-items: end;
          overflow: hidden;
        }

        .koro-page .panel h3 {
          font: 700 34px/1.1 'Inter', sans-serif;
          letter-spacing: -.035em;
          align-self: center;
          padding-bottom: 56px;
        }

        .koro-page .panel p {
          margin-top: 12px;
          font-size: 17px;
          color: rgba(0,0,0,.72);
          font-weight: 400;
          letter-spacing: 0;
        }

        .koro-page .win {
          background: #fff;
          border-radius: 12px 12px 0 0;
          border: 1px solid var(--line);
          border-bottom: 0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .koro-page .dots {
          display: flex;
          gap: 6px;
        }

        .koro-page .dots i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e3e2e1;
        }

        .koro-page .me,
        .koro-page .ko {
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 15px;
          max-width: 85%;
        }

        .koro-page .me {
          align-self: flex-end;
          background: var(--tint);
        }

        .koro-page .ko {
          background: var(--paper);
          border: 1px solid var(--line);
        }

        .koro-page .res {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px;
          margin-top: 8px;
        }

        .koro-page .res svg.m {
          width: 52px;
          height: 52px;
        }

        .koro-page .res b {
          display: block;
          font-size: 16px;
        }

        .koro-page .res small {
          color: var(--mut);
        }

        .koro-page .ok {
          margin-left: auto;
          font-size: 13px;
          font-weight: 600;
          color: var(--green);
          background: #e8f7ee;
          border-radius: 99px;
          padding: 3px 10px;
          white-space: nowrap;
        }

        .koro-page .mic {
          align-self: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--blue);
          display: grid;
          place-items: center;
          box-shadow: 0 0 0 3px #fff, 0 0 0 5px var(--blue);
          animation: koro-ring 2s infinite;
          margin: 6px 0 20px;
        }

        @keyframes koro-ring {
          50% { box-shadow: 0 0 0 3px #fff, 0 0 0 11px rgba(0,117,222,.25); }
        }

        .koro-page .mini {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-top: 20px;
        }

        .koro-page .mini a {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 20px;
          display: block;
          transition: transform .2s, border-color .2s;
        }

        .koro-page .mini a:hover {
          transform: translateY(-3px);
          border-color: var(--blue);
        }

        .koro-page .mini svg.m {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
        }

        .koro-page .mini b {
          display: block;
          font-size: 16px;
          letter-spacing: -.01em;
          line-height: 1.3;
        }

        .koro-page .mini span {
          font-size: 14px;
          color: var(--mut);
          line-height: 1.5;
          display: block;
          margin-top: 4px;
        }

        /* rush hour */
        .koro-page .rush {
          background: var(--night);
          color: #fff;
          border-radius: 12px;
          padding: 56px 48px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .koro-page .rush h2 {
          color: #fff;
        }

        .koro-page .rush p.lead {
          color: rgba(255,255,255,.72);
        }

        .koro-page .rush .eb {
          color: var(--sky);
        }

        .koro-page .chat {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .koro-page .chat div {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 16px;
          max-width: 88%;
        }

        .koro-page .chat .a {
          background: rgba(255,255,255,.1);
          align-self: flex-start;
        }

        .koro-page .chat .b {
          background: var(--blue);
          align-self: flex-end;
        }

        .koro-page .cl {
          text-align: center;
          padding: 96px 0 112px;
        }

        .koro-page .cl .row {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 24px;
        }

        .koro-page .cl .row svg.m {
          width: 76px;
          height: 76px;
          animation: koro-fl 5s ease-in-out infinite;
        }

        .koro-page .cl .row svg:nth-child(2) { animation-delay: -1.2s; }
        .koro-page .cl .row svg:nth-child(3) { animation-delay: -2.4s; }
        .koro-page .cl .row svg:nth-child(4) { animation-delay: -3.6s; }

        .koro-page .cl h2 {
          margin: 0 auto;
        }

        .koro-page .cl .lead {
          margin: 16px auto 32px;
        }

        .koro-page footer {
          border-top: 1px solid var(--line);
          padding: 36px 0;
          font-size: 14px;
          color: var(--mut);
        }

        .koro-page footer .w {
          display: flex;
          gap: 24px;
          align-items: center;
          flex-wrap: wrap;
        }

        .koro-page footer .wm {
          font-size: 24px;
          color: var(--ink);
        }

        .koro-page footer span {
          margin-right: auto;
        }

        .koro-page footer a:hover {
          color: var(--ink);
        }

        .koro-page .r {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity .7s, transform .7s;
        }

        .koro-page .r.v {
          opacity: 1;
          transform: none;
        }

        @media (max-width: 900px) {
          .koro-page nav .l { display: none; }
          .koro-page nav .w { justify-content: space-between; }
          .koro-page .three,
          .koro-page .rush,
          .koro-page .panel { grid-template-columns: 1fr; }
          .koro-page .mini { grid-template-columns: 1fr 1fr; }
          .koro-page .panel { padding: 36px 20px 0; }
          .koro-page .panel h3 { padding-bottom: 0; }
          .koro-page .rush { padding: 36px 24px; }
          .koro-page .float { display: none; }
          .koro-page .hero { padding-top: 48px; }
          .koro-page section { padding: 64px 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .koro-page * { animation: none !important; transition: none !important; }
          .koro-page .r { opacity: 1; transform: none; }
        }
      `}} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MAIN LANDING PAGE                            */
/* -------------------------------------------------------------------------- */

export function KoroLandingPage() {
  useEffect(() => {
    // Scroll event listener for navbar border
    const handleScroll = () => {
      const nav = document.getElementById("nav");
      if (nav) {
        nav.classList.toggle("s", window.scrollY > 8);
      }
    };
    window.addEventListener("scroll", handleScroll);

    // IntersectionObserver for reveal animation on .r elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("v");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const revealElements = document.querySelectorAll(".r");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="koro-page">
      <KoroStyles />
      <KoroSvgDefs />
      <KoroNav />
      <main>
        <KoroHero />
        <KoroWhy />
        <KoroWhat />
        <KoroRush />
        <KoroClosing />
      </main>
      <KoroFooter />
    </div>
  );
}

export default KoroLandingPage;

/* -------------------------------------------------------------------------- */
/*                        BACKWARD-COMPATIBLE EXPORTS                         */
/* -------------------------------------------------------------------------- */

export {
  KoroHero as LandingHero,
  KoroHero as LandingDemo,
  KoroWhy as LandingBeforeAfter,
  KoroWhy as LandingWhy,
  KoroRush as LandingRush,
  KoroClosing as LandingCta,
  KoroFooter as LandingFooter,
  KoroNav as HeroNavbar,
};
