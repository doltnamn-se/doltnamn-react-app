import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "./LoadingSpinner";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/useUserProfile";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  customerOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly, customerOnly }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { userEmail, isInitializing } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setIsAuthenticated(!!session);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Protected route error:", error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
          toast.error("Authentication error. Please try logging in again.");
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading || isInitializing) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const isAdmin = userEmail === 'info@doltnamn.se';

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (customerOnly && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};