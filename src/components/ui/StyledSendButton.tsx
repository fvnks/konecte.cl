// src/components/ui/StyledSendButton.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface StyledSendButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

const StyledSendButton: React.FC<StyledSendButtonProps> = ({ children, isLoading, className, ...props }) => {
  return (
    <StyledWrapper className={cn(className)}>
      <button className="bt" {...props} disabled={isLoading || props.disabled}>
        <span className="msg" />
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .bt {
    border: none;
    user-select: none;
    font-size: 16px; /* Adjusted for better fit with app style */
    color: hsl(var(--primary-foreground));
    text-align: center;
    background-color: hsl(var(--primary));
    box-shadow: hsl(var(--border)) 2px 2px 8px 0px; /* Subtle shadow with theme border color */
    border-radius: 12px;
    height: 50px; /* Adjusted height */
    line-height: 50px;
    min-width: 155px; /* Maintain a good base width for animation */
    width: auto; /* Allow to grow with text */
    padding: 0 25px; /* Horizontal padding */
    transition: all 0.2s ease;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    outline: none; /* Remove default outline */
  }

  .bt:focus-visible { /* Custom focus for accessibility */
    box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring));
  }

  .msg {
    height: 0;
    width: 0;
    border-radius: 2px;
    position: absolute;
    left: 15%; /* Initial position of the plane icon */
    top: 25%;
  }

  .bt:active:not(:disabled) {
    transition: all 0.001s ease;
    background-color: hsl(var(--primary) / 0.85); /* Slightly darker primary on active */
    box-shadow: hsl(var(--border) / 0.7) 0 0 0 0;
    transform: translateX(1px) translateY(1px);
  }

  .bt:hover:not(:disabled) .msg {
    animation: msgRun 1.8s forwards; /* Slightly faster animation */
  }

  .bt:disabled {
    background-color: hsl(var(--primary) / 0.6);
    color: hsl(var(--primary-foreground) / 0.8);
    cursor: not-allowed;
    box-shadow: none;
  }

  .bt:disabled .msg { /* Hide animation when disabled */
    display: none;
  }

  .bt:disabled svg.animate-spin {
    color: hsl(var(--primary-foreground) / 0.8);
  }

  @keyframes msgRun {
    0% {
      border-top: hsl(var(--primary-foreground)) 0 solid;
      border-bottom: hsl(var(--primary-foreground)) 0 solid;
      border-left: hsl(var(--primary-foreground)) 0 solid;
      border-right: hsl(var(--primary-foreground)) 0 solid;
    }

    20% { /* Forming the paper plane shape with themed colors */
      border-top: hsl(var(--muted)) 14px solid; /* Using muted for a light gray top border */
      border-bottom: hsl(var(--primary-foreground)) 14px solid; /* White for other borders */
      border-left: hsl(var(--primary-foreground)) 20px solid;
      border-right: hsl(var(--primary-foreground)) 20px solid;
    }

    25% { /* Slight adjustment for visual effect with themed colors */
      border-top: hsl(var(--muted)) 12px solid;
      border-bottom: hsl(var(--primary-foreground)) 12px solid;
      border-left: hsl(var(--primary-foreground)) 18px solid;
      border-right: hsl(var(--primary-foreground)) 18px solid;
    }

    80% { /* Plane becomes transparent as it flies */
      border-top: transparent 12px solid;
      border-bottom: transparent 12px solid;
      border-left: transparent 18px solid;
      border-right: transparent 18px solid;
    }

    100% {
      transform: translateX(150px); /* How far the plane flies */
      border-top: transparent 12px solid;
      border-bottom: transparent 12px solid;
      border-left: transparent 18px solid;
      border-right: transparent 18px solid;
    }
  }
`;

export default StyledSendButton;
