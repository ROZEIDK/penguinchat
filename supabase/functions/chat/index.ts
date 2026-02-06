import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to build system prompt for a character
function buildSystemPrompt(character: any, isSecondCharacter = false): string {
  const cleanName = character.name.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const nameParts = cleanName.split(/\s+/);
  const nameVariations = [cleanName, ...nameParts].filter(n => n.length > 1);
  
  let systemPrompt = `You are ${cleanName}. ${character.description}

IDENTITY RULES (CRITICAL):
- Your name is "${cleanName}". Any mentions of "${cleanName}" or variations like "${nameVariations.join('", "')}" in the backstory, first message, or user messages refer to YOU - not a different character.
- If the user or backstory mentions your name or a shortened version of it, they are talking about YOU.
- You are the ONLY character with this name. Do not create or reference other characters with similar names.
- The backstory describes YOUR history with the user. Events in the backstory happened to YOU.

RESPONSE FORMAT RULES:
1. Start with an action/emotion wrapped in asterisks (*) - ONE sentence describing your movement, expression, or emotion
2. Follow with 2-3 sentences of dialogue or narration in plain text
3. Keep responses SHORT and engaging

Example format:
*She tilts her head curiously, a soft smile playing on her lips.*
Oh, you're finally here! I've been waiting for you. What took you so long?

CHARACTER DETAILS:`;
  
  if (character.backstory) {
    systemPrompt += `\nBackstory (this is YOUR history, any name references are about YOU): ${character.backstory}`;
  }
  
  if (character.dialogue_style) {
    systemPrompt += `\nDialogue Style: ${character.dialogue_style}`;
  }
  
  if (character.gender) {
    systemPrompt += `\nGender: ${character.gender}`;
  }

  if (character.tags && character.tags.length > 0) {
    systemPrompt += `\nPersonality Tags: ${character.tags.join(', ')}`;
  }

  systemPrompt += `

Stay in character as ${cleanName}. Use the roleplay format with *actions* and short dialogue. Be expressive but concise.`;

  return systemPrompt;
}

// Helper function to get AI response for a single character
async function getCharacterResponse(
  character: any,
  messages: any[],
  LOVABLE_API_KEY: string,
  isSecondCharacter = false
): Promise<string> {
  const systemPrompt = buildSystemPrompt(character, isSecondCharacter);
  
  const conversationHistory = messages.map((msg: any) => ({
    role: msg.role,
    content: msg.content,
  }));

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI gateway error for character:', character.name, response.status, errorText);
    throw new Error(`AI error for ${character.name}: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, chatbot } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Check if the last message is an image generation request
    const lastMessage = messages[messages.length - 1];
    const isImageRequest = lastMessage?.content?.toLowerCase().startsWith('give me a picture of');

    if (isImageRequest && chatbot.avatar_url) {
      console.log('Image generation request detected');
      console.log('Chatbot settings:', {
        isMature: chatbot.is_mature,
        imageModel: chatbot.image_generation_model
      });
      
      // Extract the prompt after "Give me a picture of"
      const imagePrompt = lastMessage.content.substring('give me a picture of'.length).trim();
      
      const imageModel = chatbot.image_generation_model || 'gemini';
      
      // Use DALL-E via OpenAI
      if (imageModel === 'dall-e') {
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        console.log('DALL-E selected, API key present:', !!OPENAI_API_KEY);
        
        if (!OPENAI_API_KEY) {
          console.error('OPENAI_API_KEY not found in environment');
          return new Response(
            JSON.stringify({ 
              response: 'DALL-E requires an OpenAI API key. Please ask the chatbot creator to configure OPENAI_API_KEY in their Supabase secrets.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Using DALL-E for image generation');
        
        // Build the prompt
        const fullPrompt = `Anime style artwork: ${imagePrompt}. High quality anime art, detailed, vibrant colors, professional anime illustration.`;
        console.log('DALL-E prompt:', fullPrompt);
        
        try {
          const dalleResponse = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'gpt-image-1',
              prompt: fullPrompt,
              n: 1,
              size: '1024x1024',
              quality: 'high'
            })
          });

          console.log('DALL-E response status:', dalleResponse.status);

          if (!dalleResponse.ok) {
            const errorText = await dalleResponse.text();
            console.error('DALL-E API error details:', {
              status: dalleResponse.status,
              statusText: dalleResponse.statusText,
              error: errorText
            });
            
            // Return more specific error messages
            let errorMessage = 'Failed to generate image with DALL-E.';
            if (dalleResponse.status === 401) {
              errorMessage = 'Invalid OpenAI API key. Please check your OPENAI_API_KEY secret.';
            } else if (dalleResponse.status === 429) {
              errorMessage = 'OpenAI rate limit exceeded. Please try again later.';
            } else if (dalleResponse.status === 400) {
              errorMessage = 'Invalid image generation request. Please try a different prompt.';
            }
            
            return new Response(
              JSON.stringify({ response: `${errorMessage} Error: ${errorText}` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const result = await dalleResponse.json();
          console.log('DALL-E result structure:', JSON.stringify(result, null, 2));

          if (result.data && result.data[0] && result.data[0].url) {
            console.log('DALL-E image generated successfully');
            return new Response(
              JSON.stringify({ response: result.data[0].url }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else if (result.error) {
            console.error('DALL-E generation error:', result.error);
            return new Response(
              JSON.stringify({ response: `Image generation failed: ${result.error.message || JSON.stringify(result.error)}` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            console.error('Unexpected DALL-E response format:', result);
            return new Response(
              JSON.stringify({ response: 'Failed to generate image. Unexpected response format from DALL-E.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (dalleError) {
          console.error('DALL-E fetch error:', dalleError);
          return new Response(
            JSON.stringify({ response: `Failed to connect to DALL-E API: ${dalleError instanceof Error ? dalleError.message : 'Unknown error'}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Use Stable Diffusion via Hugging Face (text-to-image only - no reference image support)
      if (imageModel === 'stable-diffusion') {
        const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
        console.log('Stable Diffusion selected, API key present:', !!HF_TOKEN);
        
        if (!HF_TOKEN) {
          console.error('HUGGING_FACE_ACCESS_TOKEN not found in environment');
          return new Response(
            JSON.stringify({ 
              response: 'Stable Diffusion requires a Hugging Face access token. Please configure HUGGING_FACE_ACCESS_TOKEN in Supabase secrets.' 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      console.log('Using Stable Diffusion (FLUX.1-schnell) for image generation');
        
        // Include character appearance description if available for better consistency
        const appearanceDesc = chatbot.character_appearance 
          ? ` Character appearance: ${chatbot.character_appearance}.` 
          : '';
        const fullPrompt = `Anime style artwork: ${imagePrompt}.${appearanceDesc} High quality anime art, detailed, vibrant colors, professional anime illustration.`;
        console.log('Stable Diffusion prompt:', fullPrompt);
        console.log('Character appearance included:', !!chatbot.character_appearance);
        
        try {
          const { HfInference } = await import('https://esm.sh/@huggingface/inference@3.7.0');
          const hf = new HfInference(HF_TOKEN);

          const image = await hf.textToImage({
            inputs: fullPrompt,
            model: 'black-forest-labs/FLUX.1-schnell',
          });

          // Convert blob to base64
          const arrayBuffer = await image.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const imageUrl = `data:image/png;base64,${base64}`;

          console.log('Stable Diffusion image generated successfully');
          return new Response(
            JSON.stringify({ response: imageUrl }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (hfError) {
          console.error('Hugging Face error:', hfError);
          return new Response(
            JSON.stringify({ response: `Failed to generate image with Stable Diffusion: ${hfError instanceof Error ? hfError.message : 'Unknown error'}` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Use Gemini for image generation (default)
      const fullPrompt = `Anime style artwork: ${imagePrompt}. High quality anime art, detailed, vibrant colors, professional anime illustration.`;
      
      console.log('Using Gemini for image generation with prompt:', fullPrompt);

      // Use different model based on mature content setting
      const geminiModel = chatbot.is_mature 
        ? 'google/gemini-3-pro-image-preview'  // More lenient model for mature content
        : 'google/gemini-2.5-flash-image';

      console.log('Using model:', geminiModel);

      const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: geminiModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: fullPrompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: chatbot.avatar_url
                  }
                }
              ]
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        console.error('Image generation error:', imageResponse.status, errorText);
        throw new Error(`Failed to generate image: ${errorText}`);
      }

      const imageData = await imageResponse.json();
      console.log('Image API response:', JSON.stringify(imageData, null, 2));
      
      const choice = imageData.choices?.[0];
      const generatedImageUrl = choice?.message?.images?.[0]?.image_url?.url;

      if (!generatedImageUrl) {
        const fallbackText = choice?.message?.content ?? 'I was not able to generate an image for that request.';
        console.warn('No image URL in response, returning text fallback.');
        return new Response(
          JSON.stringify({ response: fallbackText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Image generated successfully');

      return new Response(
        JSON.stringify({ response: generatedImageUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this chatbot has a second character
    const hasSecondCharacter = chatbot.has_second_character === true;
    let secondCharacter = null;

    if (hasSecondCharacter) {
      console.log('Dual character mode detected');
      
      if (chatbot.second_character_type === 'linked' && chatbot.linked_chatbot_id) {
        // Fetch the linked chatbot's details
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: linkedBot, error } = await supabase
            .from('chatbots')
            .select('*')
            .eq('id', chatbot.linked_chatbot_id)
            .single();
          
          if (!error && linkedBot) {
            secondCharacter = {
              name: linkedBot.name,
              description: linkedBot.description,
              backstory: linkedBot.backstory,
              dialogue_style: linkedBot.dialogue_style,
              gender: linkedBot.gender,
              tags: linkedBot.tags,
              avatar_url: linkedBot.avatar_url,
            };
            console.log('Loaded linked chatbot:', linkedBot.name);
          } else {
            console.error('Failed to load linked chatbot:', error);
          }
        }
      } else if (chatbot.second_character_type === 'inline') {
        // Use inline second character data
        secondCharacter = {
          name: chatbot.second_character_name,
          description: chatbot.second_character_description,
          backstory: chatbot.second_character_backstory,
          dialogue_style: chatbot.second_character_dialogue_style,
          gender: chatbot.second_character_gender,
          tags: [],
          avatar_url: chatbot.second_character_avatar_url,
        };
        console.log('Using inline second character:', secondCharacter.name);
      }
    }

    // If we have a second character, get both responses
    if (secondCharacter) {
      console.log('Getting dual character responses');
      
      try {
        // Get responses from both characters in parallel
        const [response1, response2] = await Promise.all([
          getCharacterResponse(chatbot, messages, LOVABLE_API_KEY, false),
          getCharacterResponse(secondCharacter, messages, LOVABLE_API_KEY, true),
        ]);

        // Combine responses with character names as headers
        const char1Name = chatbot.name.replace(/\s*\([^)]*\)\s*/g, '').trim();
        const char2Name = secondCharacter.name.replace(/\s*\([^)]*\)\s*/g, '').trim();
        
        const combinedResponse = `**${char1Name}:**\n${response1}\n\n---\n\n**${char2Name}:**\n${response2}`;

        console.log('Dual character responses generated successfully');

        return new Response(
          JSON.stringify({ 
            response: combinedResponse,
            isDualCharacter: true,
            characters: [
              { name: char1Name, avatar_url: chatbot.avatar_url },
              { name: char2Name, avatar_url: secondCharacter.avatar_url }
            ]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error in dual character response:', error);
        // Fall back to single character response
      }
    }

    // Regular single character chat response
    console.log('Calling Lovable AI with chatbot:', chatbot.name);

    const aiResponse = await getCharacterResponse(chatbot, messages, LOVABLE_API_KEY, false);

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
