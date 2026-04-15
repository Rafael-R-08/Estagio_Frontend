import JSZip from 'jszip';
import type { Certificate } from '@/types';

/**
 * Downloads a list of certificates as a single ZIP file.
 * @param certificates List of certificates to export
 * @param onProgress Callback to report progress (0 to 1)
 */
export async function exportCertificatesToZip(
  certificates: Certificate[],
  onProgress?: (progress: number) => void
): Promise<void> {
  const zip = new JSZip();
  const total = certificates.length;

  for (let i = 0; i < total; i++) {
    const cert = certificates[i];
    try {
      const response = await fetch(cert.fileUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${cert.fileUrl}`);
      
      const blob = await response.blob();
      
      // Determine filename: CourseName_Provider.extension or from URL
      const extension = cert.fileUrl.split('.').pop()?.split('?')[0] || 'pdf';
      const safeTitle = (cert.courseName ?? cert.training?.title ?? 'Certificado')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .substring(0, 50);
      const safeProvider = (cert.provider ?? 'Softinsa')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .substring(0, 30);
      
      const filename = `${safeTitle}_${safeProvider}.${extension}`;
      
      zip.file(filename, blob);
    } catch (error) {
      console.error(`Error adding certificate ${cert.id} to zip:`, error);
    }
    
    if (onProgress) {
      onProgress((i + 1) / total);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Certificados_Softinsa_${new Date().toISOString().slice(0,10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
