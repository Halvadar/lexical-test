import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { BotIcon, Loader2 } from "lucide-react";

interface AIGeneratorDialogProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export function AIGeneratorDialog({
  onGenerate,
  isGenerating,
}: AIGeneratorDialogProps) {
  const [prompt, setPrompt] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleGenerate = () => {
    onGenerate(prompt);
    setOpen(false); // Close the dialog after generating
    setPrompt(""); // Clear the prompt
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-2">
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <BotIcon className="w-4 h-4 mr-2" />
          )}
          AI Assistant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Message Generator</DialogTitle>
          <DialogDescription>
            Create a personalized message using AI
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Enter your message prompt (e.g., 'Create a thank you message with a special offer')"
            className="min-h-[100px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? "Generating..." : "Generate Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
