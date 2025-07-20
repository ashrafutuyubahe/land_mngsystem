export enum ConflictType {
  BOUNDARY_DISPUTE = 'boundary_dispute',
  OWNERSHIP_DISPUTE = 'ownership_dispute',
  INHERITANCE_DISPUTE = 'inheritance_dispute',
  ENCROACHMENT = 'encroachment',
  ILLEGAL_OCCUPATION = 'illegal_occupation',
  DOCUMENTATION_DISPUTE = 'documentation_dispute',
  EASEMENT_DISPUTE = 'easement_dispute',
  ZONING_VIOLATION = 'zoning_violation',
  ENVIRONMENTAL_ISSUE = 'environmental_issue',
  OTHER = 'other',
}

export enum ConflictPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ConflictStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  MEDIATING = 'mediating',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}
