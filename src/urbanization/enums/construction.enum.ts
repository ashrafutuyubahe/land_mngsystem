export enum ConstructionType {
  RESIDENTIAL = 'residential',
  RESIDENTIAL_HOUSE = 'residential_house',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  INSTITUTIONAL = 'institutional',
  MIXED_USE = 'mixed_use',
  INFRASTRUCTURE = 'infrastructure',
  RENOVATION = 'renovation',
  EXTENSION = 'extension',
}

export enum PermitStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING_DOCUMENTS = 'pending_documents',
  INSPECTION_REQUIRED = 'inspection_required',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
}

export enum InspectionType {
  FOUNDATION = 'foundation',
  STRUCTURAL = 'structural',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  FIRE_SAFETY = 'fire_safety',
  FINAL = 'final',
  COMPLIANCE = 'compliance',
}

export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PASSED = 'passed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}
