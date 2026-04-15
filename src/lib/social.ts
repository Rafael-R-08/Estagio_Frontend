import type { Certificate } from '@/types';

/**
 * Generates a LinkedIn "Add to Profile" URL for a certification.
 * Documentation: https://addtoprofile.linkedin.com/
 */
export function getLinkedInCertificationUrl(cert: Certificate): string {
  const name = encodeURIComponent(cert.courseName ?? cert.training?.title ?? 'Certificado');
  const organizationName = encodeURIComponent(cert.provider ?? 'Softinsa');
  
  let issueYear = '';
  let issueMonth = '';
  
  if (cert.completionDate) {
    const date = new Date(cert.completionDate);
    issueYear = date.getFullYear().toString();
    issueMonth = (date.getMonth() + 1).toString();
  }

  const certId = cert.id ? encodeURIComponent(cert.id) : '';
  const certUrl = cert.fileUrl ? encodeURIComponent(cert.fileUrl) : '';

  // LinkedIn "Add to Profile" base URL
  let url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${name}&organizationName=${organizationName}`;
  
  if (issueYear) url += `&issueYear=${issueYear}`;
  if (issueMonth) url += `&issueMonth=${issueMonth}`;
  if (certId) url += `&certId=${certId}`;
  if (certUrl) url += `&certUrl=${certUrl}`;

  return url;
}
