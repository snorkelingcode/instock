
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Link, Heading1, 
  Heading2, Heading3, Image as ImageIcon 
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import "./richTextEditor.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = "",
  minHeight = "300px"
}) => {
  const [htmlMode, setHtmlMode] = useState<boolean>(false);
  const [textareaValue, setTextareaValue] = useState<string>(value);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [showLinkPopover, setShowLinkPopover] = useState<boolean>(false);
  const [showImagePopover, setShowImagePopover] = useState<boolean>(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !htmlMode) {
      editorRef.current.innerHTML = value;
    }
  }, [value, htmlMode]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setTextareaValue(newValue);
    onChange(newValue);
  };

  const handleContentChange = () => {
    if (editorRef.current && !htmlMode) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleContentChange();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertLink = () => {
    if (!linkUrl) return;
    execCommand("createLink", linkUrl);
    setLinkUrl("");
    setShowLinkPopover(false);
  };

  const insertImage = () => {
    if (!imageUrl) return;
    execCommand("insertImage", imageUrl);
    setImageUrl("");
    setShowImagePopover(false);
  };

  const handleModeChange = (value: string) => {
    const isHtmlMode = value === "html";
    setHtmlMode(isHtmlMode);
    
    if (isHtmlMode && editorRef.current) {
      setTextareaValue(editorRef.current.innerHTML);
    } else if (!isHtmlMode) {
      if (editorRef.current) {
        editorRef.current.innerHTML = textareaValue;
      }
    }
  };

  return (
    <div className={`border rounded-md ${className}`}>
      <Tabs 
        defaultValue="visual" 
        onValueChange={handleModeChange}
        className="w-full"
      >
        <div className="border-b px-2">
          <TabsList className="bg-transparent">
            <TabsTrigger value="visual" className="data-[state=active]:bg-background data-[state=active]:shadow-none">
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="html" className="data-[state=active]:bg-background data-[state=active]:shadow-none">
              HTML
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="visual" className="p-0 mt-0">
          <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('bold')}
              type="button"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('italic')}
              type="button"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('underline')}
              type="button"
            >
              <Underline className="h-4 w-4" />
            </Button>

            <div className="h-6 border-l mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('formatBlock', '<h1>')}
              type="button"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('formatBlock', '<h2>')}
              type="button"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('formatBlock', '<h3>')}
              type="button"
            >
              <Heading3 className="h-4 w-4" />
            </Button>

            <div className="h-6 border-l mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('justifyLeft')}
              type="button"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('justifyCenter')}
              type="button"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('justifyRight')}
              type="button"
            >
              <AlignRight className="h-4 w-4" />
            </Button>

            <div className="h-6 border-l mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('insertUnorderedList')}
              type="button"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => execCommand('insertOrderedList')}
              type="button"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>

            <div className="h-6 border-l mx-1" />

            <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-2">
                  <Label htmlFor="link-url">Link URL</Label>
                  <Input 
                    id="link-url" 
                    placeholder="https://example.com" 
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                  <Button size="sm" onClick={insertLink} className="w-full">
                    Insert Link
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={showImagePopover} onOpenChange={setShowImagePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <Input 
                    id="image-url" 
                    placeholder="https://example.com/image.jpg" 
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <Button size="sm" onClick={insertImage} className="w-full">
                    Insert Image
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onInput={handleContentChange}
            onBlur={handleContentChange}
            className="p-4 min-h-[300px] outline-none rich-text-editor"
            style={{ minHeight }}
            data-placeholder={placeholder}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </TabsContent>

        <TabsContent value="html" className="p-0 mt-0">
          <textarea
            value={textareaValue}
            onChange={handleTextareaChange}
            className="w-full p-4 font-mono text-sm bg-gray-50 outline-none"
            style={{ minHeight }}
            placeholder="Enter HTML here..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RichTextEditor;
