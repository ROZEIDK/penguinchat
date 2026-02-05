 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { bookTitle, bookDescription, bookContent } = await req.json();
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     // Build the extraction prompt
     const systemPrompt = `You are a character extraction assistant. Your job is to analyze book/story content and extract character information to create roleplay chatbots.
 
 For each main character you find (up to 3 characters), extract:
 1. name - The character's name as used in the story
 2. description - A brief 1-2 sentence description of who they are
 3. backstory - Their background, history, and key events from the story (use the book content as their backstory)
 4. dialogue_style - How they speak, their tone, mannerisms, speech patterns
 5. gender - Their gender if mentioned (male/female/other/unknown)
 6. personality_tags - 3-5 personality trait tags
 7. intro_message - A short greeting message in their character voice, using the roleplay format: start with an *action* then 1-2 sentences of dialogue
 
 IMPORTANT: 
 - Focus on main characters with significant dialogue or presence
 - The backstory should incorporate key plot points from the book that involve this character
 - The intro_message should be in roleplay format: *action in asterisks* followed by dialogue`;
 
     const userPrompt = `Analyze this book and extract character information:
 
 BOOK TITLE: ${bookTitle}
 
 BOOK DESCRIPTION: ${bookDescription || "No description provided"}
 
 BOOK CONTENT:
 ${bookContent?.substring(0, 15000) || "No content available - extract based on title and description only"}
 
 Extract the main characters and return the information in the specified format.`;
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: systemPrompt },
           { role: "user", content: userPrompt },
         ],
         tools: [
           {
             type: "function",
             function: {
               name: "extract_characters",
               description: "Extract character information from the book content",
               parameters: {
                 type: "object",
                 properties: {
                   characters: {
                     type: "array",
                     items: {
                       type: "object",
                       properties: {
                         name: { type: "string", description: "Character's name" },
                         description: { type: "string", description: "Brief 1-2 sentence description" },
                         backstory: { type: "string", description: "Character's background and story events" },
                         dialogue_style: { type: "string", description: "How they speak and their mannerisms" },
                         gender: { type: "string", enum: ["male", "female", "other", "unknown"] },
                         personality_tags: {
                           type: "array",
                           items: { type: "string" },
                           description: "3-5 personality trait tags",
                         },
                         intro_message: { type: "string", description: "Greeting in roleplay format with *action* and dialogue" },
                       },
                       required: ["name", "description", "backstory", "dialogue_style", "intro_message"],
                     },
                   },
                 },
                 required: ["characters"],
               },
             },
           },
         ],
         tool_choice: { type: "function", function: { name: "extract_characters" } },
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(
           JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
           { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       if (response.status === 402) {
         return new Response(
           JSON.stringify({ error: "AI credits required. Please add funds to continue." }),
           { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
         );
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       throw new Error(`AI gateway error: ${response.status}`);
     }
 
     const data = await response.json();
     console.log("AI response:", JSON.stringify(data, null, 2));
 
     // Extract the tool call result
     const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
     if (!toolCall || toolCall.function.name !== "extract_characters") {
       throw new Error("Failed to extract characters from the AI response");
     }
 
     const extractedData = JSON.parse(toolCall.function.arguments);
 
     return new Response(
       JSON.stringify({ characters: extractedData.characters }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Extract characters error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });