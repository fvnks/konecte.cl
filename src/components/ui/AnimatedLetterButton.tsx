// src/components/ui/AnimatedLetterButton.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface AnimatedLetterButtonProps {
  href: string;
  text: string;
  className?: string;
}

const AnimatedLetterButton: React.FC<AnimatedLetterButtonProps> = ({ href, text, className }) => {
  const letters = text.split('');

  return (
    <StyledWrapper className={cn("w-full", className)}>
      <Link href={href} className="animated-letter-button">
        {letters.map((char, index) => (
          <div key={index} className="box" data-char={char}>
            {char === ' ' ? '\u00A0' : char} {/* Use non-breaking space for actual spaces */}
          </div>
        ))}
      </Link>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%; /* Ensures the wrapper takes full width if its container does */

  .animated-letter-button {
    display: flex; /* Changed from inline-flex to flex for full width behavior */
    width: 100%;   /* Button itself takes full width */
    height: 40px;
    cursor: pointer;
    border-radius: 0.375rem; /* Corresponds to rounded-md from ShadCN */
    overflow: hidden;
    text-decoration: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05); /* Subtle shadow */
    border: 1px solid hsl(var(--border)); /* Consistent border */
  }

  .box {
    flex: 1; /* Each box takes equal width */
    min-width: 20px; /* Minimum width for a character, prevents extreme squishing */
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.875rem; /* text-sm */
    font-weight: 700;
    color: hsl(var(--primary-foreground));
    transition: all .8s;
    position: relative;
    background: hsl(var(--primary));
    overflow: hidden;
  }

  .box:not(:last-child) {
    border-right: 1px solid hsl(var(--primary) / 0.5); /* Separator between boxes */
  }

  .box:before {
    content: attr(data-char); /* Use the character from data-char attribute */
    position: absolute;
    top: 0;
    background: hsl(var(--primary-foreground)); /* Contrasting background for ::before */
    color: hsl(var(--primary)); /* Contrasting text color for ::before */
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform .4s;
  }

  /* Alternating slide directions */
  .box:nth-child(odd)::before {
    transform: translateY(100%);
  }
  .box:nth-child(even)::before {
    transform: translateY(-100%);
  }

  .animated-letter-button:hover .box:before {
    transform: translateY(0);
  }
`;

export default AnimatedLetterButton;
