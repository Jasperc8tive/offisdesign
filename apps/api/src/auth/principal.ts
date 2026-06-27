import type { PrincipalKind } from './token.service';

export interface Principal {
  kind: PrincipalKind;
  id: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
}
