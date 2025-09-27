import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertComplaintSchema } from "@shared/schema";
import { z } from "zod";

const complaintFormSchema = insertComplaintSchema.extend({
  title: z.string().min(1, "Title is required"),
});

type ComplaintFormData = z.infer<typeof complaintFormSchema>;

export default function ComplaintForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      category: "",
      priority: "medium",
      title: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      status: "open",
    },
  });

  const complaintMutation = useMutation({
    mutationFn: async (data: ComplaintFormData & { files: File[] }) => {
      const formData = new FormData();
      
      // Append complaint data
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'files' && value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      // Append files
      data.files.forEach((file) => {
        formData.append('media', file);
      });

      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your complaint has been registered successfully!",
      });
      form.reset();
      setSelectedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/city"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to register complaint. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude.toString());
          form.setValue("longitude", position.coords.longitude.toString());
          toast({
            title: "Location captured",
            description: "Your current location has been added to the complaint.",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Could not get your current location. Please enter manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: ComplaintFormData) => {
    complaintMutation.mutate({
      ...data,
      files: selectedFiles,
    });
  };

  return (
    <Card id="complaint-form">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          <i className="fas fa-file-alt text-primary mr-2"></i>
          Register Complaint
        </h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="water-supply">Water Supply</SelectItem>
                        <SelectItem value="garbage-collection">Garbage Collection</SelectItem>
                        <SelectItem value="road-maintenance">Road Maintenance</SelectItem>
                        <SelectItem value="street-lighting">Street Lighting</SelectItem>
                        <SelectItem value="drainage">Drainage</SelectItem>
                        <SelectItem value="parks-recreation">Parks & Recreation</SelectItem>
                        <SelectItem value="noise-pollution">Noise Pollution</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief description of the issue" 
                      {...field} 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the issue in detail..." 
                      className="h-24" 
                      {...field} 
                      data-testid="textarea-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Location Input */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input 
                        placeholder="Enter address or use current location" 
                        {...field} 
                        data-testid="input-location"
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={getCurrentLocation}
                      data-testid="button-get-location"
                    >
                      <i className="fas fa-location-arrow"></i>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Photos/Videos</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  className="hidden" 
                  id="fileUpload"
                  onChange={handleFileSelect}
                  data-testid="input-file-upload"
                />
                <label htmlFor="fileUpload" className="cursor-pointer">
                  <i className="fas fa-cloud-upload-alt text-3xl text-muted-foreground mb-2 block"></i>
                  <p className="text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">Images and videos up to 10MB each</p>
                </label>
              </div>
              
              {/* File Preview Area */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative bg-muted rounded-lg p-2">
                      <div className="text-xs text-center text-muted-foreground truncate">
                        {file.name}
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        data-testid={`button-remove-file-${index}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button 
                type="submit" 
                disabled={complaintMutation.isPending}
                data-testid="button-submit-complaint"
              >
                {complaintMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Complaint
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  // TODO: Implement save as draft functionality
                  toast({
                    title: "Draft saved",
                    description: "Your complaint has been saved as a draft.",
                  });
                }}
                data-testid="button-save-draft"
              >
                <i className="fas fa-save mr-2"></i>
                Save as Draft
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
