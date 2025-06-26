'use client';

import { useEffect, useState } from 'react';

interface Props {
  date: string | Date;
  options?: Intl.DateTimeFormatOptions;
  prefix?: string;
  className?: string;
}

export default function ClientFormattedDate({ date, options, prefix, className }: Props) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const dateObj = new Date(date);
    setFormattedDate(dateObj.toLocaleDateString('es-CL', options));
  }, [date, options]);

  if (!formattedDate) {
    return null; // O un esqueleto de carga
  }

  return (
    <span className={className}>
      {prefix}{formattedDate}
    </span>
  );
} 