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
      <Link href={href} passHref legacyBehavior>
        <a className="btn-23">
          <span className="text">{children}</span>
          <span aria-hidden className="marquee">{children}</span>
        </a>
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
    background-color: #369DF2; /* Color de fondo principal cambiado */
    background-image: none;
    color: #fff;
    cursor: pointer;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif,
      Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, Noto Color Emoji;
    font-size: 100%; /* Relativo al contenedor, usualmente text-sm (0.875rem) en las tarjetas */
    font-weight: 900;
    line-height: 1.5;
    margin: 0;
    -webkit-mask-image: -webkit-radial-gradient(#000, #fff);
    padding: 0; /* El padding se define más abajo */
    text-transform: uppercase;
  }

  .btn-23:disabled {
    cursor: default;
  }

  .btn-23:-moz-focusring {
    outline: auto;
  }

  .btn-23 svg { /* Aunque no hay SVG directo, se mantiene por si se añade */
    display: block;
    vertical-align: middle;
  }

  .btn-23 [hidden] {
    display: none;
  }

  .btn-23 {
    border-radius: 99rem; /* fully rounded */
    border-width: 2px; /* Podría ser border: 2px solid transparent; si se quiere un borde del color de fondo */
    border-color: transparent; /* Para asegurar que el borde inicial no interfiera con el bg */
    overflow: hidden;
    padding: 0.6rem 1.5rem; /* Ajustado para un tamaño más similar a un botón 'sm' */
    position: relative;
    /* Ajustar el tamaño de fuente aquí si 100% no es el deseado para el texto del botón */
    font-size: 0.875rem; /* text-sm */
    line-height: 1.25rem; /* leading-5 */
  }

  .btn-23 span {
    display: grid;
    inset: 0;
    place-items: center;
    position: absolute;
    transition: opacity 0.2s ease;
  }

  .btn-23 .marquee {
    --spacing: 7em; /* Aumentado para asegurar que el texto "Ver Detalles" tenga espacio */
    --start: 0em;
    --end: 7em; /* Coincide con --spacing */
    -webkit-animation: marquee 1s linear infinite;
    animation: marquee 1s linear infinite;
    -webkit-animation-play-state: paused;
    animation-play-state: paused;
    opacity: 0;
    position: relative;
    /* El text-shadow crea copias del texto para el efecto marquee */
    /* El color del shadow debe ser el mismo que el color del texto para que se vea como texto repetido */
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
