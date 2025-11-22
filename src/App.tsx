import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Discover";
import Auth from "./pages/Auth";
import CreateChatbot from "./pages/CreateChatbot";
import Notifications from "./pages/Notifications";
import Chats from "./pages/Chats";
import Profile from "./pages/Profile";
import ChatInterface from "./pages/ChatInterface";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/create" element={<CreateChatbot />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat/:chatbotId" element={<ChatInterface />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
