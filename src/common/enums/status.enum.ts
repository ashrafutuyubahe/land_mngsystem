export enum LandStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
  DISPUTED = 'disputed',
  TRANSFERRED = 'transferred',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum LandUseType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  AGRICULTURAL = 'agricultural',
  INDUSTRIAL = 'industrial',
  MIXED_USE = 'mixed_use',
  GOVERNMENT = 'government',
  RECREATIONAL = 'recreational',
  FOREST = 'forest',
  WETLAND = 'wetland',
}

export enum TransferStatus {
  INITIATED = 'initiated',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ConflictStatus {
  SUBMITTED = 'submitted',
  UNDER_INVESTIGATION = 'under_investigation',
  MEDIATION_SCHEDULED = 'mediation_scheduled',
  IN_MEDIATION = 'in_mediation',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
}

export enum PermitStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum TaxStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  PARTIAL = 'partial',
  EXEMPTED = 'exempted',
}
