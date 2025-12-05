import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, ArrowRight } from "lucide-react";

const Browser = () => {
  const [url, setUrl] = useState("");
  const [iframeSrc, setIframeSrc] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleGo = () => {
    if (url) {
      let formattedUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        formattedUrl = "https://" + url;
      }
      setIframeSrc(formattedUrl);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleGo();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 p-4 bg-card border-b border-border">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter URL (e.g., example.com)"
          className="flex-1"
        />
        <Button onClick={handleGo} size="sm">
          <ArrowRight className="h-4 w-4 mr-2" />
          Go
        </Button>
      </div>
      <div className="flex-1 bg-background">
        {iframeSrc ? (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-none"
            title="Browser"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Enter a URL above to browse</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browser;
