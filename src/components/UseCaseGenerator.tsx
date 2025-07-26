import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUseCaseContext } from "@/contexts/UseCaseContext";

export const UseCaseGenerator = () => {
  const [useCases, setUseCases] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    generatedUseCases,
    setGeneratedUseCases, 
    department, 
    setDepartment, 
    dailyTasks, 
    setDailyTasks 
  } = useUseCaseContext();
  const { toast } = useToast();

  const generateUseCases = async () => {
    if (!department.trim()) {
      toast({
        title: "Error",
        description: "Please enter your department",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('gemini-usecase', {
        body: {
          department: department.trim(),
          tasks: dailyTasks.trim() || null
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate use cases');
      }
      
      setUseCases(data.useCases);
      setGeneratedUseCases(data.useCases); // Store in context for other components
      
      toast({
        title: "Success!",
        description: "Generated 4 AI use cases for your department",
      });
    } catch (error) {
      console.error('Error generating use cases:', error);
      toast({
        title: "Error",
        description: "Failed to generate use cases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show generated use cases from context if available and local state is empty
  const displayUseCases = useCases.length > 0 ? useCases : generatedUseCases;

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Enter your department"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tasks">Daily Tasks (Optional)</Label>
          <Textarea
            id="tasks"
            value={dailyTasks}
            onChange={(e) => setDailyTasks(e.target.value)}
            placeholder="Describe your typical daily tasks..."
            rows={3}
          />
        </div>
        
        <Button 
          onClick={generateUseCases}
          disabled={isLoading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Lightbulb className="mr-2 h-4 w-4" />
              Generate Use Cases
            </>
          )}
        </Button>
      </div>

      {displayUseCases.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Use Cases</h3>
          <div className="grid gap-3">
            {displayUseCases.map((useCase, index) => (
              <Card key={index} className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 flex-1">{useCase}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
