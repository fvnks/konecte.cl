// src/components/plan/PlanDisplayCard.tsx
'use client';

import React from 'react';
import styled from 'styled-components';
import type { Plan } from '@/lib/types';
import Link from 'next/link'; // Assuming the button might link somewhere

const StyledWrapper = styled.div`
  .pack-container {
    position: relative;
    display: flex;
    max-width: 350px; /* Max width for the card */
    width: 100%; /* Ensure it takes full width of its grid cell */
    min-height: 380px; /* Minimum height to maintain consistency */
    flex-direction: column;
    border-radius: 12px;
    background-color: #2c2c2c; /* Slightly lighter dark */
    border: 1px solid #444; /* Darker border */
    padding: 1.6rem;
    color: #f0f0f0; /* Off-white text */
    box-shadow: 0 6px 12px -2px rgb(0 0 0 / 0.25), 0 4px 8px -3px rgb(0 0 0 / 0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .pack-container:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px -3px rgb(0 0 0 / 0.3), 0 6px 12px -4px rgb(0 0 0 / 0.25);
  }

  .header {
    position: relative;
    margin: 0;
    margin-bottom: 2rem;
    overflow: hidden;
    border-radius: 0;
    border-bottom: 1px solid #555; /* Slightly lighter separator */
    background: transparent;
    padding-bottom: 1rem;
    text-align: center;
  }

  .title {
    display: block;
    font-family: 'Inter', sans-serif; /* Using Inter like the rest of the app */
    font-size: 1rem; /* 16px, slightly larger */
    line-height: 1.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #e0e0e0; /* Lighter title */
    font-weight: 600;
  }

  .price-container {
    margin-top: 0.75rem; /* 12px */
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 3.5rem; /* Slightly smaller for better fit */
    line-height: 1;
    color: hsl(var(--primary)); /* Use primary color from theme */
    font-weight: 700;
  }

  .price-container span:first-child {
    margin-top: 0.625rem; /* 10px */
    font-size: 1.5rem; /* 24px */
    line-height: 2rem;
    color: hsl(var(--primary) / 0.8);
  }

  .price-container span:last-child {
    align-self: flex-end;
    font-size: 1.25rem; /* 20px */
    line-height: 2rem;
    color: #a0a0a0; /* Lighter suffix */
    margin-left: 2px;
    margin-bottom: 0.25rem; /* Align with baseline of large number */
  }

  .lists {
    display: flex;
    flex-direction: column;
    gap: 0.75rem; /* 12px */
    margin-bottom: 1.5rem; /* Space before button */
    flex-grow: 1; /* Allow list to take available space */
  }

  .list {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.875rem; /* 14px */
  }

  .list span.icon-wrapper {
    border-radius: 50%;
    border: 1px solid hsl(var(--primary) / 0.3);
    background-color: hsl(var(--primary) / 0.15);
    height: 26px; /* Slightly smaller */
    width: 26px; /* Slightly smaller */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .list span.icon-wrapper svg {
    height: 13px; /* Adjusted */
    width: 13px; /* Adjusted */
    stroke: hsl(var(--primary)); /* Primary color for checkmark */
  }

  .list p {
    display: block;
    font-family: 'Inter', sans-serif;
    color: #c0c0c0; /* Lighter paragraph text */
    line-height: 1.4;
  }

  .button-container {
    margin-top: auto; /* Push button to bottom if card has extra space */
    padding: 0;
  }

  .button-container button {
    display: block;
    width: 100%;
    background-color: hsl(var(--primary)); /* Primary color for button */
    padding: 0.75rem 1.25rem; /* 12px 20px */
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: hsl(var(--primary-foreground)); /* Contrast text */
    outline: 0;
    border: 0;
    border-radius: 8px; /* Slightly smaller radius */
    font-weight: 600;
    font-size: 0.875rem; /* 14px */
    transition: background-color 0.2s ease, transform 0.1s ease;
  }

  .button-container button:hover:not(:disabled) {
    background-color: hsl(var(--primary) / 0.85); /* Darken on hover */
  }
  .button-container button:active:not(:disabled) {
    transform: scale(0.98);
  }
  .button-container button:disabled {
    background-color: #555;
    color: #999;
    cursor: not-allowed;
  }
`;

interface PlanDisplayCardProps {
  plan: Plan;
}

function getDisplayableFeatures(plan: Plan): { text: string; included: boolean }[] {
  const features = [];

  if (plan.max_properties_allowed === null || plan.max_properties_allowed > 1000) {
    features.push({ text: "Propiedades Ilimitadas", included: true });
  } else if (plan.max_properties_allowed !== undefined) {
    features.push({ text: `${plan.max_properties_allowed} Propiedades`, included: true });
  }

  if (plan.max_requests_allowed === null || plan.max_requests_allowed > 1000) {
    features.push({ text: "Solicitudes Ilimitadas", included: true });
  } else if (plan.max_requests_allowed !== undefined) {
    features.push({ text: `${plan.max_requests_allowed} Solicitudes`, included: true });
  }

  if (plan.max_ai_searches_monthly === null || plan.max_ai_searches_monthly > 1000) {
     features.push({ text: "Búsquedas IA Ilimitadas", included: true });
  } else if (plan.max_ai_searches_monthly !== undefined && plan.max_ai_searches_monthly > 0) {
    features.push({ text: `${plan.max_ai_searches_monthly} Búsquedas IA/mes`, included: true });
  } else {
    features.push({ text: "Búsquedas IA Básicas", included: false });
  }

  features.push({ text: "Destacar Propiedades", included: !!plan.can_feature_properties });
  features.push({ text: "Ver Datos de Contacto", included: !!plan.can_view_contact_data });
  features.push({ text: "Alertas Automáticas (IA+WA)", included: !!plan.automated_alerts_enabled });
  features.push({ text: "Panel de Control Avanzado", included: !!plan.advanced_dashboard_access });
  
  // Prioritize features that are true, then up to 4 total features
  features.sort((a, b) => (b.included ? 1 : 0) - (a.included ? 1 : 0));
  return features.slice(0, 4); // Show max 4 features
}


export default function PlanDisplayCard({ plan }: PlanDisplayCardProps) {
  const isFreePlan = plan.price_monthly === 0;
  const formattedPrice = isFreePlan ? 'Gratis' : plan.price_monthly.toLocaleString('es-CL');
  const priceSuffix = plan.price_currency?.toUpperCase() === 'UF' ? 'UF' : 'CLP';
  
  const displayFeatures = getDisplayableFeatures(plan);

  return (
    <StyledWrapper>
      <div className="pack-container">
        <div className="header">
          <p className="title">
            {plan.name}
          </p>
          <div className="price-container">
            {!isFreePlan && <span>$</span>}
            {formattedPrice}
            {!isFreePlan && <span>/{priceSuffix === 'UF' ? 'mes' : 'mes'}</span>}
          </div>
        </div>
        <div>
          <ul className="lists">
            {displayFeatures.map((feature, index) => (
              <li className="list" key={index}>
                <span className="icon-wrapper">
                  <svg aria-hidden="true" stroke="currentColor" strokeWidth={feature.included ? 2.5 : 1.5} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                    style={{ opacity: feature.included ? 1 : 0.5 }}>
                    <path d={feature.included ? "M4.5 12.75l6 6 9-13.5" : "M6 18L18 6M6 6l12 12"} strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                </span>
                <p style={{ textDecoration: !feature.included ? 'line-through' : 'none', opacity: feature.included ? 1 : 0.6 }}>
                  {feature.text}
                </p>
              </li>
            ))}
            {plan.description && displayFeatures.length < 4 && (
                 <li className="list">
                    <span className="icon-wrapper">
                        <svg aria-hidden="true" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinejoin="round" strokeLinecap="round"></path>
                        </svg>
                    </span>
                     <p className="italic">{plan.description}</p>
                 </li>
            )}
          </ul>
        </div>
        <div className="button-container">
          <Link href="/auth/signup" passHref>
            <button type="button">
              {isFreePlan ? 'Comenzar Gratis' : 'Contratar Plan'}
            </button>
          </Link>
        </div>
      </div>
    </StyledWrapper>
  );
}
