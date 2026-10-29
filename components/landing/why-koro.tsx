"use client";

import React, { useState, useEffect, useRef } from "react";
import { MicAudioPlayer } from "@/components/landing/mic-audio-player";

// Hanging string of festive lights coordinates (15 segments across 1072px width)
const LIGHTS_WIRE_PATH =
  "M0 19.03 Q35.73 36.49 71.47 25.95 Q107.20 35.39 142.93 16.84 Q178.67 31.99 214.4 19.14 Q250.13 36.54 285.87 25.94 Q321.60 35.33 357.33 16.72 Q393.06 31.99 428.8 19.26 Q464.53 36.59 500.27 25.93 Q536.00 35.26 571.73 16.59 Q607.47 31.98 643.2 19.36 Q678.93 36.63 714.67 25.91 Q750.40 35.19 786.13 16.47 Q821.87 31.97 857.6 19.47 Q893.34 36.69 929.07 25.9 Q964.80 35.13 1000.53 16.35 Q1036.26 31.96 1072 19.58";

const BULB_POINTS = [
  [71.47, 25.95],
  [142.93, 16.84],
  [214.4, 19.14],
  [285.87, 25.94],
  [357.33, 16.72],
  [428.8, 19.26],
  [500.27, 25.93],
  [571.73, 16.59],
  [643.2, 19.36],
  [714.67, 25.91],
  [786.13, 16.47],
  [857.6, 19.47],
  [929.07, 25.9],
  [1000.53, 16.35],
];

export function KoroWhy() {
  const [sceneIn, setSceneIn] = useState(false);
  const [litBulbs, setLitBulbs] = useState<number[]>([]);

  const sceneRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to animate hanging bulbs sequentially
  useEffect(() => {
    const isReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReducedMotion || !("IntersectionObserver" in window)) {
      const timer = setTimeout(() => {
        setSceneIn(true);
        setLitBulbs(BULB_POINTS.map((_, idx) => idx));
      }, 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSceneIn(true);
          BULB_POINTS.forEach((_, idx) => {
            setTimeout(() => {
              setLitBulbs((prev) => [...prev, idx]);
            }, idx * 90);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sceneRef.current) {
      observer.observe(sceneRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="why" className="koro-why-wrap" aria-labelledby="why-h">
      <style>{`
        .koro-why-wrap {
          --paper: #F6F5F4;
          --ink: #111;
          --muted: #5E5B57;
          --line: #E6E3DF;
          --blue: #0075DE;
          --mari: #FFB110;
          --navy: #14284B;
          background: var(--paper);
          color: var(--ink);
          font-family: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          padding: 72px 0 80px;
          position: relative;
          overflow: hidden;
        }

        .koro-why-wrap::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 150px;
          width: 900px;
          height: 420px;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at center, rgba(255,177,16,.16), rgba(0,117,222,.06) 55%, transparent 72%);
          pointer-events: none;
        }

        .koro-why-wrap .w {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
        }

        .koro-why-wrap .eb {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--blue);
          font-weight: 600;
          font-size: 15px;
          margin-bottom: 10px;
        }

        .koro-why-wrap .eb i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--blue);
        }

        .koro-why-wrap h2 {
          font-weight: 800;
          font-size: clamp(34px, 5.2vw, 58px);
          line-height: 1.03;
          letter-spacing: -.045em;
          max-width: 17ch;
        }

        .koro-why-wrap .lead {
          margin-top: 12px;
          color: var(--muted);
          font-size: clamp(16px, 1.8vw, 19px);
          line-height: 1.5;
        }

        /* one shop counter, three moments */
        .koro-why-wrap .scene {
          position: relative;
          margin-top: 40px;
          padding-top: 70px;
        }

        .koro-why-wrap .lights {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: auto;
          display: block;
          overflow: visible;
        }

        .koro-why-wrap .lights path {
          fill: none;
          stroke: var(--navy);
          stroke-width: 2.5;
          stroke-linecap: round;
        }

        .koro-why-wrap .bulb circle {
          fill: #E9E1CC;
          stroke: var(--navy);
          stroke-width: 2.5;
          transition: fill .25s, filter .25s;
        }

        .koro-why-wrap .bulb rect {
          fill: var(--navy);
        }

        .koro-why-wrap .bulb.lit circle {
          fill: var(--mari);
          filter: drop-shadow(0 0 7px rgba(255,177,16,.9));
        }

        .koro-why-wrap .st {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .koro-why-wrap .stations {
          position: relative;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0 44px;
        }

        .koro-why-wrap .slab {
          position: absolute;
          left: -12px;
          right: -12px;
          top: 244px;
          height: 12px;
          border-radius: 6px;
          background: var(--navy);
          box-shadow: 0 14px 24px -10px rgba(20,40,75,.35);
        }

        .koro-why-wrap .say {
          position: relative;
          height: 42px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          padding: 0 16px 0 12px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 8px 20px -12px rgba(40,30,10,.35);
          white-space: nowrap;
        }

        .koro-why-wrap .say::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -6px;
          width: 12px;
          height: 12px;
          background: #fff;
          border: solid var(--line);
          border-width: 0 1px 1px 0;
          transform: translateX(-50%) rotate(45deg);
        }

        .koro-why-wrap .say svg {
          flex: none;
        }

        .koro-why-wrap .art {
          width: 100%;
          max-width: 250px;
          height: auto;
          display: block;
          position: relative;
          z-index: 1;
        }

        .koro-why-wrap h3 {
          margin-top: 34px;
          min-height: 58px;
          font-weight: 800;
          font-size: clamp(22px, 2.3vw, 26px);
          line-height: 1.12;
          letter-spacing: -.035em;
          max-width: 13ch;
        }

        .koro-why-wrap .act {
          margin-top: 14px;
          min-height: 52px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .koro-why-wrap .act .mic {
          margin: 0;
        }

        .koro-why-wrap .glow {
          opacity: 0;
          transition: opacity .8s 1.1s;
        }

        .koro-why-wrap .scene.in .glow {
          opacity: 1;
        }

        @media (max-width: 760px) {
          .koro-why-wrap {
            padding: 52px 0 60px;
          }
          .koro-why-wrap .w {
            padding: 0 18px;
          }
          .koro-why-wrap .scene {
            margin-top: 28px;
            padding-top: 44px;
          }
          .koro-why-wrap .stations {
            grid-template-columns: 1fr;
            gap: 34px;
          }
          .koro-why-wrap .slab {
            display: none;
          }
          .koro-why-wrap .st {
            display: grid;
            grid-template-columns: 132px 1fr;
            grid-template-areas: "art say" "art h" "art act";
            column-gap: 16px;
            align-items: center;
            justify-items: start;
            text-align: left;
          }
          .koro-why-wrap .art {
            grid-area: art;
            max-width: 132px;
          }
          .koro-why-wrap .say {
            grid-area: say;
            margin: 0 0 8px;
            font-size: 12px;
            height: 38px;
          }
          .koro-why-wrap .say::after {
            left: 22px;
          }
          .koro-why-wrap h3 {
            grid-area: h;
            margin: 0;
            min-height: 0;
            max-width: none;
            font-size: 18px;
          }
          .koro-why-wrap .act {
            grid-area: act;
            margin-top: 10px;
            justify-content: flex-start;
          }
      }

      }

        @media (prefers-reduced-motion: reduce) {
          .koro-why-wrap .bulb circle,
          .koro-why-wrap .glow {
            transition: none !important;
          }
          .koro-why-wrap .glow {
            opacity: 1 !important;
          }
        }
      `}</style>

      <div className="w">
        <div className="eb">
          <i />
          Why Koro
        </div>
        <h2 id="why-h">Shops run on memory. Memory forgets.</h2>
        <p className="lead">Koro turns it all into something you can simply ask.</p>

        <div className={`scene ${sceneIn ? "in" : ""}`} id="scene" ref={sceneRef}>
          {/* Hanging string of festive lights */}
          <svg className="lights" id="lights" viewBox="0 0 1072 56" aria-hidden="true">
            <path d={LIGHTS_WIRE_PATH} />
            {BULB_POINTS.map((pt, idx) => (
              <g
                key={idx}
                className={`bulb ${litBulbs.includes(idx) ? "lit" : ""}`}
              >
                <rect
                  x={pt[0] - 3}
                  y={pt[1] - 1}
                  width="6"
                  height="7"
                  rx="1.5"
                />
                <circle cx={pt[0]} cy={pt[1] + 13} r="7.5" />
              </g>
            ))}
          </svg>

          <div className="stations">
            <div className="slab" aria-hidden="true" />

            {/* Diwali */}
            <div className="st">
              <div className="say">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0075DE"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                >
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
                “Diwali ke liye kya laayein?”
              </div>
              <svg
                className="art"
                viewBox="0 0 240 200"
                fill="none"
                stroke="#14284B"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                role="img"
                aria-label="Festive lantern, gift box and diya"
              >
                <defs>
                  <radialGradient id="koro-festive-gl">
                    <stop offset="0" stopColor="#FFB110" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#FFB110" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle
                  className="glow"
                  cx="120"
                  cy="100"
                  r="84"
                  fill="url(#koro-festive-gl)"
                  stroke="none"
                />
                <circle cx="120" cy="28" r="6" />
                <path d="M120 34v8" />
                <rect x="100" y="42" width="40" height="10" rx="3" fill="#14284B" />
                <path
                  d="M100 52h40q18 48 0 96h-40q-18-48 0-96z"
                  fill="#FFB110"
                />
                <path d="M112 52q-9 48 0 96M128 52q9 48 0 96" />
                <rect x="102" y="148" width="36" height="10" rx="3" fill="#14284B" />
                <path d="M120 158v22M104 186h32" />
                <rect x="158" y="148" width="54" height="40" rx="4" fill="#F0553A" />
                <path d="M158 164h54" />
                <rect x="178" y="148" width="14" height="40" fill="#FFB110" />
                <path d="M185 148c-14-14-24 0-8 0M185 148c14-14 24 0 8 0" />
                <path d="M24 170q24 24 48 0z" fill="#FFB110" />
                <path d="M48 142q-10 12 0 22q10-10 0-22z" fill="#F0553A" />
              </svg>
              <h3>Know what sells this Diwali</h3>
              <div className="act">
                <MicAudioPlayer
                  audioSrc="/media/trend.mp3"
                  label="Hear Koro"
                  mobileLabel="Tap to listen"
                />
              </div>
            </div>

            {/* Where is it */}
            <div className="st">
              <div className="say">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0075DE"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                >
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
                “Lakmé Kajal kahan hai?”
              </div>
              <svg
                className="art"
                viewBox="0 0 240 200"
                fill="none"
                stroke="#14284B"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                role="img"
                aria-label="Cabinet with the second drawer pulled out, pin above it"
              >
                <rect x="34" y="46" width="150" height="140" rx="8" fill="#fff" />
                <rect x="46" y="58" width="126" height="30" rx="5" fill="#E6F2FD" />
                <rect
                  x="84"
                  y="68"
                  width="50"
                  height="7"
                  rx="3.5"
                  fill="#14284B"
                  stroke="none"
                />
                <rect x="46" y="146" width="126" height="30" rx="5" fill="#E6F2FD" />
                <rect
                  x="84"
                  y="156"
                  width="50"
                  height="7"
                  rx="3.5"
                  fill="#14284B"
                  stroke="none"
                />
                <rect x="40" y="96" width="156" height="42" rx="6" fill="#FFB110" />
                <rect
                  x="92"
                  y="114"
                  width="52"
                  height="8"
                  rx="4"
                  fill="#14284B"
                  stroke="none"
                />
                <rect
                  x="58"
                  y="84"
                  width="9"
                  height="22"
                  rx="4"
                  fill="#14284B"
                  stroke="none"
                />
                <rect
                  x="74"
                  y="84"
                  width="9"
                  height="22"
                  rx="4"
                  fill="#14284B"
                  stroke="none"
                />
                <rect
                  x="160"
                  y="84"
                  width="9"
                  height="22"
                  rx="4"
                  fill="#14284B"
                  stroke="none"
                />
                <path
                  d="M118 6c-10 0-17 7-17 16 0 11 17 26 17 26s17-15 17-26c0-9-7-16-17-16z"
                  fill="#F0553A"
                />
                <circle cx="118" cy="22" r="6" fill="#fff" />
                <circle cx="208" cy="118" r="17" fill="#0075DE" />
                <text
                  x="208"
                  y="125"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize="20"
                  fontWeight="800"
                  fill="#fff"
                  stroke="none"
                >
                  7
                </text>
              </svg>
              <h3 className="headings">Know exactly where it is</h3>
              <div className="act">
                <MicAudioPlayer
                  audioSrc="/media/relocation.mp3"
                  label="Hear Koro"
                  mobileLabel="Tap to listen"
                />
              </div>
            </div>

            {/* Runs out */}
            <div className="st">
              <div className="say">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0075DE"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                >
                  <rect x="9" y="3" width="6" height="12" rx="3" />
                  <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
                </svg>
                “Kya khatam hone wala hai?”
              </div>
              <svg
                className="art"
                viewBox="0 0 240 200"
                fill="none"
                stroke="#14284B"
                strokeWidth="4"
                strokeLinejoin="round"
                strokeLinecap="round"
                role="img"
                aria-label="Shelf with an empty slot, warning sign and WhatsApp bubble"
              >
                <path d="M22 126h196" />
                <rect x="34" y="72" width="42" height="54" fill="#0075DE" />
                <rect x="84" y="90" width="36" height="36" fill="#14A44D" />
                <rect
                  x="130"
                  y="86"
                  width="46"
                  height="40"
                  rx="3"
                  strokeDasharray="7 7"
                  strokeWidth="3"
                />
                <path d="M153 34l17 30h-34z" fill="#F0553A" />
                <path d="M153 44v10" stroke="#fff" />
                <circle cx="153" cy="59" r="1" fill="#fff" stroke="#fff" />
                <rect x="36" y="150" width="38" height="40" rx="4" fill="#FBC9DA" />
                <rect x="82" y="164" width="30" height="26" rx="3" fill="#FFB110" />
                <circle cx="188" cy="152" r="26" fill="#25D366" />
                <path
                  d="M188 138a14 14 0 1 0 0 28c2 0 4-.4 6-1l6 2-2-6a14 14 0 0 0-10-23z"
                  fill="#fff"
                  stroke="none"
                />
                <path d="M183 148q1 6 7 9" stroke="#25D366" strokeWidth="3" />
                <path d="M22 192h196" />
              </svg>
              <h3>See it before it runs out</h3>
              <div className="act">
                <MicAudioPlayer
                  audioSrc="/media/wholesale.mp3"
                  label="Hear Koro"
                  mobileLabel="Tap to listen"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
