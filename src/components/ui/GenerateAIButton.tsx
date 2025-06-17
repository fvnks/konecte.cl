// src/components/ui/GenerateAIButton.tsx
'use client';

import React from 'react';
import styled from 'styled-components';

interface GenerateAIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const GenerateAIButton: React.FC<GenerateAIButtonProps> = ({ children, ...props }) => {
  return (
    <StyledWrapper>
      <button className="btn" {...props}>
        <svg height={24} width={24} viewBox="0 0 24 24" data-name="Layer 1" id="Layer_1" className="sparkle">
          <path d="M10,21.236,6.755,14.745.264,11.5,6.755,8.255,10,1.764l3.245,6.491L19.736,11.5l-6.491,3.245ZM18,21l1.5,3L21,21l3-1.5L21,18l-1.5-3L18,18l-3,1.5ZM19.333,4.667,20.5,7l1.167-2.333L24,3.5,21.667,2.333,20.5,0,19.333,2.333,17,3.5Z" />
        </svg>
        <span className="text">{children}</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: inline-block; /* Allow the button to size based on content + padding */

  .btn {
    border: none;
    width: auto; /* Fit content */
    height: 2.75rem; /* Approx 44px, similar to ShadCN h-11 */
    border-radius: 3em;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px; /* Adjusted gap */
    background: hsl(var(--primary)); /* Theme primary color */
    color: hsl(var(--primary-foreground)); /* Theme primary text color */
    cursor: pointer;
    transition: all 450ms ease-in-out;
    padding: 0 1.25rem; /* Adjusted padding */
  }

  .sparkle {
    fill: hsl(var(--primary-foreground)); /* Theme primary text color */
    transition: all 800ms ease;
    width: 20px; /* Adjusted icon size */
    height: 20px; /* Adjusted icon size */
  }

  .text {
    font-weight: 600;
    color: hsl(var(--primary-foreground)); /* Theme primary text color */
    font-size: 0.875rem; /* text-sm */
    white-space: nowrap; /* Ensure text stays on one line */
  }

  .btn:hover {
    background: hsl(var(--primary) / 0.9); /* ShadCN primary hover */
    /* Keeping original cool shadow and transform */
    box-shadow: inset 0px 1px 0px 0px rgba(255, 255, 255, 0.4),
    inset 0px -4px 0px 0px rgba(0, 0, 0, 0.2),
    0px 0px 0px 4px rgba(255, 255, 255, 0.2),
    0px 0px 180px 0px hsl(var(--primary-foreground) / 0.5); /* Adjusted shadow color to be more neutral or primary-based */
    transform: translateY(-2px);
  }

  .btn:hover .text {
    color: hsl(var(--primary-foreground)); /* Ensure text remains primary-foreground on hover */
  }

  .btn:hover .sparkle {
    fill: hsl(var(--primary-foreground)); /* Ensure sparkle remains primary-foreground on hover */
    transform: scale(1.2);
  }

  .btn:disabled {
    background: hsl(var(--primary) / 0.5); /* Muted primary for disabled state */
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .btn:disabled .text,
  .btn:disabled .sparkle {
    opacity: 0.7;
  }
`;

export default GenerateAIButton;
