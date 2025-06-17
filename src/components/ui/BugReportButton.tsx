
// src/components/ui/BugReportButton.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface BugReportButtonProps {
  className?: string;
}

const BugReportButton: React.FC<BugReportButtonProps> = ({ className }) => {
  return (
    <StyledWrapper className={cn(className)}>
      <Link href="/report-bug" passHref legacyBehavior>
        <a className="BugButton" aria-label="Reportar un Error">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 43 42" className="bugsvg">
            <path strokeWidth={4} stroke="currentColor" d="M20 7H23C26.866 7 30 10.134 30 14V28.5C30 33.1944 26.1944 37 21.5 37C16.8056 37 13 33.1944 13 28.5V14C13 10.134 16.134 7 20 7Z" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M18 2V7" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M25 2V7" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M31 22H41" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M2 22H12" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M12.5785 15.2681C3.5016 15.2684 4.99951 12.0004 5 4" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M12.3834 29.3877C3.20782 29.3874 4.72202 32.4736 4.72252 40.0291" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M30.0003 14.8974C39.0545 15.553 37.7958 12.1852 38.3718 4.20521" />
            <path strokeLinecap="round" strokeWidth={4} stroke="currentColor" d="M29.9944 29.7379C39.147 29.1188 37.8746 32.2993 38.4568 39.8355" />
          </svg>
          <span className="tooltip">Reportar Error</span>
        </a>
      </Link>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: inline-block; /* Allows proper sizing and positioning */

  .BugButton {
    width: 40px;
    height: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background-color: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: visible; /* Allow tooltip to be visible */
  }
  .BugButton svg.bugsvg { /* Target more specifically */
    width: 44%;
  }

  .bugsvg path {
    stroke: hsl(var(--muted-foreground)); /* Default stroke using theme variable */
    transition: all 0.2s;
  }

  .BugButton:hover {
    background-color: hsl(var(--primary) / 0.1); /* Subtle primary hover */
  }

  .BugButton:hover .bugsvg path {
    stroke: hsl(var(--primary)); /* Primary color stroke on hover */
  }

  .BugButton:active {
    transform: scale(0.98);
  }

  .tooltip {
    position: absolute;
    top: -45px; /* Adjusted for slightly more space */
    background-color: hsl(var(--popover)); /* Themed background */
    color: hsl(var(--popover-foreground)); /* Themed text color */
    border-radius: 5px;
    font-size: 12px;
    padding: 8px 12px;
    font-weight: 600;
    box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.105);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    visibility: hidden; /* Start hidden */
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s, top 0.3s ease-in-out; /* Added visibility and top transitions */
    min-width: 100px;
    z-index: 10; /* Ensure tooltip is above other elements */
  }

  .tooltip::before {
    position: absolute;
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    content: "";
    background-color: hsl(var(--popover)); /* Themed arrow background */
    bottom: -5px; /* Corrected arrow position */
    left: 50%;
    margin-left: -5px; /* Center arrow */
  }

  .BugButton:hover .tooltip {
    opacity: 1;
    visibility: visible; /* Make visible on hover */
    top: -50px; /* Move tooltip up slightly more on hover */
    transition-delay: 0.1s; /* Slight delay before showing */
  }
`;

export default BugReportButton;
