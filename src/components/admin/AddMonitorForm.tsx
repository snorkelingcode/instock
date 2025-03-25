
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { createStockMonitor } from "@/services/stockMonitorService";

interface AddMonitorFormProps {
  onSuccess: () => void;
}

const AddMonitorForm: React.FC<AddMonitorFormProps> = ({ onSuccess }) => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [targetText, setTargetText] = useState("");
  const [frequency, setFrequency] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast({
        title: "URL is required",
        description: "Please enter a valid URL to monitor",
        variant: "destructive",
      });
      return;
    }
    
    if (!name) {
      toast({
        title: "Name is required",
        description: "Please give this monitor a name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await createStockMonitor({
        url,
        name,
        target_text: targetText,
        check_frequency: frequency
      });
      
      toast({
        title: "Monitor Added",
        description: "The stock monitor has been created successfully.",
        variant: "default",
      });
      
      // Reset form
      setUrl("");
      setName("");
      setTargetText("");
      setFrequency(30);
      
      // Notify parent component
      onSuccess();
    } catch (error) {
      console.error("Error adding monitor:", error);
      toast({
        title: "Error",
        description: "Failed to add monitor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatFrequency = (mins: number) => {
    if (mins < 60) {
      return `${mins} minutes`;
    } else {
      const hours = mins / 60;
      return `${hours === 1 ? '1 hour' : `${hours} hours`}`;
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Add New Stock Monitor</CardTitle>
        <CardDescription>
          Create a new product availability monitor using Bright Data's Target API
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monitor-name">Monitor Name</Label>
            <Input
              id="monitor-name"
              placeholder="PlayStation 5 Digital Edition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="monitor-url">Product URL</Label>
            <Input
              id="monitor-url"
              placeholder="https://www.target.com/p/item/-/A-12345"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the full product URL (e.g., https://www.target.com/p/product/-/A-12345)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="monitor-text">Target Text (Optional)</Label>
            <Input
              id="monitor-text"
              placeholder="Add to cart"
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional text to look for on the page as an indicator of availability
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="check-frequency">Check Frequency</Label>
              <span className="text-sm">{formatFrequency(frequency)}</span>
            </div>
            <Slider
              id="check-frequency"
              min={5}
              max={240}
              step={5}
              value={[frequency]}
              onValueChange={(values) => setFrequency(values[0])}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 min</span>
              <span>1 hour</span>
              <span>4 hours</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              How often should this product be checked for availability changes
            </p>
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-blue-600 bg-blue-50 p-3 rounded">
              Using Bright Data Target API costs approximately $0.0015 per check. With the default frequency of 
              30 minutes, this monitor will cost about $0.07 per day or $2.16 per month.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => {
            setUrl("");
            setName("");
            setTargetText("");
            setFrequency(30);
          }}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Monitor"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AddMonitorForm;
