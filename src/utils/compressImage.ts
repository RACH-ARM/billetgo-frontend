// Compresse une image côté navigateur avant upload (photo couverture événement).
// Les photos de téléphone modernes dépassent souvent 10 Mo (limite serveur) — sans
// ça, l'upload échoue avec une erreur réseau générique que le frontend ne sait pas
// distinguer d'une vraie erreur serveur (voir handleSubmit dans MesEvenements.tsx).
const MAX_DIMENSION = 1920; // largement suffisant, jamais affiché plus grand sur le site
const JPEG_QUALITY = 0.82;
const SKIP_IF_UNDER_BYTES = 1.5 * 1024 * 1024; // déjà raisonnable, inutile de retoucher

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= SKIP_IF_UNDER_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    // En cas d'échec (format non supporté par createImageBitmap, etc.), on
    // retombe sur le fichier d'origine plutôt que de bloquer l'utilisateur.
    return file;
  }
}
