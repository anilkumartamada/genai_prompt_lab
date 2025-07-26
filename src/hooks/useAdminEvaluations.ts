
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const useAdminEvaluations = () => {
  const [evaluationList, setEvaluationList] = useState<AdminEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecentEvaluations = async () => {
    try {
      console.log('Fetching recent evaluations...');
      // Get evaluations from the past 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // First, get the evaluations
      const { data: evaluations, error: evaluationsError } = await supabase
        .from('prompt_evaluations')
        .select('*')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true });

      if (evaluationsError) {
        console.error('Error fetching evaluations:', evaluationsError);
        throw evaluationsError;
      }

      console.log('Fetched evaluations:', evaluations);

      if (!evaluations || evaluations.length === 0) {
        console.log('No evaluations found');
        setEvaluationList([]);
        return;
      }

      // Get unique user IDs from evaluations
      const userIds = [...new Set(evaluations.map(evaluation => evaluation.user_id))];
      console.log('User IDs to fetch profiles for:', userIds);

      // Fetch user profiles using the admin policy
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      console.log('Fetched profiles:', profiles);

      // Transform the data to combine evaluations with profile information
      const transformedData = evaluations.map((evaluation) => {
        const profile = profiles?.find(p => p.id === evaluation.user_id);
        
        return {
          id: evaluation.id,
          user_name: profile?.name || 'Unknown User',
          user_email: profile?.email || 'Unknown Email',
          use_case: evaluation.use_case,
          custom_use_case: evaluation.custom_use_case,
          prompt: evaluation.prompt,
          score: evaluation.score,
          created_at: evaluation.created_at
        };
      });

      console.log('Final transformed data:', transformedData);
      setEvaluationList(transformedData);
    } catch (error) {
      console.error('Error fetching recent evaluations:', error);
      toast({
        title: "Error",
        description: "Failed to load recent evaluations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentEvaluations();
  }, []);

  return {
    evaluationList,
    loading,
    refetch: fetchRecentEvaluations
  };
};
