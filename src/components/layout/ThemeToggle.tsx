// src/components/layout/ThemeToggle.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from "next-themes";
import { cn } from '@/lib/utils';

const StyledWrapper = styled.div`
  /* Adjusted for Navbar integration */
  .toggleWrapper {
    display: flex; /* Use flex to center its content if needed */
    align-items: center;
    justify-content: center;
    /* Removed absolute positioning and large padding */
    /* transform: translate3d(-50%, -50%, 0); /* Removed */
    /* color: white; /* Color is context-dependent, not fixed white */
  }

  .toggleWrapper .input {
    position: absolute;
    left: -99em; /* Keep this to hide the actual checkbox */
  }

  .toggle {
    cursor: pointer;
    display: inline-block;
    position: relative;
    /* Scaled down dimensions (original: 90x50) */
    width: 60px; /* Approx 66% of 90px */
    height: 30px; /* Approx 60% of 50px */
    background-color: #83d8ff; /* Day background */
    border-radius: 42px; /* (original 84px) / 2 */
    transition: background-color 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
    transform: scale(0.8); /* Further scale down the entire toggle for navbar */
  }

  /* AM/PM text hidden for navbar integration */
  .toggle:before,
  .toggle:after {
    display: none; 
  }

  .toggle__handler {
    display: inline-block;
    position: relative;
    z-index: 1;
    /* Scaled down (original top: 3px, left: 3px, width/height: 44px, radius: 50px) */
    top: 2px; /* Approx 3px * 0.6 */
    left: 2px; /* Approx 3px * 0.6 */
    width: 26px; /* Approx 44px * 0.6 */
    height: 26px; /* Approx 44px * 0.6 */
    background-color: #ffcf96; /* Sun color */
    border-radius: 25px; /* Approx 50px * 0.6 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); /* Scaled down shadow */
    transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
    transform: rotate(-45deg);
  }

  .toggle__handler .crater {
    position: absolute;
    background-color: #e8cda5; /* Moon crater color */
    opacity: 0;
    transition: opacity 200ms ease-in-out;
    border-radius: 100%;
  }

  /* Scaled crater dimensions and positions */
  .toggle__handler .crater--1 {
    top: 10px; /* 18px * 0.6 */
    left: 5px; /* 10px * 0.6 -> 6, but adjusted for visual balance */
    width: 2px; /* 4px * 0.6 */
    height: 2px;
  }

  .toggle__handler .crater--2 {
    top: 16px; /* 28px * 0.6 */
    left: 13px; /* 22px * 0.6 */
    width: 3px; /* 6px * 0.6 */
    height: 3px;
  }

  .toggle__handler .crater--3 {
    top: 6px; /* 10px * 0.6 */
    left: 15px; /* 25px * 0.6 */
    width: 4px; /* 8px * 0.6 */
    height: 4px;
  }

  .star {
    position: absolute;
    background-color: #fff; /* Star color */
    transition: all 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
    border-radius: 50%;
  }

  /* Scaled star dimensions and positions */
  .star--1 {
    top: 6px; /* 10px * 0.6 */
    left: 21px; /* 35px * 0.6 */
    z-index: 0;
    width: 18px; /* 30px * 0.6 */
    height: 2px; /* 3px * 0.6 */
  }

  .star--2 {
    top: 11px; /* 18px * 0.6 */
    left: 17px; /* 28px * 0.6 */
    z-index: 1;
    width: 18px; /* 30px * 0.6 */
    height: 2px; /* 3px * 0.6 */
  }

  .star--3 {
    top: 16px; /* 27px * 0.6 */
    left: 24px; /* 40px * 0.6 */
    z-index: 0;
    width: 18px; /* 30px * 0.6 */
    height: 2px; /* 3px * 0.6 */
  }

  .star--4,
  .star--5,
  .star--6 {
    opacity: 0;
    transition: all 300ms 0 cubic-bezier(0.445, 0.05, 0.55, 0.95);
  }

  .star--4 {
    top: 10px; /* 16px * 0.6 */
    left: 7px; /* 11px * 0.6 */
    z-index: 0;
    width: 1px; /* 2px * 0.6 */
    height: 1px;
    transform: translate3d(2px, 0, 0); /* 3px * 0.6 */
  }

  .star--5 {
    top: 19px; /* 32px * 0.6 */
    left: 10px; /* 17px * 0.6 */
    z-index: 0;
    width: 2px; /* 3px * 0.6 */
    height: 2px;
    transform: translate3d(2px, 0, 0);
  }

  .star--6 {
    top: 21px; /* 36px * 0.6 */
    left: 17px; /* 28px * 0.6 */
    z-index: 0;
    width: 1px; /* 2px * 0.6 */
    height: 1px;
    transform: translate3d(2px, 0, 0);
  }

  .input:checked + .toggle {
    background-color: #749dd6; /* Night background */
  }

  /* .input:checked + .toggle:before { color: #fff; } /* AM/PM hidden */
  /* .input:checked + .toggle:after { color: #749ed7; } /* AM/PM hidden */

  .input:checked + .toggle .toggle__handler {
    background-color: #ffe5b5; /* Moon color */
    /* Scaled transform (original: 40px) */
    transform: translate3d(28px, 0, 0) rotate(0); /* Approx 40px * 0.7 (60px width - 26px handler - 2*2px offset) */
  }

  .input:checked + .toggle .toggle__handler .crater {
    opacity: 1;
  }

  /* Scaled stars for night mode */
  .input:checked + .toggle .star--1 {
    width: 1px; /* 2px * 0.6 */
    height: 1px;
  }

  .input:checked + .toggle .star--2 {
    width: 2px; /* 4px * 0.6 */
    height: 2px;
    transform: translate3d(-3px, 0, 0); /* -5px * 0.6 */
  }

  .input:checked + .toggle .star--3 {
    width: 1px; /* 2px * 0.6 */
    height: 1px;
    transform: translate3d(-4px, 0, 0); /* -7px * 0.6 */
  }

  .input:checked + .toggle .star--4,
  .input:checked + .toggle .star--5,
  .input:checked + .toggle .star--6 {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }

  .input:checked + .toggle .star--4 {
    transition: all 300ms 200ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
  }

  .input:checked + .toggle .star--5 {
    transition: all 300ms 300ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
  }

  .input:checked + .toggle .star--6 {
    transition: all 300ms 400ms cubic-bezier(0.445, 0.05, 0.55, 0.95);
  }
`;

const ThemeToggle = ({ className }: { className?: string }) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder or null on the server and during initial client render
    // to avoid hydration mismatch if the theme is different.
    // A simple div matching the final size can prevent layout shifts.
    return <div style={{ width: '48px', height: '24px' }} className={className}></div>;
  }

  const isDarkMode = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <StyledWrapper className={cn(className)} title={isDarkMode ? "Activar tema claro" : "Activar tema oscuro"}>
      <div className="toggleWrapper">
        <input 
          className="input" 
          id="theme-toggle-input" 
          type="checkbox" 
          checked={isDarkMode}
          onChange={toggleTheme}
          aria-label={isDarkMode ? "Activar tema claro" : "Activar tema oscuro"}
        />
        <label className="toggle" htmlFor="theme-toggle-input">
          <span className="toggle__handler">
            <span className="crater crater--1" />
            <span className="crater crater--2" />
            <span className="crater crater--3" />
          </span>
          <span className="star star--1" />
          <span className="star star--2" />
          <span className="star star--3" />
          <span className="star star--4" />
          <span className="star star--5" />
          <span className="star star--6" />
        </label>
      </div>
    </StyledWrapper>
  );
}

export default ThemeToggle;
