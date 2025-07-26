import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Edit, Calendar, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface HistoryPanelProps {
  userId: string;
}
interface Evaluation {
  id: string;
  use_case: string | null;
  custom_use_case: string | null;
  prompt: string;
  evaluation_result: any;
  score: number;
  created_at: string;
}
export const HistoryPanel = ({
  userId
}: HistoryPanelProps) => {
  const [evaluationList, setEvaluationList] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchEvaluations();
  }, [userId]);
  const fetchEvaluations = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('prompt_evaluations').select('*').eq('user_id', userId).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setEvaluationList(data as any[] || []);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast({
        title: "Error",
        description: "Failed to load evaluation history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (evaluation: Evaluation) => {
    // Navigate to evaluator tab with edit parameter
    const url = new URL(window.location.href);
    url.searchParams.set('edit', evaluation.id);
    window.location.href = url.toString() + '#evaluate';
  };
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  if (loading) {
    return <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>;
  }
  if (evaluationList.length === 0) {
    return <div className="text-center py-8">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No evaluations yet</h3>
        <p className="text-gray-600">Start by generating use cases and evaluating your prompts!</p>
      </div>;
  }
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Evaluations ({evaluationList.length})</h3>
      </div>

      <div className="grid gap-4">
        {evaluationList.map(evaluation => <Card key={evaluation.id} className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base mb-2">
                    {evaluation.use_case || evaluation.custom_use_case}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(evaluation.created_at)}</span>
                    </div>
                    <Badge className={getScoreColor(evaluation.score)}>
                      Score: {evaluation.score}/10
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Evaluation Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Use Case:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {evaluation.use_case || evaluation.custom_use_case}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Prompt:</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {evaluation.prompt}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Score: {evaluation.score}/10</h4>
                        </div>
                        {evaluation.evaluation_result?.suggestions && <div>
                            <h4 className="font-medium mb-2">Suggestions:</h4>
                            <ul className="space-y-1">
                              {evaluation.evaluation_result.suggestions.map((suggestion: string, index: number) => <li key={index} className="text-sm text-gray-600">
                                  {index + 1}. {suggestion}
                                </li>)}
                            </ul>
                          </div>}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 line-clamp-2">
                {evaluation.prompt}
              </p>
            </CardContent>
          </Card>)}
      </div>
    </div>;
};