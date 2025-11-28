import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      
      // Use Gemini for image generation
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

    // Regular chat response
    let systemPrompt = `You are ${chatbot.name}. ${chatbot.description}`;
    
    if (chatbot.backstory) {
      systemPrompt += `\n\nBackstory: ${chatbot.backstory}`;
    }
    
    if (chatbot.dialogue_style) {
      systemPrompt += `\n\nDialogue Style: ${chatbot.dialogue_style}`;
    }
    
    if (chatbot.gender) {
      systemPrompt += `\n\nGender: ${chatbot.gender}`;
    }

    systemPrompt += `\n\nStay in character and respond naturally based on your personality and background.`;

    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log('Calling Lovable AI with chatbot:', chatbot.name);

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
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

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
