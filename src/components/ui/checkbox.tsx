// src/components/ui/checkbox.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

// Props interface for our custom checkbox
interface CustomCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  // Radix/ShadCN often use onCheckedChange for controlled components
  // We also support the native `onChange` if provided.
  checked?: boolean | 'indeterminate'; // Radix supports indeterminate
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
}

const CheckboxStyledLabel = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  color: hsl(var(--foreground));
  transition: color 0.3s;
  position: relative; /* For positioning focus ring correctly if needed */

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
    border-radius: calc(var(--radius) - 4px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.3s, border-color 0.3s, transform 0.4s ease-out; /* Animation speed */
    transform-style: preserve-3d;
    background-color: hsl(var(--input)); 
  }

  .checkmark::before {
    content: "\\2713"; /* Check mark character */
    font-size: 12px; 
    font-weight: bold;
    line-height: 1; 
    color: transparent;
    transition: color 0.3s ease-out, transform 0.3s ease-out;
    transform: scale(0.8); /* Start slightly smaller */
  }

  input[type="checkbox"]:checked + .checkmark {
    background-color: hsl(var(--primary));
    border-color: hsl(var(--primary));
    transform: scale(1.0) rotateZ(360deg) rotateY(360deg); /* User's 3D animation */
    transition-duration: 0.5s; /* Animation speed for check */
  }
  
  input[type="checkbox"]:checked + .checkmark::before {
    color: hsl(var(--primary-foreground));
    transform: scale(1); /* Scale to full size on check */
  }

  /* Hover effect for the checkmark box itself */
  &:hover .checkmark {
    border-color: hsl(var(--primary)); 
    background-color: hsl(var(--accent) / 0.05); /* More subtle hover */
  }
  input[type="checkbox"]:checked + .checkmark:hover {
     background-color: hsl(var(--primary) / 0.9); 
     border-color: hsl(var(--primary) / 0.9);
  }


  input[type="checkbox"]:focus-visible + .checkmark { 
    outline: 2px solid transparent; /* Remove default outline */
    outline-offset: 2px;
    box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring)); 
  }

  input[type="checkbox"]:disabled + .checkmark {
    border-color: hsl(var(--border) / 0.5);
    background-color: hsl(var(--muted) / 0.5);
    cursor: not-allowed;
    opacity: 0.5;
  }
   input[type="checkbox"]:disabled + .checkmark::before {
    color: transparent; /* Ensure checkmark is not visible when disabled */
  }

  input[type="checkbox"]:disabled:checked + .checkmark {
    background-color: hsl(var(--primary) / 0.5);
    border-color: hsl(var(--primary) / 0.5);
    transform: none; /* No animation when disabled */
  }

  input[type="checkbox"]:disabled:checked + .checkmark::before {
    color: hsl(var(--primary-foreground) / 0.7);
    transform: scale(1); /* Checkmark should be visible if checked and disabled */
  }
`;

const Checkbox = React.forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ className, onCheckedChange, checked, onChange, ...props }, ref) => {
    
    // Handle indeterminate state if passed (though visually it will look like unchecked or checked)
    const isChecked = checked === 'indeterminate' ? false : checked;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newCheckedState = event.target.checked;
      if (onCheckedChange) {
        onCheckedChange(newCheckedState);
      }
      // Call native onChange if provided by RHF or user
      if (onChange) {
        onChange(event);
      }
    };

    return (
      <CheckboxStyledLabel className={cn("custom-checkbox-wrapper", className)}>
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={handleChange} 
          {...props} 
        />
        <span className="checkmark" />
      </CheckboxStyledLabel>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
