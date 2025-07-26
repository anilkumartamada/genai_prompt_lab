
import { AdminStatsCards } from "./admin/AdminStatsCards";
import { AdminEvaluationsTable } from "./admin/AdminEvaluationsTable";
import { useAdminEvaluations } from "@/hooks/useAdminEvaluations";

export const AdminPanel = () => {
  const { evaluationList, loading } = useAdminEvaluations();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminStatsCards evaluationList={evaluationList} />
      <AdminEvaluationsTable evaluationList={evaluationList} />
    </div>
  );
};
