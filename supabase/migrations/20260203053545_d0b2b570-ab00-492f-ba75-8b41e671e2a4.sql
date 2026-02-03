-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  content TEXT,
  pdf_url TEXT,
  is_public BOOLEAN DEFAULT true,
  total_views INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- RLS policies for books
CREATE POLICY "Public books are viewable by everyone" 
ON public.books FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own books" 
ON public.books FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create books" 
ON public.books FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own books" 
ON public.books FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own books" 
ON public.books FOR DELETE 
USING (auth.uid() = creator_id);

-- Create junction table for book-chatbot many-to-many relationship
CREATE TABLE public.book_chatbot_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  chatbot_id UUID NOT NULL REFERENCES public.chatbots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, chatbot_id)
);

-- Enable RLS
ALTER TABLE public.book_chatbot_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for links
CREATE POLICY "Anyone can view links for public books/chatbots" 
ON public.book_chatbot_links FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.books WHERE books.id = book_id AND books.is_public = true) OR
  EXISTS (SELECT 1 FROM public.chatbots WHERE chatbots.id = chatbot_id AND chatbots.is_public = true)
);

CREATE POLICY "Book creators can manage links" 
ON public.book_chatbot_links FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.books WHERE books.id = book_id AND books.creator_id = auth.uid())
);

CREATE POLICY "Book creators can delete links" 
ON public.book_chatbot_links FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.books WHERE books.id = book_id AND books.creator_id = auth.uid())
);

-- Create book reviews table
CREATE TABLE public.book_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Enable RLS
ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for book reviews
CREATE POLICY "Anyone can view book reviews" 
ON public.book_reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create book reviews" 
ON public.book_reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book reviews" 
ON public.book_reviews FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book reviews" 
ON public.book_reviews FOR DELETE 
USING (auth.uid() = user_id);

-- Create book comments table
CREATE TABLE public.book_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for book comments
CREATE POLICY "Anyone can view book comments" 
ON public.book_comments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.books WHERE books.id = book_id AND books.is_public = true));

CREATE POLICY "Users can create book comments" 
ON public.book_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own book comments" 
ON public.book_comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own book comments" 
ON public.book_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_books_creator_id ON public.books(creator_id);
CREATE INDEX idx_books_is_public ON public.books(is_public);
CREATE INDEX idx_book_chatbot_links_book_id ON public.book_chatbot_links(book_id);
CREATE INDEX idx_book_chatbot_links_chatbot_id ON public.book_chatbot_links(chatbot_id);
CREATE INDEX idx_book_reviews_book_id ON public.book_reviews(book_id);
CREATE INDEX idx_book_comments_book_id ON public.book_comments(book_id);

-- Add trigger for updated_at
CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_reviews_updated_at
BEFORE UPDATE ON public.book_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_comments_updated_at
BEFORE UPDATE ON public.book_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();