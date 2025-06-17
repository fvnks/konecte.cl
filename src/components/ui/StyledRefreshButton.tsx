// src/components/ui/StyledRefreshButton.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface StyledRefreshButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const StyledWrapper = styled.div`
  .button {
    position: relative;
    width: 150px;
    height: 40px;
    cursor: pointer;
    display: flex;
    align-items: center;
    border: 1px solid hsl(var(--primary));
    background-color: hsl(var(--primary));
    overflow: hidden;
    border-radius: 0.375rem; /* rounded-md */
  }

  .button, .button__icon, .button__text {
    transition: all 0.3s;
  }

  .button .button__text {
    transform: translateX(10px); /* Adjusted for "Refrescar" - may need tweaking */
    color: hsl(var(--primary-foreground));
    font-weight: 600;
    font-size: 0.875rem; /* text-sm */
  }

  .button .button__icon {
    position: absolute;
    transform: translateX(109px); /* Original value, assuming 150px width - 39px icon part - 2px for potential centering */
    height: 100%;
    width: 39px;
    background-color: hsl(var(--primary)); /* Can be a slightly different shade if desired */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button .svg {
    width: 20px;
    fill: hsl(var(--primary-foreground));
  }

  .button:hover:not(:disabled) {
    background: hsl(var(--primary) / 0.9); /* Corresponds to ShadCN primary hover */
    border-color: hsl(var(--primary) / 0.9);
  }

  .button:hover:not(:disabled) .button__text {
    color: transparent;
  }

  .button:hover:not(:disabled) .button__icon {
    width: calc(100% - 2px); /* Adjust to fill, accounting for border */
    transform: translateX(0);
    background-color: hsl(var(--primary) / 0.9);
  }
  
  .button:active:not(:disabled) {
    border-color: hsl(var(--primary) / 0.8); 
    background-color: hsl(var(--primary) / 0.8);
  }

  .button:active:not(:disabled) .button__icon {
    background-color: hsl(var(--primary) / 0.8);
  }

  /* Disabled state */
  .button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: hsl(var(--muted));
    border-color: hsl(var(--border));
  }
  .button:disabled .button__text {
    color: hsl(var(--muted-foreground));
    transform: translateX(10px); /* Keep text visible but styled for disabled */
  }
  .button:disabled .button__icon {
    background-color: hsl(var(--muted));
  }
  .button:disabled .svg {
    fill: hsl(var(--muted-foreground));
  }
`;

const StyledRefreshButton: React.FC<StyledRefreshButtonProps> = ({ className, ...props }) => {
  return (
    <StyledWrapper className={cn(className)}>
      <button className="button" type="button" {...props}>
        <span className="button__text">Refrescar</span>
        <span className="button__icon">
          <svg xmlns="http://www.w3.org/2000/svg" width={48} viewBox="0 0 48 48" height={48} className="svg">
            <path d="M35.3 12.7c-2.89-2.9-6.88-4.7-11.3-4.7-8.84 0-15.98 7.16-15.98 16s7.14 16 15.98 16c7.45 0 13.69-5.1 15.46-12h-4.16c-1.65 4.66-6.07 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.31 0 6.28 1.38 8.45 3.55l-6.45 6.45h14v-14l-4.7 4.7z" />
            <path fill="none" d="M0 0h48v48h-48z" />
          </svg>
        </span>
      </button>
    </StyledWrapper>
  );
};

export default StyledRefreshButton;
