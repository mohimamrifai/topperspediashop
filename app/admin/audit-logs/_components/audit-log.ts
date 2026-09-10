type AuditLog = {
  id: string;
  action: string;
  amount: string | null;
  note: string | null;
  metadata: string | null;
  createdAt: string;
  actorId: string | null;
  actorUsername: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetUsername: string | null;
  targetRole: string | null;
};

export default AuditLog;