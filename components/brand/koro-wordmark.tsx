import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface KoroWordmarkProps {
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional link destination. If provided, renders as Next.js Link */
  href?: string;
  /** Additional CSS class names */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
}

export function KoroWordmark({
  size = "lg",
  href,
  className,
  onClick,
}: KoroWordmarkProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-[30px]",
    xl: "text-4xl sm:text-5xl",
  }[size];

  const content = (
    <>
      <i>K</i><i>o</i><i>r</i><i>o</i><b></b>
    </>
  );

  const sharedClassName = cn("koro-wm wm", sizeClasses, className);

  const styleBlock = (
    <style dangerouslySetInnerHTML={{
      __html: `
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@800&display=swap');

        .koro-wm {
          font-family: 'Baloo 2', 'Inter', system-ui, sans-serif;
          font-weight: 800;
          letter-spacing: -0.01em;
          display: inline-flex;
          align-items: baseline;
          text-decoration: none;
          color: inherit;
          line-height: 1;
        }

        .koro-wm i {
          font-style: normal;
          display: inline-block;
          animation: koro-wm-blur 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) both;
          transition: transform 0.25s ease;
        }

        .koro-wm i:nth-child(2) { animation-delay: 0.12s; }
        .koro-wm i:nth-child(3) { animation-delay: 0.24s; }
        .koro-wm i:nth-child(4) { animation-delay: 0.36s; }

        .koro-wm:hover i { transform: translateY(-4px); }
        .koro-wm:hover i:nth-child(even) { transform: translateY(2px); }

        .koro-wm b {
          width: 0.2em;
          height: 0.2em;
          border-radius: 50%;
          background: #ffb110;
          margin-left: 0.06em;
          animation: koro-wm-pop 0.6s 0.7s both;
          display: inline-block;
        }

        @keyframes koro-wm-blur {
          from {
            filter: blur(10px);
            opacity: 0;
            transform: translateY(8px) scale(1.15);
          }
        }

        @keyframes koro-wm-pop {
          from {
            transform: scale(0);
          }
        }
      `
    }} />
  );

  if (href) {
    return (
      <>
        {styleBlock}
        <Link href={href} className={sharedClassName} aria-label="Koro" onClick={onClick}>
          {content}
        </Link>
      </>
    );
  }

  return (
    <>
      {styleBlock}
      <span className={sharedClassName} aria-label="Koro" onClick={onClick}>
        {content}
      </span>
    </>
  );
}

export default KoroWordmark;
