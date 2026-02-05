 import { useState, useEffect } from "react";
 import { useNavigate, useParams } from "react-router-dom";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import { useToast } from "@/hooks/use-toast";
 import { Upload, Loader2, X, FileText, BookOpen, Link2 } from "lucide-react";
 import { Sparkles, Users } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 
 interface LinkedChatbot {
   id: string;
   name: string;
   avatar_url: string | null;
 }
 
 interface ExtractedCharacter {
   name: string;
   description: string;
   backstory: string;
   dialogue_style: string;
   gender?: string;
   personality_tags?: string[];
   intro_message: string;
 }
 
 export default function EditBook() {
   const { bookId } = useParams();
   const [user, setUser] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [fetching, setFetching] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [uploadingPdf, setUploadingPdf] = useState(false);
   const [myChatbots, setMyChatbots] = useState<LinkedChatbot[]>([]);
   const [selectedChatbots, setSelectedChatbots] = useState<string[]>([]);
   const [extracting, setExtracting] = useState(false);
   const [extractedCharacters, setExtractedCharacters] = useState<ExtractedCharacter[]>([]);
   const [showCharacterDialog, setShowCharacterDialog] = useState(false);
   const [creatingCharacters, setCreatingCharacters] = useState(false);
   const [selectedCharacterIndexes, setSelectedCharacterIndexes] = useState<number[]>([]);
   const navigate = useNavigate();
   const { toast } = useToast();
 
   const [formData, setFormData] = useState({
     title: "",
     description: "",
     content: "",
     cover_url: "",
     pdf_url: "",
     is_public: true,
   });
 
   const [tags, setTags] = useState<string[]>([]);
   const [tagInput, setTagInput] = useState("");
   const [contentMode, setContentMode] = useState<"write" | "upload">("write");
 
   useEffect(() => {
     supabase.auth.getSession().then(({ data: { session } }) => {
       if (!session) {
         navigate("/auth");
       } else {
         setUser(session.user);
         fetchBook(session.user.id);
         fetchMyChatbots(session.user.id);
       }
     });
   }, [navigate, bookId]);
 
   const fetchBook = async (userId: string) => {
     if (!bookId) return;
     
     const { data: book, error } = await supabase
       .from("books")
       .select("*")
       .eq("id", bookId)
       .single();
 
     if (error || !book) {
       toast({
         title: "Book not found",
         description: "The book you're trying to edit doesn't exist.",
         variant: "destructive",
       });
       navigate("/profile");
       return;
     }
 
     if (book.creator_id !== userId) {
       toast({
         title: "Unauthorized",
         description: "You can only edit your own books.",
         variant: "destructive",
       });
       navigate("/profile");
       return;
     }
 
     setFormData({
       title: book.title || "",
       description: book.description || "",
       content: book.content || "",
       cover_url: book.cover_url || "",
       pdf_url: book.pdf_url || "",
       is_public: book.is_public ?? true,
     });
     setTags(book.tags || []);
     setContentMode(book.pdf_url ? "upload" : "write");
 
     // Fetch linked chatbots
     const { data: links } = await supabase
       .from("book_chatbot_links")
       .select("chatbot_id")
       .eq("book_id", bookId);
     
     if (links) {
       setSelectedChatbots(links.map((link) => link.chatbot_id));
     }
 
     setFetching(false);
   };
 
   const fetchMyChatbots = async (userId: string) => {
     const { data } = await supabase
       .from("chatbots")
       .select("id, name, avatar_url")
       .eq("creator_id", userId)
       .order("name");
     
     if (data) {
       setMyChatbots(data);
     }
   };
 
   const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     setUploading(true);
     try {
       const fileExt = file.name.split(".").pop();
       const fileName = `book-cover-${Math.random()}.${fileExt}`;
       const filePath = `${user.id}/${fileName}`;
 
       const { error: uploadError } = await supabase.storage
         .from("app-assets")
         .upload(filePath, file);
 
       if (uploadError) throw uploadError;
 
       const { data } = supabase.storage
         .from("app-assets")
         .getPublicUrl(filePath);
 
       setFormData({ ...formData, cover_url: data.publicUrl });
       toast({ title: "Cover uploaded successfully!" });
     } catch (error: any) {
       toast({
         title: "Upload failed",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setUploading(false);
     }
   };
 
   const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     if (file.type !== "application/pdf") {
       toast({
         title: "Invalid file type",
         description: "Please upload a PDF file",
         variant: "destructive",
       });
       return;
     }
 
     setUploadingPdf(true);
     try {
       const fileName = `book-pdf-${Math.random()}.pdf`;
       const filePath = `${user.id}/${fileName}`;
 
       const { error: uploadError } = await supabase.storage
         .from("app-assets")
         .upload(filePath, file);
 
       if (uploadError) throw uploadError;
 
       const { data } = supabase.storage
         .from("app-assets")
         .getPublicUrl(filePath);
 
       setFormData({ ...formData, pdf_url: data.publicUrl, content: "" });
       toast({ title: "PDF uploaded successfully!" });
     } catch (error: any) {
       toast({
         title: "Upload failed",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setUploadingPdf(false);
     }
   };
 
   const addTag = () => {
     if (tagInput.trim() && tags.length < 5 && !tags.includes(tagInput.trim())) {
       setTags([...tags, tagInput.trim()]);
       setTagInput("");
     }
   };
 
   const removeTag = (tagToRemove: string) => {
     setTags(tags.filter((tag) => tag !== tagToRemove));
   };
 
   const toggleChatbotLink = (chatbotId: string) => {
     setSelectedChatbots((prev) =>
       prev.includes(chatbotId)
         ? prev.filter((id) => id !== chatbotId)
         : [...prev, chatbotId]
     );
   };
 
   const handleExtractCharacters = async () => {
     if (!formData.content && !formData.pdf_url) {
       toast({
         title: "No content",
         description: "Please add book content before extracting characters.",
         variant: "destructive",
       });
       return;
     }
 
     setExtracting(true);
     try {
       const response = await fetch(
         `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-characters`,
         {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
           },
           body: JSON.stringify({
             bookTitle: formData.title,
             bookDescription: formData.description,
             bookContent: formData.content,
           }),
         }
       );
 
       if (response.status === 429) {
         toast({
           title: "Rate limited",
           description: "Too many requests. Please try again in a moment.",
           variant: "destructive",
         });
         return;
       }
 
       if (response.status === 402) {
         toast({
           title: "Credits required",
           description: "Please add AI credits to continue.",
           variant: "destructive",
         });
         return;
       }
 
       if (!response.ok) {
         throw new Error("Failed to extract characters");
       }
 
       const data = await response.json();
       if (data.characters && data.characters.length > 0) {
         setExtractedCharacters(data.characters);
         setSelectedCharacterIndexes(data.characters.map((_: any, i: number) => i));
         setShowCharacterDialog(true);
       } else {
         toast({
           title: "No characters found",
           description: "Could not identify any characters in the book content.",
           variant: "destructive",
         });
       }
     } catch (error: any) {
       toast({
         title: "Extraction failed",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setExtracting(false);
     }
   };
 
   const toggleCharacterSelection = (index: number) => {
     setSelectedCharacterIndexes((prev) =>
       prev.includes(index)
         ? prev.filter((i) => i !== index)
         : [...prev, index]
     );
   };
 
   const handleCreateCharacters = async () => {
     if (selectedCharacterIndexes.length === 0) {
       toast({
         title: "No characters selected",
         description: "Please select at least one character to create.",
         variant: "destructive",
       });
       return;
     }
 
     setCreatingCharacters(true);
     try {
       const charactersToCreate = selectedCharacterIndexes.map(
         (i) => extractedCharacters[i]
       );
 
       const createdIds: string[] = [];
 
       for (const char of charactersToCreate) {
         const { data: chatbot, error } = await supabase
           .from("chatbots")
           .insert({
             name: char.name,
             description: char.description,
             backstory: char.backstory,
             dialogue_style: char.dialogue_style,
             gender: char.gender || null,
             tags: char.personality_tags || [],
             intro_message: char.intro_message,
             creator_id: user.id,
             is_public: formData.is_public,
           })
           .select()
           .single();
 
         if (error) {
           console.error("Error creating character:", error);
           continue;
         }
 
         if (chatbot) {
           createdIds.push(chatbot.id);
 
           // Link the created chatbot to this book
           await supabase.from("book_chatbot_links").insert({
             book_id: bookId,
             chatbot_id: chatbot.id,
           });
         }
       }
 
       if (createdIds.length > 0) {
         toast({
           title: "Characters created!",
           description: `Successfully created ${createdIds.length} character(s) from your book.`,
         });
         setShowCharacterDialog(false);
         setExtractedCharacters([]);
         
         // Refresh linked chatbots
         fetchMyChatbots(user.id);
         const { data: links } = await supabase
           .from("book_chatbot_links")
           .select("chatbot_id")
           .eq("book_id", bookId);
         if (links) {
           setSelectedChatbots(links.map((link) => link.chatbot_id));
         }
       } else {
         toast({
           title: "Creation failed",
           description: "Could not create any characters. Please try again.",
           variant: "destructive",
         });
       }
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setCreatingCharacters(false);
     }
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     if (!formData.content && !formData.pdf_url) {
       toast({
         title: "Missing content",
         description: "Please write content or upload a PDF",
         variant: "destructive",
       });
       return;
     }
 
     setLoading(true);
 
     try {
       // Update the book
       const { error } = await supabase
         .from("books")
         .update({
           ...formData,
           tags,
         })
         .eq("id", bookId);
 
       if (error) throw error;
 
       // Update chatbot links - delete existing and insert new
       await supabase
         .from("book_chatbot_links")
         .delete()
         .eq("book_id", bookId);
 
       if (selectedChatbots.length > 0) {
         const links = selectedChatbots.map((chatbotId) => ({
           book_id: bookId!,
           chatbot_id: chatbotId,
         }));
 
         const { error: linkError } = await supabase
           .from("book_chatbot_links")
           .insert(links);
 
         if (linkError) {
           console.error("Error linking chatbots:", linkError);
         }
       }
 
       toast({ title: "Book updated successfully!" });
       navigate(`/book/${bookId}`);
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     } finally {
       setLoading(false);
     }
   };
 
   if (fetching) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen p-6">
       <div className="max-w-3xl mx-auto">
         <div className="flex items-center gap-3 mb-8">
           <BookOpen className="h-8 w-8 text-amber-500" />
           <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
             Edit Book
           </h1>
         </div>
 
         <form onSubmit={handleSubmit} className="space-y-6">
           {/* Cover Image */}
           <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
             <Label htmlFor="cover" className="block mb-2">
               Book Cover
             </Label>
             <div className="flex items-center gap-4">
               {formData.cover_url ? (
                 <div className="relative w-32 h-44">
                   <img
                     src={formData.cover_url}
                     alt="Cover"
                     className="w-full h-full object-cover rounded-lg"
                   />
                   <Button
                     type="button"
                     size="icon"
                     variant="destructive"
                     className="absolute -top-2 -right-2"
                     onClick={() => setFormData({ ...formData, cover_url: "" })}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                 </div>
               ) : (
                 <label className="w-32 h-44 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                   <input
                     type="file"
                     accept="image/*"
                     onChange={handleCoverUpload}
                     className="hidden"
                   />
                   {uploading ? (
                     <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   ) : (
                     <>
                       <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                       <span className="text-xs text-muted-foreground">Upload Cover</span>
                     </>
                   )}
                 </label>
               )}
             </div>
           </div>
 
           {/* Book Details */}
           <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card space-y-4">
             <div>
               <Label htmlFor="title">Title *</Label>
               <Input
                 id="title"
                 value={formData.title}
                 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                 required
                 className="mt-1"
                 placeholder="Enter book title"
               />
             </div>
 
             <div>
               <Label htmlFor="description">Description</Label>
               <Textarea
                 id="description"
                 value={formData.description}
                 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                 className="mt-1"
                 rows={3}
                 placeholder="Brief description of your book"
               />
             </div>
 
             <div>
               <Label htmlFor="tags">Tags (up to 5)</Label>
               <div className="flex gap-2 mt-1">
                 <Input
                   id="tags"
                   value={tagInput}
                   onChange={(e) => setTagInput(e.target.value)}
                   onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                   disabled={tags.length >= 5}
                   placeholder="Add a tag"
                 />
                 <Button type="button" onClick={addTag} disabled={tags.length >= 5}>
                   Add
                 </Button>
               </div>
               <div className="flex flex-wrap gap-2 mt-2">
                 {tags.map((tag) => (
                   <Badge key={tag} variant="secondary">
                     {tag}
                     <button
                       type="button"
                       onClick={() => removeTag(tag)}
                       className="ml-2 hover:text-destructive"
                     >
                       ×
                     </button>
                   </Badge>
                 ))}
               </div>
             </div>
 
             <div className="flex items-center justify-between">
               <Label htmlFor="is_public">Make Public</Label>
               <Switch
                 id="is_public"
                 checked={formData.is_public}
                 onCheckedChange={(checked) =>
                   setFormData({ ...formData, is_public: checked })
                 }
               />
             </div>
           </div>
 
           {/* Book Content */}
           <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
             <Label className="block mb-4">Book Content *</Label>
             <Tabs value={contentMode} onValueChange={(v) => setContentMode(v as "write" | "upload")}>
               <TabsList className="mb-4">
                 <TabsTrigger value="write" className="flex items-center gap-2">
                   <FileText className="h-4 w-4" />
                   Write
                 </TabsTrigger>
                 <TabsTrigger value="upload" className="flex items-center gap-2">
                   <Upload className="h-4 w-4" />
                   Upload PDF
                 </TabsTrigger>
               </TabsList>
 
               <TabsContent value="write">
                 <Textarea
                   value={formData.content}
                   onChange={(e) => setFormData({ ...formData, content: e.target.value, pdf_url: "" })}
                   className="min-h-[300px] font-serif"
                   placeholder="Write your book content here...
 
 You can use chapters, paragraphs, and formatting as needed. This will be displayed as the book content for readers."
                 />
               </TabsContent>
 
               <TabsContent value="upload">
                 {formData.pdf_url ? (
                   <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                     <FileText className="h-8 w-8 text-amber-500" />
                     <div className="flex-1">
                       <p className="font-medium">PDF Uploaded</p>
                       <p className="text-sm text-muted-foreground">Your PDF is ready</p>
                     </div>
                     <Button
                       type="button"
                       variant="destructive"
                       size="sm"
                       onClick={() => setFormData({ ...formData, pdf_url: "" })}
                     >
                       Remove
                     </Button>
                   </div>
                 ) : (
                   <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                     <input
                       type="file"
                       accept="application/pdf"
                       onChange={handlePdfUpload}
                       className="hidden"
                     />
                     {uploadingPdf ? (
                       <Loader2 className="h-12 w-12 animate-spin text-primary" />
                     ) : (
                       <>
                         <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                         <span className="text-muted-foreground">Click to upload PDF</span>
                       </>
                     )}
                   </label>
                 )}
               </TabsContent>
             </Tabs>
           </div>
 
           {/* Link to Characters */}
           {myChatbots.length > 0 && (
             <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
               <div className="flex items-center gap-2 mb-4">
                 <Link2 className="h-5 w-5 text-primary" />
                 <Label>Link to Characters (Optional)</Label>
               </div>
               <p className="text-sm text-muted-foreground mb-4">
                 Link this book to your characters to provide additional backstory context.
               </p>
               <div className="grid gap-2 max-h-48 overflow-y-auto">
                 {myChatbots.map((chatbot) => (
                   <label
                     key={chatbot.id}
                     className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 cursor-pointer transition-colors"
                   >
                     <Checkbox
                       checked={selectedChatbots.includes(chatbot.id)}
                       onCheckedChange={() => toggleChatbotLink(chatbot.id)}
                     />
                     {chatbot.avatar_url ? (
                       <img
                         src={chatbot.avatar_url}
                         alt={chatbot.name}
                         className="w-8 h-8 rounded-full object-cover"
                       />
                     ) : (
                       <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                         <span className="text-sm font-bold text-primary">
                           {chatbot.name.charAt(0)}
                         </span>
                       </div>
                     )}
                     <span className="font-medium">{chatbot.name}</span>
                   </label>
                 ))}
               </div>
             </div>
           )}
 
         {/* Convert to Character */}
         <div className="bg-gradient-card rounded-xl p-6 border border-border shadow-card">
           <div className="flex items-center gap-2 mb-4">
             <Sparkles className="h-5 w-5 text-amber-500" />
             <Label>Convert to Characters</Label>
           </div>
           <p className="text-sm text-muted-foreground mb-4">
             Use AI to extract characters from your book and automatically create chatbots with their backstory, personality, and dialogue style.
           </p>
           <Button
             type="button"
             variant="outline"
             onClick={handleExtractCharacters}
             disabled={extracting || (!formData.content && !formData.pdf_url)}
             className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
           >
             {extracting ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Analyzing book...
               </>
             ) : (
               <>
                 <Users className="mr-2 h-4 w-4" />
                 Extract Characters from Book
               </>
             )}
           </Button>
         </div>
 
           <Button
             type="submit"
             disabled={loading}
             className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
           >
             {loading ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Saving...
               </>
             ) : (
               <>
                 <BookOpen className="mr-2 h-4 w-4" />
                 Save Changes
               </>
             )}
           </Button>
         </form>
       </div>
       
       {/* Character Selection Dialog */}
       <Dialog open={showCharacterDialog} onOpenChange={setShowCharacterDialog}>
         <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Users className="h-5 w-5 text-primary" />
               Characters Found
             </DialogTitle>
             <DialogDescription>
               Select which characters you want to create as chatbots. They will be linked to this book automatically.
             </DialogDescription>
           </DialogHeader>
 
           <div className="space-y-4 mt-4">
             {extractedCharacters.map((char, index) => (
               <label
                 key={index}
                 className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                   selectedCharacterIndexes.includes(index)
                     ? "border-primary bg-primary/5"
                     : "border-border hover:border-primary/50"
                 }`}
               >
                 <div className="flex items-start gap-3">
                   <Checkbox
                     checked={selectedCharacterIndexes.includes(index)}
                     onCheckedChange={() => toggleCharacterSelection(index)}
                     className="mt-1"
                   />
                   <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-semibold text-foreground">{char.name}</h3>
                       {char.gender && char.gender !== "unknown" && (
                         <Badge variant="secondary" className="text-xs">
                           {char.gender}
                         </Badge>
                       )}
                     </div>
                     <p className="text-sm text-muted-foreground mb-2">
                       {char.description}
                     </p>
                     <div className="flex flex-wrap gap-1 mb-2">
                       {char.personality_tags?.map((tag) => (
                         <Badge key={tag} variant="outline" className="text-xs">
                           {tag}
                         </Badge>
                       ))}
                     </div>
                     <p className="text-xs text-muted-foreground italic">
                       "{char.intro_message?.substring(0, 100)}..."
                     </p>
                   </div>
                 </div>
               </label>
             ))}
           </div>
 
           <div className="flex gap-3 mt-6">
             <Button
               variant="outline"
               onClick={() => setShowCharacterDialog(false)}
               className="flex-1"
             >
               Cancel
             </Button>
             <Button
               onClick={handleCreateCharacters}
               disabled={creatingCharacters || selectedCharacterIndexes.length === 0}
               className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
             >
               {creatingCharacters ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Creating...
                 </>
               ) : (
                 <>
                   <Sparkles className="mr-2 h-4 w-4" />
                   Create {selectedCharacterIndexes.length} Character(s)
                 </>
               )}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }