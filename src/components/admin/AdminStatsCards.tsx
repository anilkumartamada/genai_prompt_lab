
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users } from "lucide-react";

interface AdminEvaluation {
  id: string;
  user_name: string;
  user_email: string;
  use_case: string | null;
  custom_use_case: string | null;
  prompt: string;
  score: number;
  created_at: string;
}

interface AdminStatsCardsProps {
  evaluationList: AdminEvaluation[];
}

export const AdminStatsCards = ({ evaluationList }: AdminStatsCardsProps) => {
  const averageScore = evaluationList.length > 0 
    ? (evaluationList.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluationList.length).toFixed(1)
    : '0';

  const uniqueUsers = new Set(evaluationList.map(evaluation => evaluation.user_email)).size;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{evaluationList.length}</div>
          <p className="text-xs text-muted-foreground">Past 24 hours</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageScore}</div>
          <p className="text-xs text-muted-foreground">Out of 10</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueUsers}</div>
          <p className="text-xs text-muted-foreground">Unique users</p>
        </CardContent>
      </Card>
    </div>
  );
};
