export function formatDocType(contentType: string | null): string {
  if (!contentType) return 'N/A';

  switch (contentType) {
    case 'application/pdf':
      return 'PDF';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'DOCX';
    case 'text/plain':
      return 'TXT';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'XLSX';
    case 'application/vnd.ms-excel':
      return 'XLS';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'PPTX';
    case 'application/vnd.ms-powerpoint':
      return 'PPT';
    case 'text/csv':
      return 'CSV';
    // Puedes añadir más casos aquí (ej. ¿añado imágenes?)
    default:
      // Intenta devolver una versión acortada si no es conocido
      return contentType.split('/').pop()?.toUpperCase() || 'File';
  }
}

// Función para obtener el nombre del archivo sin la última extensión
export const getFilenameWithoutExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('.');
  }
  return filename;
};