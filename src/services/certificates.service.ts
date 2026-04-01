import { api } from '../lib/axios';
import type { Certificate, UpdateCertificateDto, CertificateJob } from '../types';

export const certificatesService = {
  /** Todos os certificados do utilizador logado */
  getAll: () => 
    api.get<Certificate[]>('/certificates/me'),

  /** Alertas de renovação e expiração */
  getRenewalAlerts: () =>
    api.get<{
      expiringAlerts: { courseName: string; daysRemaining: number; message: string }[];
      staleKnowledgeSuggestions: { courseName: string; monthsSinceCompletion: number; message: string }[];
    }>('/certificates/renewal-alerts'),

  /** Detalhe por ID */
  getById: (id: string) => 
    api.get<Certificate>(`/certificates/${id}`),

  /** 
   * Upload assíncrono (Job based - BullMQ)
   * Retorna { jobId, status: 'PENDING' }
   */
  upload: (file: File, trainingId: string, meta?: Partial<UpdateCertificateDto>) => {
    const form = new FormData();
    form.append('file', file);
    form.append('trainingId', trainingId);
    if (meta?.courseName) form.append('courseName', meta.courseName);
    if (meta?.provider) form.append('provider', meta.provider);
    if (meta?.completionDate) form.append('completionDate', meta.completionDate);
    if (meta?.expirationDate) form.append('expirationDate', meta.expirationDate);
    if (meta?.durationHours !== undefined) form.append('durationHours', String(meta.durationHours));
    
    return api.post<CertificateJob>('/certificates', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Consulta estado do job (polling ou status update) */
  getJobStatus: (jobId: string) =>
    api.get<CertificateJob>(`/certificates/job/${jobId}`),

  /** Edição manual de metadados extraídos */
  update: (id: string, dto: UpdateCertificateDto) =>
    api.patch<Certificate>(`/certificates/${id}`, dto),

  /** Forçar re-extração via IA */
  reextract: (id: string) =>
    api.post<CertificateJob>(`/certificates/${id}/reextract`),

  /** Eliminar certificado */
  delete: (id: string) => 
    api.delete(`/certificates/${id}`),
};
