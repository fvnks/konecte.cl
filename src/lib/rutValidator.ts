// src/lib/rutValidator.ts

/**
 * Valida un RUT chileno.
 * @param rutCompleto El RUT completo con puntos y guion (opcional) y dígito verificador.
 * @returns {boolean} True si el RUT es válido, false en caso contrario.
 */
export function validarRut(rutCompleto: string | null | undefined): boolean {
  if (!rutCompleto || typeof rutCompleto !== 'string') {
    return false;
  }

  // Limpiar formato: quitar puntos, guión y pasar a mayúsculas
  const rutLimpio = rutCompleto.replace(/^0+|[^0-9kK]+/g, '').toUpperCase();

  if (rutLimpio.length < 2) {
    return false; // RUT debe tener al menos cuerpo y DV
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  // Validar que el cuerpo contenga solo números
  if (!/^\d+$/.test(cuerpo)) {
    return false;
  }

  let suma = 0;
  let multiplo = 2;

  // Calcular suma ponderada
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  // Calcular dígito verificador esperado
  const dvEsperado = 11 - (suma % 11);
  const dvFinal =
    dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  // Comparar DV calculado con el DV ingresado
  return dvFinal === dv;
}
