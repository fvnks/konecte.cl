// src/components/ui/CustomDetailButton.tsx
'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { Eye } from 'lucide-react';
import React from 'react';

interface CustomDetailButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const CustomDetailButton: React.FC<CustomDetailButtonProps> = ({ href, children, className }) => {
  return (
    <StyledWrapper className={className}>
      <Link href={href} passHref legacyBehavior>
        {/* The <a> tag itself will act as the button and receive the styles */}
        <a className="animated-detail-button">
          {/* This inner span will be styled by the grid's second column */}
          <span className="content-wrapper">
            <Eye className="icon-part" />
            <span>{children}</span>
          </span>
        </a>
      </Link>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .animated-detail-button {
    /* Variables */
    --fs: 0.875rem; /* text-sm equivalent */
    --col1: #FFFFFF; /* White text */
    --col2: rgba(240, 128, 128, 0.603); /* Light red for effects */
    --col3: #369DF2; /* Main background blue, as requested */
    --col4: maroon; /* Dark red for effects */
    --pd-y: .5em; /* Vertical padding based on font size */
    --pd-x: .75em; /* Horizontal padding based on font size */

    /* Base styles */
    display: grid; /* Using grid as per original complex CSS for pseudo-elements */
    grid-template-columns: min-content 1fr; /* Column for pseudo-elements, column for content */
    align-items: center; /* Vertically align items within grid cells */
    align-content: baseline; /* From user CSS */
    
    appearance: none;
    border: 0;
    padding: var(--pd-y) var(--pd-x);
    font-size: var(--fs);
    font-weight: 500; /* medium */
    color: var(--col1);
    background-color: var(--col3);
    border-radius: 0.375rem; /* rounded-md */
    text-shadow: 1px 1px var(--col4);
    box-shadow: inset -2px 1px 1px var(--col2),
                inset 2px 1px 1px var(--col2);
    position: relative;
    transition: all .75s ease-out;
    transform-origin: center;
    cursor: pointer;
    text-decoration: none; /* For the Link component */
    overflow: hidden; /* To contain animated pseudo-elements if they go outside bounds */
    white-space: nowrap; /* Prevent text wrapping */
  }

  .animated-detail-button .content-wrapper {
    grid-column: 2; /* Place icon and text in the second column */
    display: inline-flex;
    align-items: center;
    gap: 0.4em; /* Space between icon and text */
  }

  .animated-detail-button .icon-part {
    height: 1.1em; /* Slightly larger relative to font-size */
    width: 1.1em;
  }

  .animated-detail-button:hover {
    color: var(--col4);
    box-shadow: inset -2px 1px 1px var(--col2),
                inset 2px 1px 1px var(--col2),
                inset 0px -2px 20px var(--col4),
                0px 20px 30px var(--col3),
                0px -20px 30px var(--col2),
                1px 2px 20px var(--col4);
    text-shadow: 1px 1px var(--col2);
  }

  .animated-detail-button:active {
    animation: offset 1s ease-in-out infinite;
    outline: 2px solid var(--col2);
    outline-offset: 0;
  }

  .animated-detail-button::after,
  .animated-detail-button::before {
    content: '';
    align-self: center;
    justify-self: center;
    height: .5em;
    margin: 0 .5em; 
    grid-column: 1; /* Pseudo-elements occupy the first column */
    grid-row: 1;
    opacity: 1;
  }

  .animated-detail-button::after {
    position: relative;
    border: 2px solid var(--col4);
    border-radius: 50%;
    transition: all .5s ease-out;
    height: .1em;
    width: .1em;
  }

  .animated-detail-button:hover::after {
    border: 2px solid var(--col3); /* Uses main bg color for hover effect */
    transform: rotate(-120deg) translate(10%, 140%);
  }

  .animated-detail-button::before {
    border-radius: 50% 0%;
    border: 4px solid var(--col4);
    box-shadow: inset 1px 1px var(--col2);
    transition: all 1s ease-out;
    transform: rotate(45deg);
    height: .45em;
    width: .45em;
  }

  .animated-detail-button:hover::before {
    border-radius: 50%;
    border: 4px solid var(--col1); /* Uses text color for hover effect */
    transform: scale(1.25) rotate(0deg);
    animation: blink 1.5s ease-out 1s infinite alternate;
  }

  .animated-detail-button:hover > .content-wrapper { /* Target the span for contrast */
    filter: contrast(150%);
  }

  @keyframes blink {
    0% {
      transform: scale(1, 1) skewX(0deg);
      opacity: 1;
    }
    5% {
      transform: scale(1.5, .1) skewX(10deg);
      opacity: .5;
    }
    10%,
    35% {
      transform: scale(1, 1) skewX(0deg);
      opacity: 1;
    }
    40% {
      transform: scale(1.5, .1) skewX(10deg);
      opacity: .25;
    }
    45%,
    100% {
      transform: scale(1, 1) skewX(0deg);
      opacity: 1;
    }
  }

  @keyframes offset {
    50% {
      outline-offset: .15em;
      outline-color: var(--col1);
    }
    55% {
      outline-offset: .1em;
      transform: translateY(1px);
    }
    80%,
    100% {
      outline-offset: 0;
    }
  }
`;

export default CustomDetailButton;
