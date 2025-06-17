// src/components/ui/StyledEditButton.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface StyledEditButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void;
  title?: string;
}

const StyledWrapper = styled.div`
  /* Ensures the button behaves like an inline-block element */
  display: inline-block; 

  .edit-button {
    width: 40px; /* Initial width for icon only */
    height: 40px; /* Fixed height */
    border-radius: 50%; /* Circular shape */
    background-color: hsl(var(--secondary)); /* Default background from theme */
    border: 1px solid hsl(var(--border)); /* Subtle border from theme */
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center; /* Center icon initially */
    box-shadow: 0px 2px 5px hsla(var(--foreground) / 0.1);
    cursor: pointer;
    transition: all 0.3s ease-in-out;
    overflow: hidden;
    position: relative;
    text-decoration: none !important;
  }

  .edit-svgIcon {
    width: 17px; /* SVG size */
    height: 17px;
    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  }

  .edit-svgIcon path {
    fill: hsl(var(--secondary-foreground)); /* Default icon color from theme */
    transition: fill 0.3s ease-in-out;
  }

  .edit-button:hover {
    width: 120px; /* Expand width on hover */
    border-radius: 50px; /* Pill shape on hover */
    background-color: hsl(var(--primary)); /* Hover background from theme */
    border-color: hsl(var(--primary) / 0.8);
  }

  .edit-button:hover .edit-svgIcon {
    transform: translateX(-35px) rotate(360deg); /* Move icon left and rotate */
    opacity: 1; /* Keep icon visible */
  }
  
  .edit-button:hover .edit-svgIcon path {
    fill: hsl(var(--primary-foreground)); /* Icon color on hover */
  }

  .edit-button::before {
    content: "Editar"; /* Text to show on hover */
    position: absolute;
    left: 45px; /* Position text to the right of the (future) icon position */
    color: hsl(var(--primary-foreground)); /* Text color on hover */
    font-size: 13px;
    font-weight: 600;
    opacity: 0; /* Hidden by default */
    transform: translateX(20px); /* Start off-screen to the right */
    transition: opacity 0.3s ease-in-out 0.1s, transform 0.3s ease-in-out 0.1s;
    white-space: nowrap;
  }

  .edit-button:hover::before {
    opacity: 1;
    transform: translateX(0px); /* Slide in text */
  }

  /* Disabled state */
  .edit-button:disabled {
    background-color: hsl(var(--muted));
    border-color: hsl(var(--border));
    cursor: not-allowed;
    box-shadow: none;
  }
  .edit-button:disabled .edit-svgIcon path {
    fill: hsl(var(--muted-foreground));
  }
  .edit-button:disabled:hover {
    width: 40px; /* Keep original width */
    border-radius: 50%;
    background-color: hsl(var(--muted));
  }
  .edit-button:disabled:hover .edit-svgIcon {
    transform: none; /* No transform on hover when disabled */
  }
  .edit-button:disabled:hover::before {
    display: none; /* No text on hover when disabled */
  }
`;

const StyledEditButton: React.FC<StyledEditButtonProps> = ({ className, onClick, title = "Editar", ...props }) => {
  return (
    <StyledWrapper className={cn(className)}>
      <button className="edit-button" onClick={onClick} title={title} {...props}>
        <svg className="edit-svgIcon" viewBox="0 0 512 512">
          <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z" />
        </svg>
      </button>
    </StyledWrapper>
  );
};

export default StyledEditButton;
