import { useParams, Navigate } from "react-router-dom";
import { useBiSettings } from "@/hooks/useBiSettings";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/NotFound";

// Map page_id to lazy-loaded page components
const pageComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  minutas: lazy(() => import("@/pages/Index")),
  estoque: lazy(() => import("@/pages/Estoque")),
  entregas: lazy(() => import("@/pages/Entregas")),
  tracking: lazy(() => import("@/pages/Tracking")),
  "estoque-consolidado": lazy(() => import("@/pages/EstoqueConsolidado")),
  faturamento: lazy(() => import("@/pages/Faturamento")),
  analitico: lazy(() => import("@/pages/Analitico")),
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-dashboard-dark flex items-center justify-center">
    <Skeleton className="h-12 w-48" />
  </div>
);

const DynamicBiRoute = () => {
  const { slug } = useParams<{ slug: string }>();
  const { settings, loading } = useBiSettings();

  if (loading) return <LoadingFallback />;
  if (!slug) return <Navigate to="/" replace />;

  // First try to find by slug
  const settingBySlug = settings.find((s) => s.slug === slug);

  if (!settingBySlug) {
    // If URL matches a page_id that has a custom slug, redirect to the slug
    const settingByPageId = settings.find((s) => s.page_id === slug);
    if (settingByPageId && settingByPageId.slug && settingByPageId.slug !== settingByPageId.page_id) {
      return <Navigate to={`/${settingByPageId.slug}`} replace />;
    }
    // If found by page_id without custom slug, render it
    if (settingByPageId) {
      const PageComponent = pageComponents[settingByPageId.page_id];
      if (!PageComponent) return <NotFound />;
      return (
        <Suspense fallback={<LoadingFallback />}>
          <PageComponent />
        </Suspense>
      );
    }
    return <NotFound />;
  }

  const PageComponent = pageComponents[settingBySlug.page_id];
  if (!PageComponent) return <NotFound />;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageComponent />
    </Suspense>
  );
};

export default DynamicBiRoute;
