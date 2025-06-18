// src/components/ui/checkbox.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

// Props interface for our custom checkbox
interface CustomCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
}

const CheckboxStyledLabel = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: hsl(var(--foreground));
  transition: color 0.3s;
  position: relative;

  input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    width: 20px;
    height: 20px;
    border: 2px solid hsl(var(--border));
    border-radius: calc(var(--radius) - 4px); /* Adjusted to be slightly less than card radius */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.5s, border-color 0.5s, transform 0.5s ease-out; /* Slightly longer transition */
    transform-style: preserve-3d;
    background-color: hsl(var(--input));
  }

  .checkmark .check-icon { /* Styles for the SVG checkmark */
    width: 12px; /* Size of the SVG */
    height: 12px;
    stroke: hsl(var(--primary-foreground)); /* Color of the checkmark lines */
    stroke-width: 3; /* Thickness of the checkmark lines, adjust as needed */
    opacity: 0; /* Hidden by default */
    transform: scale(0.5); /* Start smaller */
    transition: opacity 0.3s ease-out, transform 0.3s ease-out;
    transition-delay: 0.1s; /* Slight delay for the checkmark to appear after bg change */
  }

  input[type="checkbox"]:checked + .checkmark {
    background-color: hsl(var(--primary));
    border-color: hsl(var(--primary));
    transform: scale(1.0) rotateZ(360deg) rotateY(360deg);
  }
  
  input[type="checkbox"]:checked + .checkmark .check-icon {
    opacity: 1; /* Show when checked */
    transform: scale(1); /* Scale to full size */
  }

  /* Hover effect for the checkmark box itself */
  &:hover .checkmark {
    border-color: hsl(var(--primary)); 
    background-color: hsl(var(--accent) / 0.05);
  }
  input[type="checkbox"]:checked + .checkmark:hover {
     background-color: hsl(var(--primary) / 0.9); 
     border-color: hsl(var(--primary) / 0.9);
  }

  input[type="checkbox"]:focus-visible + .checkmark { 
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring)); 
  }

  input[type="checkbox"]:disabled + .checkmark {
    border-color: hsl(var(--border) / 0.5);
    background-color: hsl(var(--muted) / 0.5);
    cursor: not-allowed;
    opacity: 0.5;
    transform: none; /* No animation when disabled */
  }
   input[type="checkbox"]:disabled + .checkmark .check-icon {
    opacity: 0; /* Ensure checkmark is not visible when disabled and unchecked */
  }

  input[type="checkbox"]:disabled:checked + .checkmark {
    background-color: hsl(var(--primary) / 0.5);
    border-color: hsl(var(--primary) / 0.5);
  }

  input[type="checkbox"]:disabled:checked + .checkmark .check-icon {
    stroke: hsl(var(--primary-foreground) / 0.7);
    opacity: 1; /* Checkmark should be visible if checked and disabled */
    transform: scale(1);
  }
`;

const Checkbox = React.forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ className, onCheckedChange, checked, onChange, ...props }, ref) => {
    
    const isChecked = checked === 'indeterminate' ? false : checked;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newCheckedState = event.target.checked;
      if (onCheckedChange) {
        onCheckedChange(newCheckedState);
      }
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <CheckboxStyledLabel className={cn("custom-checkbox-wrapper", className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={!!isChecked} // Ensure boolean for the input
          onChange={handleChange} 
          {...props} 
        />
        <span className="checkmark">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="check-icon"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      </CheckboxStyledLabel>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
