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
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Checkbox } from "@/components/ui/checkbox";
 
 interface LinkedChatbot {
   id: string;
   name: string;
   avatar_url: string | null;
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
     </div>
   );
 }