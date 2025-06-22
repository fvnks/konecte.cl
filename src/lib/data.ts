// src/lib/data.ts

// Lista estandarizada de las 16 regiones de Chile.
// Se utiliza 'as const' para que TypeScript infiera los tipos como literales de string,
// lo que permite una validación más estricta con Zod.
export const chileanRegions = [
  "Región de Arica y Parinacota",
  "Región de Tarapacá",
  "Región de Antofagasta",
  "Región de Atacama",
  "Región de Coquimbo",
  "Región de Valparaíso",
  "Región Metropolitana de Santiago",
  "Región del Libertador General Bernardo O'Higgins",
  "Región del Maule",
  "Región de Ñuble",
  "Región del Biobío",
  "Región de La Araucanía",
  "Región de Los Ríos",
  "Región de Los Lagos",
  "Región de Aysén del General Carlos Ibáñez del Campo",
  "Región de Magallanes y de la Antártica Chilena",
] as const;

export type ChileanRegion = typeof chileanRegions[number];

// NEW MAPPING from English Geoapify names to Spanish enum values
export const regionNameToSpanish: { [key: string]: ChileanRegion | undefined } = {
  "Arica and Parinacota Region": "Región de Arica y Parinacota",
  "Tarapacá Region": "Región de Tarapacá",
  "Antofagasta Region": "Región de Antofagasta",
  "Atacama Region": "Región de Atacama",
  "Coquimbo Region": "Región de Coquimbo",
  "Valparaiso Region": "Región de Valparaíso",
  "Santiago Metropolitan Region": "Región Metropolitana de Santiago",
  "O'Higgins Region": "Región del Libertador General Bernardo O'Higgins",
  "Maule Region": "Región del Maule",
  "Ñuble Region": "Región de Ñuble",
  "Biobío Region": "Región del Biobío",
  "Araucanía Region": "Región de La Araucanía",
  "Los Ríos Region": "Región de Los Ríos",
  "Los Lagos Region": "Región de Los Lagos",
  "Aysén Region": "Región de Aysén del General Carlos Ibáñez del Campo",
  "Magallanes Region": "Región de Magallanes y de la Antártica Chilena", // Geoapify might simplify this
  "Magallanes and Chilean Antarctica Region": "Región de Magallanes y de la Antártica Chilena"
};
