// src/components/ui/CustomDetailButton.tsx
'use client';

import Link from 'next/link';
import styled from 'styled-components';
import React from 'react';

interface CustomDetailButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const CustomDetailButton: React.FC<CustomDetailButtonProps> = ({ href, children, className }) => {
  return (
    <StyledWrapper className={className}>
      <Link href={href} className="btn-23">
        <span className="text">{children}</span>
        <span aria-hidden className="marquee">{children}</span>
      </Link>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: inline-block; /* Allows the button to be sized by its content or explicit width */

  .btn-23,
  .btn-23 *,
  .btn-23 :after,
  .btn-23 :before,
  .btn-23:after,
  .btn-23:before {
    border: 0 solid;
    box-sizing: border-box;
  }

  .btn-23 {
    -webkit-tap-highlight-color: transparent;
    -webkit-appearance: button;
    background-color: hsl(var(--primary)); 
    background-image: none;
    color: hsl(var(--primary-foreground));
    cursor: pointer;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif,
      Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
    font-size: 0.75rem; /* 12px (Adjusted from 0.875rem) */
    font-weight: 700; /* Adjusted from 900 for less harshness */
    line-height: 1.25rem; /* 20px (Standard for text-sm Tailwind) */
    margin: 0;
    -webkit-mask-image: -webkit-radial-gradient(#000, #fff);
    padding: 0.5rem 1.2rem; /* py-2 (8px), px-4/5. Total height with line-height ~36px */
    text-transform: uppercase;
    min-width: 100px; /* Reduced min-width */
    height: 36px; /* Explicit height to match size="sm" buttons */
    display: inline-flex; /* Added for centering content with flex properties */
    align-items: center; /* Center content vertically */
    justify-content: center; /* Center content horizontally */
  }

  .btn-23:disabled {
    cursor: default;
    opacity: 0.7; /* Shadcn disabled opacity */
  }

  .btn-23:-moz-focusring {
    outline: auto;
  }

  .btn-23 svg {
    display: block;
    vertical-align: middle;
  }

  .btn-23 [hidden] {
    display: none;
  }

  .btn-23 {
    border-radius: 0.375rem; /* rounded-md (6px) */
    border-width: 1px; /* Changed from 2px to 1px to match Shadcn button borders better */
    border-color: transparent;
    overflow: hidden;
    position: relative;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* Subtle shadow */
  }

  .btn-23 span { /* Shared style for .text and .marquee */
    display: grid;
    inset: 0;
    place-items: center;
    position: absolute;
    transition: opacity 0.2s ease;
    white-space: nowrap; /* Prevent text wrapping */
  }

  .btn-23 .marquee {
    --spacing: 7em; /* Adjusted from 10em */
    --start: 0em;
    --end: 7em; /* Adjusted from 10em */
    -webkit-animation: marquee 1.2s linear infinite; /* Faster marquee */
    animation: marquee 1.2s linear infinite;
    -webkit-animation-play-state: paused;
    animation-play-state: paused;
    opacity: 0;
    position: relative; /* Keep it relative for the text-shadow trick */
    /* Adjusted text shadow for better readability of marquee */
    text-shadow: 
      hsl(var(--primary-foreground)) var(--spacing) 0, 
      hsl(var(--primary-foreground)) calc(var(--spacing) * -1) 0,
      hsl(var(--primary-foreground)) calc(var(--spacing) * -2) 0;
  }

  .btn-23:hover {
    background-color: hsl(var(--primary) / 0.9); /* Shadcn primary hover */
  }

  .btn-23:hover .marquee {
    -webkit-animation-play-state: running;
    animation-play-state: running;
    opacity: 1;
  }

  .btn-23:hover .text {
    opacity: 0;
  }
  
  .btn-23:active {
    transform: scale(0.98); /* Shadcn active scale */
  }


  @-webkit-keyframes marquee {
    0% {
      transform: translateX(var(--start));
    }

    to {
      transform: translateX(var(--end));
    }
  }

  @keyframes marquee {
    0% {
      transform: translateX(var(--start));
    }

    to {
      transform: translateX(var(--end));
    }
  }
`;

export default CustomDetailButton;
