import { useState, useEffect } from "react";
import { ArrowLeft, MessageSquare, Bot, Sparkles, Image, Lightbulb } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Help = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "creating" ? "creating" : "messaging";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "creating" || tab === "messaging") {
      setActiveTab(tab);
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Help & Guides</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messaging AI
            </TabsTrigger>
            <TabsTrigger value="creating" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Creating Bots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messaging" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Getting Better Text Responses
                </CardTitle>
                <CardDescription>
                  Learn how to communicate with AI characters to get the responses you want
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="context">
                    <AccordionTrigger>Provide Context in Your Messages</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>The AI responds better when you give it context about the situation.</p>
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <p className="text-sm font-medium text-foreground">❌ Bad:</p>
                        <p className="text-sm italic">"Hi"</p>
                        <p className="text-sm font-medium text-foreground mt-2">✅ Good:</p>
                        <p className="text-sm italic">"*walks into the coffee shop and notices you sitting alone* Hey, mind if I join you?"</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="roleplay">
                    <AccordionTrigger>Use Roleplay Format</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>Wrap actions and emotions in asterisks (*) to set the scene:</p>
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <p className="text-sm italic">*She looks up from her book with curiosity* What brings you here today?</p>
                      </div>
                      <p className="mt-2">The AI will mirror this format in responses!</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="specific">
                    <AccordionTrigger>Be Specific About What You Want</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>If you want a certain type of response, guide the conversation:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Ask direct questions for informative responses</li>
                        <li>Set emotional tones for dramatic responses</li>
                        <li>Describe scenarios for immersive roleplay</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="persona">
                    <AccordionTrigger>Respect the Character's Persona</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>Each bot has a unique personality defined by its creator. For best results:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Read the character's description before chatting</li>
                        <li>Ask questions related to their backstory</li>
                        <li>Stay consistent with the established scenario</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Requesting AI Images
                </CardTitle>
                <CardDescription>
                  How to ask the AI to generate images during chat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="trigger">
                    <AccordionTrigger>Trigger Words for Images</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>Use these phrases to request an image:</p>
                      <div className="bg-muted p-3 rounded-lg">
                        <ul className="space-y-1 text-sm">
                          <li>• "Give me a picture of..."</li>
                          <li>• "Send me a photo of..."</li>
                          <li>• "Show me an image of..."</li>
                          <li>• "Generate an image of..."</li>
                          <li>• "Create a picture of..."</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="describe">
                    <AccordionTrigger>Describe What You Want</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>Be detailed in your image requests:</p>
                      <div className="bg-muted p-3 rounded-lg space-y-2">
                        <p className="text-sm font-medium text-foreground">❌ Vague:</p>
                        <p className="text-sm italic">"Send me a picture of yourself"</p>
                        <p className="text-sm font-medium text-foreground mt-2">✅ Detailed:</p>
                        <p className="text-sm italic">"Send me a picture of yourself sitting in a cozy library, reading a book by candlelight"</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="style">
                    <AccordionTrigger>Specify Art Style (Optional)</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>You can request specific art styles:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Anime style</li>
                        <li>Realistic/photorealistic</li>
                        <li>Digital art</li>
                        <li>Oil painting style</li>
                        <li>Cartoon style</li>
                      </ul>
                      <p className="mt-2 text-sm">Example: "Give me an anime-style picture of you at the beach"</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tips">
                    <AccordionTrigger>Image Generation Tips</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>Include environment/setting details</li>
                        <li>Mention lighting (sunset, neon, soft light)</li>
                        <li>Describe mood or atmosphere</li>
                        <li>Specify colors if important</li>
                        <li>Keep descriptions clear and concise</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="creating" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Creating Effective Bots
                </CardTitle>
                <CardDescription>
                  Make bots that understand users and respond naturally
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="name">
                    <AccordionTrigger>Choosing a Good Name</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>The name sets the first impression:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Make it memorable and unique</li>
                        <li>Match the name to the character's personality</li>
                        <li>Consider the setting (fantasy, modern, sci-fi)</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="description">
                    <AccordionTrigger>Writing the Description</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>The description tells users what to expect. Include:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Who the character is (role, occupation)</li>
                        <li>Key personality traits</li>
                        <li>The scenario or setting</li>
                        <li>What kind of interactions to expect</li>
                      </ul>
                      <div className="bg-muted p-3 rounded-lg mt-2">
                        <p className="text-sm font-medium text-foreground">Example:</p>
                        <p className="text-sm italic">"A mysterious detective from 1920s Chicago who loves solving cold cases. Known for sharp wit and a soft spot for jazz music."</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="backstory">
                    <AccordionTrigger>Crafting the Backstory</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p className="font-medium text-foreground">This is the MOST important field!</p>
                      <p>The backstory shapes how the AI responds. Include:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>History:</strong> Where they came from, key life events</li>
                        <li><strong>Motivations:</strong> What drives them, their goals</li>
                        <li><strong>Relationships:</strong> How they interact with others</li>
                        <li><strong>Secrets:</strong> Hidden depths to discover</li>
                        <li><strong>Quirks:</strong> Unique habits or phrases they use</li>
                      </ul>
                      <div className="bg-muted p-3 rounded-lg mt-2">
                        <p className="text-sm font-medium text-foreground">Pro Tip:</p>
                        <p className="text-sm">Write in third person: "She always carries a worn photograph..." rather than "I always carry..."</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="dialogue">
                    <AccordionTrigger>Setting Dialogue Style</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>Describe HOW your character speaks:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Formal vs casual language</li>
                        <li>Accent or speech patterns</li>
                        <li>Common phrases they use</li>
                        <li>Emotional tone (cheerful, brooding, sarcastic)</li>
                      </ul>
                      <div className="bg-muted p-3 rounded-lg mt-2">
                        <p className="text-sm font-medium text-foreground">Examples:</p>
                        <p className="text-sm italic">"Speaks in a soft, poetic manner with occasional old English phrases"</p>
                        <p className="text-sm italic">"Uses modern slang and lots of emojis, very energetic"</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="intro">
                    <AccordionTrigger>Writing the Intro Message</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>The intro message sets the scene for conversations:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Show the character's personality immediately</li>
                        <li>Establish the setting/scenario</li>
                        <li>Give the user something to respond to</li>
                        <li>Use the action format: *action* then dialogue</li>
                      </ul>
                      <div className="bg-muted p-3 rounded-lg mt-2">
                        <p className="text-sm font-medium text-foreground">Example:</p>
                        <p className="text-sm italic">*She looks up from her ancient tome, eyes glowing faintly* Ah, a visitor. It's been centuries since someone found this library. What brings you to seek forbidden knowledge?</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tags">
                    <AccordionTrigger>Using Tags Effectively</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>Tags help users find your bot and give the AI context:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li><strong>Genre:</strong> Fantasy, Sci-Fi, Romance, Horror</li>
                        <li><strong>Personality:</strong> Friendly, Mysterious, Tsundere</li>
                        <li><strong>Role:</strong> Mentor, Rival, Love Interest</li>
                        <li><strong>Setting:</strong> Medieval, Modern, Futuristic</li>
                      </ul>
                      <p className="mt-2 text-sm">Add 3-5 relevant tags for best discoverability.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="avatar">
                    <AccordionTrigger>Choosing an Avatar</AccordionTrigger>
                    <AccordionContent className="space-y-2 text-muted-foreground">
                      <p>Your avatar is the first thing users see:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Use a clear, high-quality image</li>
                        <li>Match the art style to your character</li>
                        <li>Show personality through expression/pose</li>
                        <li>Consider the thumbnail preview size</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Checklist</CardTitle>
                <CardDescription>Before publishing your bot, make sure you have:</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    A unique, memorable name
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Clear description (2-3 sentences)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Detailed backstory with personality traits
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Defined dialogue style
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Engaging intro message with action format
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    3-5 relevant tags
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    Eye-catching avatar
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Help;
