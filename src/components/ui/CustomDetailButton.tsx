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
    background-color: #369DF2; /* Color de fondo principal */
    background-image: none;
    color: #fff;
    cursor: pointer;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif,
      Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
    font-size: 0.875rem; /* text-sm */
    font-weight: 900;
    line-height: 1.25rem; /* leading-5 */
    margin: 0;
    -webkit-mask-image: -webkit-radial-gradient(#000, #fff);
    padding: 0.6rem 1.5rem; /* Ajustado para un tamaño más compacto */
    text-transform: uppercase;
  }

  .btn-23:disabled {
    cursor: default;
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
    border-radius: 99rem;
    border-width: 2px;
    border-color: transparent; /* Usa el color base para el borde inicial */
    overflow: hidden;
    position: relative;
  }

  .btn-23 span {
    display: grid;
    inset: 0;
    place-items: center;
    position: absolute;
    transition: opacity 0.2s ease;
  }

  .btn-23 .marquee {
    --spacing: 10em; /* Aumentado para más espacio */
    --start: 0em;
    --end: 10em; /* Aumentado para más espacio */
    -webkit-animation: marquee 1.5s linear infinite;
    animation: marquee 1.5s linear infinite;
    -webkit-animation-play-state: paused;
    animation-play-state: paused;
    opacity: 0;
    position: relative;
    text-shadow: #fff var(--spacing) 0, #fff calc(var(--spacing) * -1) 0,
      #fff calc(var(--spacing) * -2) 0;
  }

  .btn-23:hover .marquee {
    -webkit-animation-play-state: running;
    animation-play-state: running;
    opacity: 1;
  }

  .btn-23:hover .text {
    opacity: 0;
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
