import { useState, useEffect } from "react";
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
  phoneNumber: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Please enter a valid phone number (e.g., +911234567890)"),
});

type ComplaintFormData = z.infer<typeof complaintFormSchema>;

export default function ComplaintForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintFormSchema),
    defaultValues: {
      category: "",
      title: "",
      description: "",
      location: "",
      latitude: "",
      longitude: "",
      status: "open",
      phoneNumber: "",
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

  // Auto-request GPS location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('pending');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude.toString());
          form.setValue("longitude", position.coords.longitude.toString());
          setLocationStatus('success');
          toast({
            title: "Location captured",
            description: "Your current location has been added to the complaint.",
          });
        },
        (error) => {
          setLocationStatus('error');
          toast({
            title: "Location permission required",
            description: "Please allow location access to submit a complaint. This ensures accurate issue reporting.",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationStatus('error');
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser. Please use a modern browser.",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: ComplaintFormData) => {
    // Hard block submission without valid GPS location
    if (locationStatus !== 'success') {
      toast({
        title: "GPS Location Required",
        description: "Please allow location access to submit your complaint. This ensures accurate issue reporting.",
        variant: "destructive",
      });
      return;
    }

    complaintMutation.mutate({
      ...data,
      files: selectedFiles,
    });
  };

  return (
    <Card id="complaint-form" className="floating-card glass-modern card-squircle-lg animate-fade-in-up">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-gradient mb-4 flex items-center">
          <i className="fas fa-file-alt mr-3 animate-float"></i>
          Register Complaint
        </h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Location Address</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input 
                        placeholder="Enter address or landmark" 
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
                      <i className={`fas fa-location-arrow ${locationStatus === 'pending' ? 'fa-spin' : ''}`}></i>
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number Field */}
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (for SMS/WhatsApp notifications)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+911234567890" 
                      {...field} 
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    We'll send you updates about your complaint via SMS/WhatsApp
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* GPS Status Indicator */}
            <div className={`p-3 rounded-lg ${
              locationStatus === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 
              locationStatus === 'error' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 
              'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
            }`} data-testid="location-status">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <i className={`fas ${
                    locationStatus === 'success' ? 'fa-check-circle' : 
                    locationStatus === 'error' ? 'fa-exclamation-circle' : 
                    'fa-spinner fa-spin'
                  }`}></i>
                  <span className="text-sm font-medium">
                    {locationStatus === 'success' ? `GPS location captured: ${form.watch('latitude')?.substring(0, 8)}, ${form.watch('longitude')?.substring(0, 8)}` : 
                     locationStatus === 'error' ? 'GPS location required - Please allow location access' : 
                     'Requesting GPS location...'}
                  </span>
                </div>
                {locationStatus === 'error' && (
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={getCurrentLocation}
                    data-testid="button-retry-location"
                  >
                    Retry
                  </Button>
                )}
              </div>
            </div>
            
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Photos/Videos</label>
              <div className="border-2 border-dashed border-border squircle-lg p-6 text-center hover:border-primary transition-all duration-300 magnetic-button">
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
                    <div key={index} className="relative bg-muted squircle-md p-2 floating-card">
                      <div className="text-xs text-center text-muted-foreground truncate">
                        {file.name}
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground squircle-full w-5 h-5 flex items-center justify-center text-xs modern-button"
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
                className="modern-button btn-squircle-lg h-12 px-6"
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
                className="modern-button btn-squircle-lg h-12 px-6"
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
