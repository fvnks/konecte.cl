// src/components/ui/StyledRejectButton.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface StyledRejectButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode; // Allow children if needed, though text is fixed
  className?: string;
}

const StyledWrapper = styled.div`
  /* Using a wrapper div to ensure the button's container doesn't interfere with flex layouts elsewhere */
  display: inline-block; 

  .custom-reject-button {
    /* Dimensions from user CSS */
    width: 150px; 
    height: 50px; 
    cursor: pointer;
    display: flex;
    align-items: center;
    /* Theme colors */
    background: hsl(var(--destructive));
    border: 1px solid hsl(var(--destructive) / 0.9); /* Slightly darker border for depth */
    border-radius: 5px;
    box-shadow: 1px 1px 3px rgba(0,0,0,0.15);
    overflow: hidden; /* Important for the icon slide effect */
  }

  .custom-reject-button, .custom-reject-button span {
    transition: all 200ms ease-in-out; /* Standardized transition */
  }

  .custom-reject-button .text {
    transform: translateX(35px);
    color: hsl(var(--destructive-foreground));
    font-weight: bold;
    font-size: 0.875rem; /* text-sm */
    white-space: nowrap; /* Prevent text wrapping */
  }

  .custom-reject-button .icon {
    position: absolute;
    border-left: 1px solid hsl(var(--destructive) / 0.8); /* Darker separator */
    transform: translateX(110px); /* (150px button width - 40px icon width) */
    height: 40px; /* Inner height for icon area */
    width: 40px;  /* Width of icon area */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .custom-reject-button svg {
    width: 15px; /* SVG specific size */
    height: 15px;
    fill: hsl(var(--destructive-foreground));
  }

  .custom-reject-button:hover:not(:disabled) {
    background: hsl(var(--destructive) / 0.9); /* Slightly lighter/darker on hover */
    border-color: hsl(var(--destructive) / 0.8);
  }

  .custom-reject-button:hover:not(:disabled) .text {
    color: transparent;
  }

  .custom-reject-button:hover:not(:disabled) .icon {
    width: 150px; /* Full width of the button */
    border-left: none;
    transform: translateX(0);
  }
  
  .custom-reject-button:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }

  .custom-reject-button:active:not(:disabled) .icon svg {
    transform: scale(0.8);
  }
  .custom-reject-button:active:not(:disabled) {
    background-color: hsl(var(--destructive) / 0.8);
    border-color: hsl(var(--destructive) / 0.7);
  }

  /* Disabled state */
  .custom-reject-button:disabled {
    background: hsl(var(--muted));
    border-color: hsl(var(--border));
    color: hsl(var(--muted-foreground));
    cursor: not-allowed;
    box-shadow: none;
  }
  .custom-reject-button:disabled .text {
    color: hsl(var(--muted-foreground));
    transform: translateX(35px); /* Keep text visible */
  }
  .custom-reject-button:disabled .icon {
    border-left: 1px solid hsl(var(--muted-foreground) / 0.5);
  }
  .custom-reject-button:disabled svg {
    fill: hsl(var(--muted-foreground));
  }
  .custom-reject-button:disabled:hover .icon {
     width: 40px; /* Keep icon part width */
     transform: translateX(110px); /* Keep icon part position */
  }
`;

const StyledRejectButton: React.FC<StyledRejectButtonProps> = ({ className, children, ...props }) => {
  return (
    <StyledWrapper className={cn(className)}>
      <button className="custom-reject-button noselect" type="button" {...props}>
        <span className="text">{children || "Rechazar"}</span>
        <span className="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24">
            <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
          </svg>
        </span>
      </button>
    </StyledWrapper>
  );
};

export default StyledRejectButton;
