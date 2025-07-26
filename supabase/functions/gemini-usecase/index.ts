
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
    const { department, tasks } = await req.json();
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = `Don't give use cases that are not related to NxtWave (mentioned in the context dump—refer to it so you know what NxtWave is, what they do, and who their clients are). Don't assume anything. Don't give scenarios where it involves building complex systems or custom applications—the scope is limited to simple prompting tasks only.

You are conducting a GenAI workshop to teach employees how to write effective prompts. The focus is on using the **basic prompt structure**: Role, Action/Task, Context, Format, Tone.

🎯 Goal: Generate **4 simple and realistic AI use cases** that help employees from the **${department}** department use prompting in their daily work.

You are a Use Case Generator Agent. I will give you:

- A department name  
- The key tasks that team performs

Your job is to output 4 use cases where an employee from that department can use AI to help with their **actual** work (based on responsibilities listed below). These should be:
- Simple and practical (e.g., "generate a formal email", "summarize a document", "create meeting notes")
- Easy to express using Role, Action/Task, Context, Format, and Tone
- Aligned with what that department typically does at NxtWave

---

Department: **${department}**  
Tasks:  
${tasks || "refer to standard team tasks from the document below if none provided and if the department is not in the below document you can assume some tasks related to the given department"}

---

Please provide exactly 4 use cases (one per line, no bullets or numbering).

🧠 **Team Responsibilities Reference (for use by AI):**

**Product Design**  
- Creating wireframes and prototypes  
- Collaborating with engineering/product teams  
- Presenting designs to stakeholders  
- Building and maintaining design systems  
- Conducting user research (interviews, usability tests)

**Program Management**  
- Managing admissions processes and campus deployments  
- Onboarding and training BOAs/PMAs/PMs  
- Tracking progress of new hires  
- Coordinating logistics for campus readiness  
- Regularly updating stakeholders  

**Accounting**  
- Recording transactions in ERP  
- Invoice validation and payment reconciliation  
- Preparing budgets and analyzing spending  
- Processing refunds  
- Filing statutory returns (GST, TDS, etc.)

**Content Team**  
- Writing web copy and microcopy  
- Creating scripts, brochures, social media posts  
- Translating/localizing assets  
- Drafting email newsletters and presentation decks  
- Video subtitle writing and influencer content scripting

---

📌 **Context Dump (for grounding AI in NxtWave’s business):**

NxtWave is an Indian edtech startup focused on building job-ready skills in emerging tech (AI, ML, Full Stack Dev, etc.) via online programs and NIAT college degrees. Their clients include tech students and professionals. They work in both online (CCBP Academy) and offline (NIAT B.Tech programs) models, offering training, placement support, and industry-recognized certification.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a use case generator expert. Generate exactly 4 use cases, one per line, without numbering or bullet points.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1024,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log('Generated text:', generatedText);
    
    // More robust parsing to ensure exactly 4 use cases
    const lines = generatedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const useCases = [];
    
    // Look for numbered lines (1., 2., 3., 4.)
    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        const useCase = line.replace(/^\d+\.\s*/, '').trim();
        if (useCase.length > 0) {
          useCases.push(useCase);
        }
      }
    }
    
    // If we don't have exactly 4, try alternative parsing
    if (useCases.length !== 4) {
      console.log('First parsing attempt failed, trying alternative parsing');
      const alternativeUseCases = [];
      
      // Look for any line that could be a use case (containing key action words)
      for (const line of lines) {
        if (line.length > 20 && // Reasonable length
            (line.toLowerCase().includes('generat') || 
             line.toLowerCase().includes('writ') || 
             line.toLowerCase().includes('creat') || 
             line.toLowerCase().includes('draft') || 
             line.toLowerCase().includes('email') || 
             line.toLowerCase().includes('summar') ||
             line.toLowerCase().includes('analyz'))) {
          const cleanLine = line.replace(/^[\d\.\-\*\•\s]+/, '').trim();
          if (cleanLine.length > 15) {
            alternativeUseCases.push(cleanLine);
          }
        }
      }
      
      // Take the first 4 valid use cases
      useCases.length = 0;
      useCases.push(...alternativeUseCases.slice(0, 4));
    }
    
    // Fallback: if still not 4, generate default use cases based on department
    if (useCases.length < 4) {
      console.log('Using fallback use cases');
      const fallbackUseCases = [
        `Generate professional emails for ${department} department communications`,
        `Create summaries of long documents and reports for ${department} team`,
        `Draft formal responses to common ${department} inquiries and requests`,
        `Analyze and categorize feedback or data relevant to ${department} operations`
      ];
      
      // Fill in missing use cases with fallbacks
      while (useCases.length < 4) {
        useCases.push(fallbackUseCases[useCases.length]);
      }
    }
    
    // Ensure exactly 4 use cases
    const finalUseCases = useCases.slice(0, 4);
    
    console.log('Final use cases:', finalUseCases);

    return new Response(JSON.stringify({ useCases: finalUseCases }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in openai-usecase function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
