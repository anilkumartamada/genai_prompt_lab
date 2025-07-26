import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Target, Loader2, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUseCaseContext } from "@/contexts/UseCaseContext";
interface PromptEvaluatorProps {
  userId: string;
}
interface EvaluationResult {
  role: {
    status: string;
    explanation: string;
  };
  action: {
    status: string;
    explanation: string;
  };
  context: {
    status: string;
    explanation: string;
  };
  format: {
    status: string;
    explanation: string;
  };
  tone: {
    status: string;
    explanation: string;
  };
  techniques: string[];
  mismatches: string[];
  suggestions: string[];
  score: number;
}
export const PromptEvaluator = ({
  userId
}: PromptEvaluatorProps) => {
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    generatedUseCases,
    selectedUseCase,
    setSelectedUseCase,
    customUseCase,
    setCustomUseCase,
    prompt,
    setPrompt
  } = useUseCaseContext();
  const {
    toast
  } = useToast();

  // Load data for editing from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');
    const urlUseCase = urlParams.get('useCase');
    const urlCustomUseCase = urlParams.get('customUseCase');
    const urlPrompt = urlParams.get('prompt');
    console.log('URL Params:', {
      editId,
      urlUseCase,
      urlCustomUseCase,
      urlPrompt
    });
    if (editId && (urlUseCase || urlCustomUseCase) && urlPrompt) {
      console.log('Loading edit data from URL params');
      setEditingId(editId);

      // Set use case - if it's 'custom' or the custom use case is provided, use custom
      if (urlUseCase === 'custom' || urlCustomUseCase) {
        setSelectedUseCase('custom');
        setCustomUseCase(urlCustomUseCase || '');
      } else if (urlUseCase) {
        // Check if the use case exists in generated use cases, otherwise use custom
        if (generatedUseCases.includes(urlUseCase)) {
          setSelectedUseCase(urlUseCase);
          setCustomUseCase('');
        } else {
          setSelectedUseCase('custom');
          setCustomUseCase(urlUseCase);
        }
      }
      setPrompt(urlPrompt);

      // Clean up URL parameters after loading
      const url = new URL(window.location.href);
      url.searchParams.delete('editId');
      url.searchParams.delete('useCase');
      url.searchParams.delete('customUseCase');
      url.searchParams.delete('prompt');

      // Keep only the #evaluate hash
      const newUrl = url.pathname + '#evaluate';
      window.history.replaceState({}, '', newUrl);
      toast({
        title: "Loaded for editing",
        description: "Previous evaluation data has been loaded for editing"
      });
    }
  }, [generatedUseCases, toast, setSelectedUseCase, setCustomUseCase, setPrompt]);
  const evaluatePrompt = async () => {
    const useCaseToEvaluate = selectedUseCase === 'custom' ? customUseCase : selectedUseCase;
    if (!useCaseToEvaluate.trim()) {
      toast({
        title: "Error",
        description: "Please select or enter a use case",
        variant: "destructive"
      });
      return;
    }
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter your prompt",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('gemini-evaluate', {
        body: {
          useCase: useCaseToEvaluate,
          prompt: prompt.trim()
        }
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      const {
        evaluation
      } = response.data;
      setEvaluationResult(evaluation);

      // Store evaluation in database
      const {
        error
      } = await supabase.from('prompt_evaluations').insert({
        user_id: userId,
        use_case: selectedUseCase === 'custom' ? null : selectedUseCase,
        custom_use_case: selectedUseCase === 'custom' ? customUseCase : null,
        prompt: prompt.trim(),
        evaluation_result: evaluation,
        score: evaluation.score
      } as any);
      if (error) throw error;

      // Clear editing state
      setEditingId(null);
      toast({
        title: "Evaluation Complete!",
        description: `Your prompt scored ${evaluation.score}/10`
      });
    } catch (error) {
      console.error('Error evaluating prompt:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
      case 'clearly present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'partially present':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'missing':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
      case 'clearly present':
        return 'bg-green-100 text-green-800';
      case 'partially present':
        return 'bg-yellow-100 text-yellow-800';
      case 'missing':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return <div className="space-y-6">
      {editingId && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 font-medium">
            📝 Editing Mode: You're editing a previous evaluation. Submit to create a new entry.
          </p>
        </div>}

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="usecase">Use Case *</Label>
          <Select value={selectedUseCase} onValueChange={setSelectedUseCase}>
            <SelectTrigger>
              <SelectValue placeholder="Select a use case or choose custom" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="custom">Custom Use Case</SelectItem>
              {generatedUseCases.map((useCase, index) => <SelectItem key={index} value={useCase} className="text-wrap whitespace-normal py-3 px-3">
                  <div className="text-sm leading-5 max-w-full">{useCase}</div>
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {selectedUseCase === 'custom' && <div className="space-y-2">
            <Label htmlFor="custom-usecase">Enter Custom Use Case *</Label>
            <Input id="custom-usecase" value={customUseCase} onChange={e => setCustomUseCase(e.target.value)} placeholder="Describe your specific AI use case..." />
          </div>}

        <div className="space-y-2">
          <Label htmlFor="prompt">Enter Your Prompt *</Label>
          <Textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Write your AI prompt here..." rows={5} />
        </div>

        <Button onClick={evaluatePrompt} disabled={isLoading} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
          {isLoading ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Evaluating...
            </> : <>
              <Target className="mr-2 h-4 w-4" />
              Evaluate Prompt
            </>}
        </Button>
      </div>

      {evaluationResult && <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Evaluation Results</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{evaluationResult.score}/10</div>
              <div className="text-sm text-gray-500">Overall Score</div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt Structure Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[{
            key: 'role',
            label: 'Role'
          }, {
            key: 'action',
            label: 'Action/Task'
          }, {
            key: 'context',
            label: 'Context'
          }, {
            key: 'format',
            label: 'Format'
          }, {
            key: 'tone',
            label: 'Tone'
          }].map(({
            key,
            label
          }) => {
            const element = evaluationResult[key as keyof EvaluationResult] as {
              status: string;
              explanation: string;
            };
            return <div key={key} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                    {getStatusIcon(element.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{label}</span>
                        <Badge className={getStatusColor(element.status)}>
                          {element.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{element.explanation}</p>
                    </div>
                  </div>;
          })}
            </CardContent>
          </Card>

          {evaluationResult.techniques.length > 0 && <Card>
              
              
            </Card>}

          {evaluationResult.mismatches.length > 0 && <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Use Case Mismatches</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluationResult.mismatches.map((mismatch, index) => <li key={index} className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{mismatch}</span>
                    </li>)}
                </ul>
              </CardContent>
            </Card>}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-blue-600">Improvement Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {evaluationResult.suggestions.map((suggestion, index) => <li key={index} className="flex items-start space-x-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>)}
              </ol>
            </CardContent>
          </Card>
        </div>}
    </div>;
};