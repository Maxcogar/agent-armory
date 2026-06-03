export type HumanOverrideAction =
  | 'add_known_fact'
  | 'add_relevant_file'
  | 'add_forbidden_move'
  | 'add_allowed_creation'
  | 'add_constraint'
  | 'resolve_unknown';

export interface HumanOverrideRequest {
  action: HumanOverrideAction;
  reason: string;
  path?: string;
  statement?: string;
  description?: string;
  category?: string;
}
