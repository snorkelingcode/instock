
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z
    .string()
    .min(1, "URL is required")
    .url("Must be a valid URL"),
  targetText: z.string().optional(),
  frequency: z.number().min(5).max(240),
  autoCheckout: z.boolean().default(false),
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
      frequency: 30,
      autoCheckout: false,
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
    form.reset();
  };

  const formatFrequency = (value: number) => {
    if (value < 60) {
      return `${value} minutes`;
    } else {
      const hours = value / 60;
      return `${hours === 1 ? '1 hour' : `${hours} hours`}`;
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Add URL to Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Product Name" {...field} />
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
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/product/123"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The product page URL to monitor for stock status
                  </FormDescription>
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
                    <Input
                      placeholder="In Stock"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Specific text to look for on the page (leave blank for auto-detection)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check Frequency: {formatFrequency(field.value)}</FormLabel>
                  <FormControl>
                    <Slider
                      min={5}
                      max={240}
                      step={5}
                      defaultValue={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    How often to check the URL for stock changes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoCheckout"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Auto Checkout</FormLabel>
                    <FormDescription>
                      Automatically navigate through checkout process when item is in stock
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Add Monitor
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddMonitorForm;
