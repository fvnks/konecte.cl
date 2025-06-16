
// src/app/api/upload-image-to-cpanel/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import FormData from 'form-data'; // Necesario para construir el FormData para el servidor PHP

export async function POST(request: NextRequest) {
  console.log('[API UploadToCPanel] Received POST request.');

  try {
    const cpanelUploadEndpoint = process.env.CPANEL_UPLOAD_ENDPOINT_URL;
    if (!cpanelUploadEndpoint) {
      console.error('[API UploadToCPanel] Error: CPANEL_UPLOAD_ENDPOINT_URL no está configurado.');
      return NextResponse.json({ success: false, message: 'Error de configuración del servidor: Endpoint de subida no definido.' }, { status: 500 });
    }

    const requestFormData = await request.formData();
    const imageFile = requestFormData.get('imageFile') as File | null;

    if (!imageFile) {
      console.log('[API UploadToCPanel] No se recibió imageFile.');
      return NextResponse.json({ success: false, message: 'No se recibió ningún archivo de imagen.' }, { status: 400 });
    }

    console.log(`[API UploadToCPanel] Procesando archivo: ${imageFile.name}, Tamaño: ${imageFile.size}, Tipo: ${imageFile.type}`);

    // Crear un nuevo FormData para enviar al script PHP
    const phpFormData = new FormData();
    // El script PHP esperará un array de archivos bajo el nombre 'images[]', o un solo archivo 'imageFile'.
    // Ajusta 'images[]' o 'imageFile' según cómo tu script PHP espere recibir los archivos.
    // Para un solo archivo, 'imageFile' podría ser más simple.
    // Si tu script PHP espera `$_FILES['images']` (como un array, incluso para un solo archivo), usarías:
    // phpFormData.append('images[]', Buffer.from(await imageFile.arrayBuffer()), imageFile.name);
    // Si tu script PHP espera `$_FILES['imageFile']` (para un solo archivo):
    phpFormData.append('imageFile', Buffer.from(await imageFile.arrayBuffer()), {
      filename: imageFile.name,
      contentType: imageFile.type,
    });
    
    console.log(`[API UploadToCPanel] Enviando archivo a endpoint de cPanel: ${cpanelUploadEndpoint}`);

    const phpResponse = await fetch(cpanelUploadEndpoint, {
      method: 'POST',
      body: phpFormData as any, // Castear a 'any' si fetch se queja del tipo FormData de la librería
      headers: phpFormData.getHeaders ? phpFormData.getHeaders() : undefined, // Necesario para form-data
    });

    console.log(`[API UploadToCPanel] Respuesta de cPanel recibida. Status: ${phpResponse.status}`);
    const phpResultText = await phpResponse.text();
    console.log(`[API UploadToCPanel] Texto de respuesta de cPanel: ${phpResultText}`);

    if (!phpResponse.ok) {
      console.error(`[API UploadToCPanel] Error desde el script de cPanel. Status: ${phpResponse.status}. Respuesta: ${phpResultText}`);
      return NextResponse.json({ success: false, message: `Error del servidor cPanel: ${phpResponse.statusText}. Detalles: ${phpResultText}` }, { status: phpResponse.status });
    }

    let phpJsonResult;
    try {
      phpJsonResult = JSON.parse(phpResultText);
    } catch (e) {
      console.error(`[API UploadToCPanel] Error parseando JSON de cPanel: ${phpResultText}`, e);
      return NextResponse.json({ success: false, message: 'Respuesta inválida del servidor cPanel. No es JSON válido.' }, { status: 500 });
    }
    
    console.log('[API UploadToCPanel] Resultado JSON de cPanel:', phpJsonResult);

    if (phpJsonResult.success && phpJsonResult.url) { // Asumiendo que tu script PHP devuelve { success: true, url: '...' }
      return NextResponse.json({ success: true, url: phpJsonResult.url });
    } else if (phpJsonResult.success && phpJsonResult.urls && phpJsonResult.urls.length > 0) { // Si devuelve un array de URLs (para subida múltiple)
      return NextResponse.json({ success: true, url: phpJsonResult.urls[0] }); // Devolver la primera URL para subida de un solo archivo
    } else {
      const errorMessage = phpJsonResult.message || phpJsonResult.error || (phpJsonResult.errors && phpJsonResult.errors.join(', ')) || 'Error desconocido del script de cPanel al guardar la imagen.';
      console.error(`[API UploadToCPanel] El script de cPanel reportó un error: ${errorMessage}`);
      return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API UploadToCPanel] Error interno en el API route:', error.message, error.stack);
    return NextResponse.json({ success: false, message: `Error interno del servidor: ${error.message}` }, { status: 500 });
  }
}

