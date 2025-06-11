// src/actions/requestActions.ts
'use server';

import type { RequestFormValues } from "@/components/request/RequestForm";
import { placeholderUser } from "@/lib/types"; // Usaremos un usuario placeholder por ahora

// En una aplicación real, aquí guardarías los datos en tu base de datos.
// Esta es una acción simulada.
export async function submitRequestAction(
  data: RequestFormValues
): Promise<{ success: boolean; message?: string; requestId?: string }> {
  console.log("Datos de la solicitud de propiedad recibidos en el servidor:", data);

  // Simulación de creación de solicitud
  try {
    // Aquí iría la lógica para insertar 'data' en tu base de datos MySQL.
    // También generarías un ID único, un slug, y asignarías el autor (usuario logueado).

    // Ejemplo de cómo podrías construir un objeto SearchRequest parcial:
    const newRequestPartial = {
      ...data,
      id: `req${Math.floor(Math.random() * 10000)}`, // ID simulado
      author: placeholderUser, // Usuario simulado
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentsCount: 0,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      // Ajustar campos específicos del formulario de solicitud:
      desiredLocation: {
        city: data.desiredLocationCity,
        neighborhood: data.desiredLocationNeighborhood,
      },
      // Los campos minBedrooms, minBathrooms, budgetMax ya están en 'data' si fueron provistos.
    };

    console.log("Solicitud simulada a ser guardada:", newRequestPartial);
    
    // Aquí podrías añadirlo a una lista en memoria para demostración o interactuar con una API simulada.
    // Por ejemplo, podríamos añadirlo a 'sampleRequests' (aunque esto solo sería temporal en memoria del servidor)
    // sampleRequests.unshift(newRequestPartial as any); // 'as any' por la diferencia de tipos

    // Simular un pequeño retraso de red/base de datos
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simular un error aleatorio para pruebas
    // if (Math.random() > 0.8) {
    //   return { success: false, message: "Error simulado al guardar la solicitud." };
    // }

    return { success: true, message: "Solicitud publicada exitosamente.", requestId: newRequestPartial.id };

  } catch (error) {
    console.error("Error al simular el guardado de la solicitud:", error);
    let message = "Ocurrió un error desconocido.";
    if (error instanceof Error) {
      message = error.message;
    }
    return { success: false, message };
  }
}

    