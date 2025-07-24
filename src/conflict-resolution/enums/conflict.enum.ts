export enum ConflictType {
  BOUNDARY_DISPUTE = 'boundary_dispute',
  OWNERSHIP_DISPUTE = 'ownership_dispute',
  INHERITANCE_DISPUTE = 'inheritance_dispute',
  ENCROACHMENT = 'encroachment',
  ACCESS_RIGHT = 'access_right',
  EASEMENT_DISPUTE = 'easement_dispute',
  TAX_DISPUTE = 'tax_dispute',
  PERMIT_DISPUTE = 'permit_dispute',
  OTHER = 'other',
}

export enum ConflictStatus {
  REPORTED = 'reported',
  ASSIGNED = 'assigned',
  INVESTIGATING = 'investigating',
  MEDIATING = 'mediating',
  HEARING_SCHEDULED = 'hearing_scheduled',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

export enum ConflictPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ResolutionMethod {
  MEDIATION = 'mediation',
  ARBITRATION = 'arbitration',
  LEGAL_RULING = 'legal_ruling',
  ADMINISTRATIVE_DECISION = 'administrative_decision',
  NEGOTIATION = 'negotiation',
  COURT_ORDER = 'court_order',
}
