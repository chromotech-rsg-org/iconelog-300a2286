import { useAuth } from "@/contexts/AuthContext";
import { PagePermission } from "@/data/authData";

interface UsePermissionsReturn {
  canView: boolean;
  canExport: boolean;
  canRefresh: boolean;
  isDevOnly: boolean;
  isAuthenticated: boolean;
  isDeveloper: boolean;
  permission: PagePermission | null;
}

export const usePermissions = (pageId: string): UsePermissionsReturn => {
  const auth = useAuth();
  
  return {
    canView: auth.canView(pageId),
    canExport: auth.canExport(pageId),
    canRefresh: auth.canRefresh(pageId),
    isDevOnly: auth.isDevOnly(pageId),
    isAuthenticated: auth.isAuthenticated,
    isDeveloper: auth.isDeveloper,
    permission: auth.getPermission(pageId),
  };
};
