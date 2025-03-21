
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  targetText: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMonitorFormProps {
  onSubmit: (values: FormValues) => void;
}

const AddMonitorForm: React.FC<AddMonitorFormProps> = ({ onSubmit }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      url: "",
      targetText: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 bg-white rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Add New Monitoring URL</h3>
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Pokemon TCG Scarlet & Violet" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/product" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="targetText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Text (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="e.g. Add to Cart, In Stock, etc." 
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">
          <Plus size={16} className="mr-2" />
          Add Monitor
        </Button>
      </form>
    </Form>
  );
};

export default AddMonitorForm;
