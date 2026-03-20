import type { Project } from '@/types/project';
import type { ProjectPermissions, ProjectRole } from '@/types/collaboration';

export interface Step3Props {
  project: Project;
  permissions?: ProjectPermissions | null;
  userRole?: ProjectRole | null;
  isReadOnly?: boolean;
  isAuthenticated?: boolean;
}

export interface UserApiKeys {
  hasKieKey: boolean;
  kieApiKey?: string;
}
