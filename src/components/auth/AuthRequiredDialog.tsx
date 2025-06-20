// src/components/auth/AuthRequiredDialog.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { UserPlus, LogIn, AlertTriangle } from 'lucide-react'; // Changed icon

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectPath: string;
}

const AuthRequiredDialog: React.FC<AuthRequiredDialogProps> = ({ open, onOpenChange, redirectPath }) => {
  if (!open) return null;

  return (
    <Overlay onClick={() => onOpenChange(false)}>
      <StyledWrapper onClick={(e) => e.stopPropagation()}> {/* Prevent overlay click from closing if clicking inside card */}
        <div className="notificationCard">
          <AlertTriangle className="mainIcon" /> {/* Changed Icon */}
          <p className="notificationHeading">Registro Requerido</p>
          <p className="notificationPara">
            Para publicar, primero debes iniciar sesión o crear una cuenta. Es rápido y fácil.
          </p>
          <div className="buttonContainer">
            <Link href={`/auth/signup?redirect=${encodeURIComponent(redirectPath)}`} passHref legacyBehavior>
              <a className="ActionBtn primaryBtn" onClick={() => onOpenChange(false)}>
                <UserPlus size={15} style={{ marginRight: '7px' }} /> Registrarse
              </a>
            </Link>
            <Link href={`/auth/signin?redirect=${encodeURIComponent(redirectPath)}`} passHref legacyBehavior>
              <a className="ActionBtn secondaryBtn" onClick={() => onOpenChange(false)}>
                <LogIn size={15} style={{ marginRight: '7px' }} /> Iniciar Sesión
              </a>
            </Link>
            <button className="ActionBtn cancelBtn" onClick={() => onOpenChange(false)}>
                Cancelar
            </button>
          </div>
        </div>
      </StyledWrapper>
    </Overlay>
  );
};

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: hsla(var(--background) / 0.6); /* More subtle overlay */
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000; /* Ensure it's on top */
  padding: 1rem;
`;

const StyledWrapper = styled.div`
  .notificationCard {
    width: 100%;
    max-width: 320px; /* Max width */
    min-height: 300px; /* Min height for consistent look */
    background: hsl(var(--popover));
    color: hsl(var(--popover-foreground));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px; /* Adjusted padding */
    gap: 18px; /* Adjusted gap */
    box-shadow: 0 10px 25px hsla(var(--shadow) / 0.15), 0 5px 10px hsla(var(--shadow) / 0.1);
    border-radius: var(--radius); /* Using theme radius */
    border: 1px solid hsl(var(--border));
    text-align: center; /* Center text by default */
  }

  .mainIcon {
    width: 45px; /* Adjusted size */
    height: 45px;
    color: hsl(var(--primary));
    margin-bottom: 0px; /* Reduced margin */
  }

  .notificationHeading {
    color: hsl(var(--foreground));
    font-weight: 600;
    font-size: 1.2em; /* Larger heading */
  }

  .notificationPara {
    color: hsl(var(--muted-foreground));
    font-size: 0.9em; /* Slightly larger paragraph */
    font-weight: 500;
    line-height: 1.5;
  }

  .buttonContainer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    margin-top: 12px; /* Margin for buttons */
  }

  .ActionBtn {
    width: 100%;
    height: 38px; /* Standardized height */
    border: none;
    border-radius: calc(var(--radius) - 2px);
    font-size: 0.875em; /* text-sm like */
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;
    text-decoration: none;
    padding: 0 1rem; /* Horizontal padding for text */
  }

  .ActionBtn.primaryBtn {
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }
  .ActionBtn.primaryBtn:hover {
    background-color: hsl(var(--primary) / 0.9);
  }

  .ActionBtn.secondaryBtn {
    background-color: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
    border: 1px solid hsl(var(--border));
  }
  .ActionBtn.secondaryBtn:hover {
    background-color: hsl(var(--secondary) / 0.8);
  }
  
  .ActionBtn.cancelBtn {
    background-color: transparent;
    color: hsl(var(--muted-foreground));
    border: 1px solid transparent;
  }
  .ActionBtn.cancelBtn:hover {
    background-color: hsl(var(--muted) / 0.5);
    color: hsl(var(--foreground));
  }
`;

export default AuthRequiredDialog;
