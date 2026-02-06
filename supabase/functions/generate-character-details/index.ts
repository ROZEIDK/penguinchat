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
    const { name, gender, dialogueStyle, introMessage, avatarDescription } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Based on the following character information, generate detailed character profile fields for a roleplay chatbot. Be creative and consistent with the provided details.

Character Name: ${name || "Unknown"}
Gender: ${gender || "Not specified"}
Dialogue Style: ${dialogueStyle || "Not specified"}
First Message (how they greet users): ${introMessage || "Not provided"}
${avatarDescription ? `Avatar/Appearance Notes: ${avatarDescription}` : ""}

Generate the following in JSON format:
1. "description" - A compelling 2-3 sentence description of who this character is, their personality, and what makes them interesting. Write in third person.
2. "backstory" - A 3-4 sentence background story about how the user and this character met. Write as a scenario setup, using "you" for the user.
3. "tags" - An array of 3-5 personality/theme tags (single words or short phrases like "mysterious", "romantic", "warrior", "helpful", etc.)

Return ONLY valid JSON with these three fields. No markdown, no extra text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a creative writing assistant that generates character profiles for roleplay chatbots. Always respond with valid JSON only, no markdown formatting." 
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate character details");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    // Parse the JSON response
    let parsedContent;
    try {
      // Remove potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse character details");
    }

    return new Response(
      JSON.stringify({
        description: parsedContent.description || "",
        backstory: parsedContent.backstory || "",
        tags: parsedContent.tags || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate character details error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
