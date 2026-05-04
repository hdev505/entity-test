export type EntityType = "client" | "group" | "company" | "trust" | "other";
export type EntityRole = "admin" | "advisor" | "viewer";
export type RecordStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "archived";
export type SecurityLevel = "standard" | "confidential" | "restricted";

export type Entity = {
  id: number;
  created_at: string;
  type: EntityType;
  name: string;
};

export type UserEntity = {
  created_at: string;
  user_id: string;
  entity_id: number;
  role: EntityRole;
};

export type Asset = {
  id: number;
  created_at: string;
  entity_id: number;
  type: string;
  metadata: Record<string, unknown>;
};

export type DocumentRow = {
  id: number;
  created_at: string;
  entity_id: number;
  asset_id: number | null;
  type: string;
  status: RecordStatus;
  security_level: SecurityLevel;
  file_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
};

export type TransactionRow = {
  id: number;
  created_at: string;
  entity_id: number;
  asset_id: number | null;
  from_entity_id: number | null;
  to_entity_id: number | null;
  amount: number;
  currency: string;
  type: string;
  status: RecordStatus;
  reference: string | null;
  transaction_date: string | null;
  settlement_date: string | null;
};

export type ObligationType = {
  id: number;
  key: string;
  label: string;
  description: string | null;
  is_active: boolean;
};

export type Obligation = {
  id: number;
  created_at: string;
  entity_id: number;
  obligation_type_id: number | null;
  type: string | null;
  due_date: string | null;
  status: RecordStatus;
  amount: number | null;
  currency: string;
};

export type Valuation = {
  id: number;
  created_at: string;
  entity_id: number;
  asset_id: number;
  valued_at: string;
  value: number;
  currency: string;
  source: string | null;
};
