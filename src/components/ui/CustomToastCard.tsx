// src/components/ui/CustomToastCard.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import * as ToastPrimitives from "@radix-ui/react-toast"; // For ToastPrimitives.Close
import { cn } from '@/lib/utils';

interface CustomToastCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

const StyledWrapper = styled.div<{ variant?: 'default' | 'destructive' }>`
  .card {
    width: 330px;
    min-height: 80px;
    height: auto; 
    border-radius: 8px;
    box-sizing: border-box;
    padding: 10px 15px;
    background-color: hsl(var(--card));
    box-shadow: 0px 8px 24px hsl(var(--foreground) / 0.1);
    position: relative;
    overflow: hidden; /* For wave clipping */
    display: flex;
    align-items: flex-start; /* Align items to the top */
    gap: 10px; /* Gap between icon, text, and close button */
    border: 1px solid hsl(var(--border));
  }
  .wave {
    position: absolute;
    left: -31px; 
    top: 50%; 
    transform: translateY(-50%) rotate(90deg); 
    width: 80px; 
    height: 100%; /* Spans full height of the card */
    fill: ${({ variant }) =>
      variant === 'destructive'
        ? 'hsl(var(--destructive) / 0.2)'
        : 'hsl(var(--primary) / 0.2)'};
  }
  .icon-container {
    width: 35px;
    height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${({ variant }) =>
      variant === 'destructive'
        ? 'hsl(var(--destructive) / 0.1)'
        : 'hsl(var(--primary) / 0.1)'};
    border-radius: 50%;
    margin-left: 0; 
    margin-top: 2px; 
    z-index: 1; 
    flex-shrink: 0; 
  }
  .icon {
    width: 17px;
    height: 17px;
    color: ${({ variant }) =>
      variant === 'destructive'
        ? 'hsl(var(--destructive))'
        : 'hsl(var(--primary))'};
  }
  .message-text-container {
    display: flex;
    flex-direction: column;
    /* justify-content: flex-start; No longer needed due to parent's align-items: flex-start */
    align-items: flex-start; /* Text within container should be left-aligned */
    flex-grow: 1; /* Crucial to take available space */
    min-width: 0; /* Allows text to wrap correctly in flex context */
    z-index: 1; 
    word-wrap: break-word; 
    white-space: pre-wrap; 
  }
  .message-text,
  .sub-text {
    margin: 0;
    cursor: default;
  }
  .message-text {
    color: hsl(var(--chart-1)); /* Using a theme-based blue that contrasts with white */
    font-size: 16px; 
    font-weight: 600;
    ${({ variant }) =>
      variant === 'destructive' &&
      `
      color: hsl(var(--destructive));
    `}
  }
  .sub-text {
    font-size: 13px;
    color: hsl(var(--muted-foreground));
    line-height: 1.4; 
  }
  .cross-icon-wrapper {
    color: hsl(var(--muted-foreground));
    cursor: pointer;
    width: 24px; 
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
    z-index: 1; 
    margin-top: 0px; 
    flex-shrink: 0; 
  }
  .cross-icon-wrapper:hover {
    background-color: hsl(var(--muted) / 0.5);
  }
  .cross-icon {
    width: 15px;
    height: 15px;
  }
`;

const CustomToastCard: React.FC<CustomToastCardProps> = ({ title, description, variant = 'default' }) => {
  return (
    <StyledWrapper variant={variant}>
      <div className="card">
        <svg className="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,160 C150,200 200,80 300,160 S450,120 600,160 S750,200 900,160 S1050,120 1200,160 S1350,200 1440,160 L1440,320 L0,320 Z" />
        </svg>
        <div className="icon-container">
          {variant === 'destructive' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" strokeWidth={0} fill="currentColor" stroke="currentColor" className="icon">
              <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" strokeWidth={0} fill="currentColor" stroke="currentColor" className="icon">
              <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
            </svg>
          )}
        </div>
        <div className="message-text-container">
          {title && <p className="message-text">{title}</p>}
          {description && <p className="sub-text">{description}</p>}
        </div>
        <ToastPrimitives.Close className="cross-icon-wrapper" aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" strokeWidth={0} fill="none" stroke="currentColor" className="cross-icon">
            <path fill="currentColor" d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" clipRule="evenodd" fillRule="evenodd" />
          </svg>
        </ToastPrimitives.Close>
      </div>
    </StyledWrapper>
  );
};

export default CustomToastCard;

