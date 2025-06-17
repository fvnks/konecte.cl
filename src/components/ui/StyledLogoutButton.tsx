// src/components/ui/StyledLogoutButton.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface StyledLogoutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode; // Make children optional as text is fixed
}

const StyledWrapper = styled.div`
  width: 100%; /* Make the wrapper take full width */

  .button {
    position: relative;
    width: 100%; /* Button itself takes full width */
    height: 40px; /* Fixed height */
    cursor: pointer;
    display: flex;
    align-items: center;
    border: 1px solid hsl(var(--destructive)); /* Destructive theme color */
    background-color: hsl(var(--destructive)); /* Destructive theme color */
    overflow: hidden;
    border-radius: 0.375rem; /* Corresponds to rounded-md */
  }

  .button, .button__icon, .button__text {
    transition: all 0.3s;
  }

  .button .button__text {
    transform: translateX(12px); /* Initial indent for text */
    color: hsl(var(--destructive-foreground)); /* Destructive theme text color */
    font-weight: 600;
    font-size: 0.875rem; /* Corresponds to text-sm */
    white-space: nowrap;
  }

  .button .button__icon {
    position: absolute;
    right: 0; /* Align icon to the right initially */
    transform: translateX(0); /* No initial X translation if aligned right */
    height: 100%;
    width: 40px; /* Fixed width for icon part */
    background-color: hsl(var(--destructive) / 0.9); /* Slightly different shade or same */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .button .svg {
    width: 20px;
    height: 20px;
    stroke: hsl(var(--destructive-foreground)); /* Use stroke for lucide icons */
  }

  .button:hover:not(:disabled) {
    background: hsl(var(--destructive) / 0.9);
    border-color: hsl(var(--destructive) / 0.9);
  }

  .button:hover:not(:disabled) .button__text {
    color: transparent; /* Hide text on hover */
  }

  .button:hover:not(:disabled) .button__icon {
    width: calc(100% - 2px); /* Expand icon part, account for border */
    transform: translateX(0);
    background-color: hsl(var(--destructive) / 0.9); /* Match button hover bg */
  }

  .button:active:not(:disabled) {
    border-color: hsl(var(--destructive) / 0.8);
    background-color: hsl(var(--destructive) / 0.8);
  }
  
  .button:active:not(:disabled) .button__icon {
    background-color: hsl(var(--destructive) / 0.8);
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
    transform: translateX(12px); 
  }
  .button:disabled .button__icon {
    background-color: hsl(var(--muted));
  }
  .button:disabled .svg {
    stroke: hsl(var(--muted-foreground));
  }
`;

const StyledLogoutButton: React.FC<StyledLogoutButtonProps> = ({ className, ...props }) => {
  return (
    <StyledWrapper className={cn(className)}>
      <button className="button" type="button" {...props}>
        <span className="button__text">Cerrar Sesión</span>
        <span className="button__icon">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="svg"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
        </span>
      </button>
    </StyledWrapper>
  );
};

export default StyledLogoutButton;
