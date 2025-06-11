// src/actions/propertyActions.ts
'use server';

import type { PropertyFormValues } from "@/components/property/PropertyForm";
import { placeholderUser, sampleProperties } from "@/lib/types"; // Import sampleProperties for demo

// En una aplicación real, aquí guardarías los datos en tu base de datos.
// Esta es una acción simulada.
export async function submitPropertyAction(
  data: PropertyFormValues
): Promise<{ success: boolean; message?: string; propertyId?: string }> {
  console.log("Datos de la propiedad recibidos en el servidor:", data);

  // Simulación de creación de propiedad
  try {
    // Aquí iría la lógica para insertar 'data' en tu base de datos MySQL.
    // También generarías un ID único, un slug, y asignarías el autor (usuario logueado).
    // Por ahora, solo simulamos el proceso.

    // Ejemplo de cómo podrías construir un objeto PropertyListing parcial:
    const newPropertyPartial = {
      ...data,
      id: `prop${Math.floor(Math.random() * 10000)}`, // ID simulado
      author: placeholderUser, // Usuario simulado
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      upvotes: 0,
      commentsCount: 0,
      // El slug se generaría a partir del título, ej: data.title.toLowerCase().replace(/\s+/g, '-')
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      images: data.images ? data.images.split(',').map(img => img.trim()) : [],
      features: data.features ? data.features.split(',').map(feat => feat.trim()) : [],
    };

    console.log("Propiedad simulada a ser guardada:", newPropertyPartial);
    
    // Aquí podrías añadirlo a una lista en memoria para demostración, o interactuar con una API simulada.
    // Por ejemplo, podríamos añadirlo a 'sampleProperties' (aunque esto solo sería temporal en memoria del servidor)
    // sampleProperties.unshift(newPropertyPartial as any); // 'as any' por la diferencia de tipos (FormValues vs PropertyListing)

    // Simular un pequeño retraso de red/base de datos
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simular un error aleatorio para pruebas
    // if (Math.random() > 0.8) {
    //   return { success: false, message: "Error simulado al guardar la propiedad." };
    // }

    return { success: true, message: "Propiedad publicada exitosamente.", propertyId: newPropertyPartial.id };

  } catch (error) {
    console.error("Error al simular el guardado de la propiedad:", error);
    let message = "Ocurrió un error desconocido.";
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, message };
  }
}
