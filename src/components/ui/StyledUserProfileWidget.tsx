// src/components/ui/StyledUserProfileWidget.tsx
'use client';
import React from 'react';
import styled from 'styled-components';
import { cn } from '@/lib/utils';

interface StyledUserProfileWidgetProps {
  userName: string;
  userRole?: string;
  className?: string;
}

const StyledUserProfileWidget: React.FC<StyledUserProfileWidgetProps> = ({ userName, userRole, className }) => {
  return (
    <StyledWrapper className={cn("w-full", className)}> {/* Ensure it takes full width of its container */}
      <div className="template">
        <div 
            tabIndex={0} 
            className="popup button-container" // Renamed class to avoid conflict, styles adjusted
        >
          <div className="popup-header">
            <p className="user-name">
              {userName}
            </p>
            {/* SVG Provided by user - Using a simplified placeholder as the provided one is extremely long */}
            <svg height={32} width={32} viewBox="0 0 1024 1024" className="icon">
              <path fill="hsl(var(--primary))" d="M1021.103385 510.551692A510.551692 510.551692 0 1 1 510.551692 0a510.551692 510.551692 0 0 1 510.551693 510.551692" />
              <path fill="hsl(var(--primary-foreground))" d="M512 512m-200 0a200 200 0 1 0 400 0a200 200 0 1 0-400 0" />
              <text x="512" y="565" fontSize="250" fill="hsl(var(--primary))" textAnchor="middle" dominantBaseline="middle">
                {userName?.charAt(0).toUpperCase() || 'U'}
              </text>
            </svg>
          </div>
          <div className="popup-main">
            <ul className="list-box">
              {userRole && <li className="popup-item">{userRole}</li>}
              {/* Other items can be added here if needed later */}
            </ul>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  /* Base variables from user's design, adapted to theme */
  --fill-popup: hsl(var(--popover)); /* Background of the dropdown part */
  --fill-hover-item: hsl(var(--accent) / 0.1);
  --fill-active-item: hsl(var(--accent) / 0.2);
  --txt-main: hsl(var(--popover-foreground)); /* Text color in general for this component */
  --txt-popup-item: hsl(var(--popover-foreground));

  --br-popup: 0.625rem; /* 10px */
  --gap-popup: 0.25rem; /* 4px */
  --popup-main-h: auto; /* Adjust height based on content */

  .template {
    display: flex;
    font-size: 0.975rem;
    color: var(--txt-main);
    width: 100%;
  }

  /* Main container that looks like a button but is a div */
  .button-container {
    position: relative;
    display: flex; /* Changed from inline-block to flex */
    width: 100%; /* Take full width */
    appearance: none;
    outline: 0;
    border: 1px solid hsl(var(--border)); /* Use theme border */
    cursor: pointer;
    text-decoration: none;
    font-size: inherit;
    color: inherit;
    white-space: nowrap;
    padding: var(--gap-popup); /* Use gap for padding */
    text-align: left;
    background-color: hsl(var(--card)); /* Use card background */
    border-radius: var(--br-popup);
    transition: background-color 300ms, box-shadow 300ms;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  }

  .button-container:hover {
    background-color: hsl(var(--muted)); /* Use muted for hover */
    box-shadow: 0 2px 4px 0 rgb(0 0 0 / 0.07);
  }

  .button-container:focus,
  .button-container:active {
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.5);
  }

  .popup-header {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between; /* Distribute space */
    width: 100%;
    gap: calc(var(--gap-popup) * 2); /* Gap between name and icon */
  }

  .popup-header .user-name {
    letter-spacing: 0.5px; /* Adjusted from 1 */
    font-weight: 600;
    padding: 0.3rem 0 0.3rem 0.5rem; /* Adjusted padding */
    color: hsl(var(--foreground));
    flex-grow: 1; /* Allow name to take space */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .popup-header .icon {
    flex-shrink: 0; /* Prevent icon from shrinking */
  }


  /* Popup (dropdown) part */
  .popup-main {
    position: absolute;
    bottom: calc(100% + var(--gap-popup) + 2px); /* Position above */
    right: 0;
    left: 0; 
    opacity: 0;
    visibility: hidden; /* Hide initially */
    border-radius: var(--br-popup);
    padding: calc(var(--gap-popup) * 1.5);
    background-color: var(--fill-popup);
    box-shadow: 0px 0px 0px 1px hsl(var(--border)), 0px 4px 12px rgba(0,0,0,0.1);
    transition: opacity 0.3s ease, visibility 0s linear 0.3s, transform 0.3s ease;
    transform: translateY(5px);
    z-index: 10; /* Ensure it's above other elements in sidebar */
    min-width: 100%; /* Match width of trigger */
  }

  .button-container:focus .popup-main,
  .button-container:focus-within .popup-main { /* focus-within for better accessibility if children get focus */
    opacity: 1;
    visibility: visible;
    transition: opacity 0.3s ease, visibility 0s linear 0s, transform 0.3s ease;
    transform: translateY(0);
  }

  .list-box {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: var(--popup-main-h); /* If you want to limit height and scroll */
    overflow: auto; /* Only if max-height is set */
  }

  .popup-item {
    position: relative;
    display: block; /* Full width */
    appearance: none;
    outline: 0;
    border: 0;
    cursor: default; /* Not clickable items for now */
    text-decoration: none;
    font-size: 0.875rem; /* text-sm */
    color: var(--txt-popup-item);
    white-space: nowrap;
    padding: calc(var(--gap-popup) * 1.5) calc(var(--gap-popup) * 2);
    text-align: left;
    background-color: transparent; /* Transparent items */
    border-radius: calc(var(--br-popup) / 2);
    transition: background-color 300ms;
  }

  /* Removed hover/active for non-interactive items for now */
  /*
  .popup-item:hover {
    background-color: var(--fill-hover-item);
  }
  .popup-item:focus,
  .popup-item:active {
    background-color: var(--fill-active-item);
  }
  */
`;

export default StyledUserProfileWidget;
