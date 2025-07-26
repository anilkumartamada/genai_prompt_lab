
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { useCase, prompt } = await req.json();
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Evaluating prompt for use case:', useCase);

    const evaluationPrompt = `You are a Prompt Quality Evaluator.

Your task is to evaluate a prompt written by a user according to the following criteria:

1. **Prompt Structure Presence**  
   Check if the following components are clearly specified in the prompt.  
   - Role: Who is being asked to perform the task (e.g., "You are a travel planner")  
   - Action/Task: What is being asked (e.g., "Plan a 5-day trip to Italy")  
   - Context: Any relevant background info or constraints (e.g., "For a family with kids under 10")  
   - Format: How the output should look (e.g., "Return as a bullet-point itinerary")  
   - Tone: Desired style of writing (e.g., "Friendly and concise")  
   For each of these components, evaluate whether it is:  
     - **present** (clearly and strongly expressed)  
     - **Partially Present** (implied or weakly mentioned)  
     - **missing** (not present at all)

2.   **Scoring Criteria** (Out of 10)
  just because Role,action,context,format and tone are present don't give full marks, check for clarity,completeness of information,specificity and alignment with use case also            
   Score the prompt based on:
   - if role present (1 point)
   - if action/task present (1 point)
   - if context present (1 point)
   - if format and tone present (2 point)
   - Clarity (1 points)
   - Completeness of information (1 points)
   - Specificity (1 points)
   - Alignment with use case (1 points)
   - give other one point if you think the prompt is perfect
You are a professional prompt evaluation expert. Respond only with valid JSON format as specified.

3. **Use Case and Prompt Matching**  
   Check if the prompt is logically aligned with the use case provided.  

4. **Constructive Feedback**  
   Suggest how the prompt can be improved.  
   - Mention missing elements (like tone, format, context, etc.)
   - Suggest better phrasing or structure.
   - Give 2–3 short actionable tips.

⚠️ Just because a technique is mentioned by name or keyword in the prompt, **do not assume it's actually used**. Only confirm a technique if it is actively demonstrated in the structure or content of the prompt.

* Pointing out **missing elements**, **vagueness**, or any **confusing parts**.

* Giving **3 clear and constructive suggestions** to improve the prompt.

Use Case: ${useCase}
Prompt to Evaluate: ${prompt}

Return your response in this exact JSON format:
{
  "role": {"status": "present/partially present/missing", "explanation": "brief explanation"},
  "action": {"status": "present/partially present/missing", "explanation": "brief explanation"},
  "context": {"status": "present/partially present/missing", "explanation": "brief explanation"},
  "format": {"status": "present/partially present/missing", "explanation": "brief explanation"},
  "tone": {"status": "present/partially present/missing", "explanation": "brief explanation"},
  "techniques": ["list of detected techniques"],
  "mismatches": ["list of mismatches with use case, empty if none"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "score": numerical_score_out_of_10
}`;

    // Add retry logic for rate limiting
    let retries = 3;
    let response;
    
    while (retries > 0) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `
                just because Role,action,context,format and tone are present don't give full marks, check for clarity,completeness of information,specificity and alignment with use case also
                **Scoring Criteria** (Out of 10)  
   Score the prompt based on:
   - if role present (1 point)
   - if action/task present (1 point)
   - if context present (1 point)
   - if format and tone present (2 point)
   - Clarity (1 points)
   - Completeness of information (1 points)
   - Specificity (1 points)
   - Alignment with use case (1 points)
   - give other one point if you think the prompt is perfect
You are a professional prompt evaluation expert. Respond only with valid JSON format as specified.`
              },
              {
                role: 'user',
                content: evaluationPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 2048,
          })
        });

        if (response.status === 429) {
          console.log(`Rate limited, retrying in ${4 - retries} seconds...`);
          await new Promise(resolve => setTimeout(resolve, (4 - retries) * 1000));
          retries--;
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`OpenAI API error ${response.status}:`, errorText);
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.log(`Request failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const data = await response.json();
    console.log('OpenAI API response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from OpenAI API:', data);
      throw new Error('Invalid response structure from OpenAI API');
    }

    const generatedText = data.choices[0].message.content;
    console.log('Generated text:', generatedText);
    
    // Extract JSON from the response
    let evaluation;
    try {
      // Try to find JSON in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON found in response:', generatedText);
        // Fallback evaluation
        evaluation = {
          role: { status: "missing", explanation: "Unable to parse evaluation" },
          action: { status: "missing", explanation: "Unable to parse evaluation" },
          context: { status: "missing", explanation: "Unable to parse evaluation" },
          format: { status: "missing", explanation: "Unable to parse evaluation" },
          tone: { status: "missing", explanation: "Unable to parse evaluation" },
          techniques: [],
          mismatches: ["Unable to evaluate due to parsing error"],
          suggestions: [
            "Please try again - there was an issue processing your prompt",
            "Check if your prompt is properly formatted",
            "Consider simplifying your prompt structure"
          ],
          score: 0
        };
      }
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError, 'Text:', generatedText);
      // Fallback evaluation
      evaluation = {
        role: { status: "missing", explanation: "Unable to parse evaluation" },
        action: { status: "missing", explanation: "Unable to parse evaluation" },
        context: { status: "missing", explanation: "Unable to parse evaluation" },
        format: { status: "missing", explanation: "Unable to parse evaluation" },
        tone: { status: "missing", explanation: "Unable to parse evaluation" },
        techniques: [],
        mismatches: ["Unable to evaluate due to parsing error"],
        suggestions: [
          "Please try again - there was an issue processing your prompt",
          "Check if your prompt is properly formatted",
          "Consider simplifying your prompt structure"
        ],
        score: 0
      };
    }

    console.log('Evaluation completed successfully');
    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in openai-evaluate function:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to evaluate prompt';
    if (error.message.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (error.message.includes('OPENAI_API_KEY')) {
      errorMessage = 'API key not configured properly';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
