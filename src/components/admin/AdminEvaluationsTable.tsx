
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Target, Edit } from "lucide-react";

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

interface AdminEvaluationsTableProps {
  evaluationList: AdminEvaluation[];
}

export const AdminEvaluationsTable = ({ evaluationList }: AdminEvaluationsTableProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleEdit = (evaluation: AdminEvaluation) => {
    // Clean up any existing URL parameters first
    const baseUrl = window.location.origin + window.location.pathname;
    
    // Create URL parameters for the evaluation data
    const params = new URLSearchParams();
    params.set('editId', evaluation.id);
    
    if (evaluation.use_case) {
      params.set('useCase', evaluation.use_case);
    } else {
      params.set('useCase', 'custom');
      params.set('customUseCase', evaluation.custom_use_case || '');
    }
    
    params.set('prompt', evaluation.prompt);
    
    // Navigate to the evaluator tab with clean parameters
    const newUrl = `${baseUrl}?${params.toString()}#evaluate`;
    console.log('Navigating to:', newUrl);
    window.location.href = newUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Recent Evaluations (Past 24 Hours)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {evaluationList.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent evaluations</h3>
            <p className="text-gray-600">No evaluations have been submitted in the past 24 hours.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Use Case</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationList.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell className="font-medium">
                    {evaluation.user_name}
                  </TableCell>
                  <TableCell>
                    {evaluation.user_email}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {truncateText(evaluation.use_case || evaluation.custom_use_case || 'N/A', 50)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-sm">
                      {truncateText(evaluation.prompt, 80)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getScoreColor(evaluation.score)}>
                      {evaluation.score}/10
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(evaluation.created_at)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(evaluation)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
