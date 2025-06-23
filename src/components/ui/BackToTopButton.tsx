// src/components/ui/BackToTopButton.tsx
'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';

const StyledWrapper = styled.div`
  .back-to-top-button {
    position: fixed;
    /* Sits above the assistant button on the right */
    bottom: 100px; /* Approx h-14 + bottom-8 + gap */
    right: 2rem; /* Matches md:right-8 */
    @media (max-width: 768px) {
        right: 1.5rem; /* Matches sm:right-6 */
    }
    @media (max-width: 640px) {
        right: 1rem; /* Matches right-4 */
        bottom: 85px; /* Adjust for smaller screens */
    }

    background-color: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease, visibility 0.3s;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    border: 1px solid hsl(var(--border));
    z-index: 60; /* Below assistant button (z-70) */
    opacity: 0;
    transform: scale(0.8);
    visibility: hidden;
  }

  .back-to-top-button.visible {
    opacity: 1;
    transform: scale(1);
    visibility: visible;
  }

  .back-to-top-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    background-color: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
    border-color: hsl(var(--accent) / 0.5);
  }
  
  .back-to-top-button svg {
    width: 20px;
    height: 20px;
  }
`;

const BackToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <StyledWrapper>
      <button
        type="button"
        onClick={scrollToTop}
        className={cn('back-to-top-button', { 'visible': isVisible })}
        aria-label="Volver arriba"
        title="Volver arriba"
      >
        <ArrowUp />
      </button>
    </StyledWrapper>
  );
};

export default BackToTopButton;
