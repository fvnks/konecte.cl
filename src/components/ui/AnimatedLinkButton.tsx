
// src/components/ui/AnimatedLinkButton.tsx
'use client';

import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

interface AnimatedLinkButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const AnimatedLinkButton: React.FC<AnimatedLinkButtonProps> = ({
  href,
  children,
  className,
}) => {
  return (
    <StyledWrapper className={className}>
      <Link href={href} passHref legacyBehavior>
        <a className="button"> {/* Changed from button to a for NextLink compatibility */}
          <svg className="svgIcon" viewBox="0 0 512 512" height="1em" xmlns="http://www.w3.org/2000/svg">
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm50.7-186.9L162.4 380.6c-19.4 7.5-38.5-11.6-31-31l55.5-144.3c3.3-8.5 9.9-15.1 18.4-18.4l144.3-55.5c19.4-7.5 38.5 11.6 31 31L325.1 306.7c-3.2 8.5-9.9 15.1-18.4 18.4zM288 256a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
          </svg>
          <span style={{ whiteSpace: 'nowrap' }}>{children}</span>
        </a>
      </Link>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: inline-flex; 

  .button {
    width: auto; /* Ajustado para que el contenido defina el ancho */
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    background-color: #369DF2; /* Color de fondo principal */
    border-radius: 30px;
    color: #fff; /* Color de texto blanco */
    font-weight: 600;
    font-size: 0.875rem; /* Approx text-sm */
    border: none;
    position: relative;
    cursor: pointer;
    transition-duration: .2s;
    box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.116);
    padding: 0 16px 0 12px; /* Ajustado padding (top/bottom 0, right 16, left 12) */
    transition-duration: .5s;
    text-decoration: none;
  }

  .svgIcon {
    height: 25px;
    transition-duration: 1.5s;
    fill: #fff; /* Color del icono blanco */
  }

  .button:hover {
    filter: brightness(115%); /* Hace el fondo ligeramente más claro */
    transition-duration: .5s;
  }

  .button:active {
    transform: scale(0.97);
    transition-duration: .2s;
  }

  .button:hover .svgIcon {
    transform: rotate(250deg);
    transition-duration: 1.5s;
  }
`;

export default AnimatedLinkButton;

