import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    // Profile Settings
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: "",
    location: "",
    website: "",
    
    // Notification Preferences
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    complaintUpdates: true,
    communityUpdates: true,
    systemAlerts: true,
    weeklyDigest: true,
    
    // Privacy Settings
    profileVisibility: "public",
    showEmail: false,
    showLocation: true,
    allowMessages: true,
    
    // Language & Display
    language: "en",
    theme: "system",
    timeZone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    
    // Advanced Settings
    autoSaveComplaints: true,
    enableGPS: true,
    dataSaver: false,
    analyticsOptOut: false
  });

  const handleSave = (section: string) => {
    // TODO: Implement save to backend
    toast({
      title: "Settings Saved",
      description: `Your ${section} settings have been updated successfully.`,
    });
  };

  const handleExportData = () => {
    // TODO: Implement data export
    toast({
      title: "Data Export",
      description: "Your data export will be sent to your email within 24 hours.",
    });
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
      variant: "destructive",
    });
  };

  return (
    <Card className="floating-card glass-modern card-squircle-lg animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-xl text-gradient flex items-center">
          <i className="fas fa-cog mr-3 animate-float"></i>
          User Settings & Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 squircle-lg">
            <TabsTrigger value="profile" className="squircle-md">Profile</TabsTrigger>
            <TabsTrigger value="notifications" className="squircle-md">Notifications</TabsTrigger>
            <TabsTrigger value="privacy" className="squircle-md">Privacy</TabsTrigger>
            <TabsTrigger value="advanced" className="squircle-md">Advanced</TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4 p-4 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">First Name</label>
                  <Input 
                    value={settings.firstName}
                    onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                    className="squircle-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Last Name</label>
                  <Input 
                    value={settings.lastName}
                    onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                    className="squircle-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Bio</label>
                <Textarea 
                  placeholder="Tell us about yourself..."
                  value={settings.bio}
                  onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                  className="h-20 squircle-md"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
                  <Input 
                    placeholder="City, State"
                    value={settings.location}
                    onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
                    className="squircle-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Website</label>
                  <Input 
                    placeholder="https://yourwebsite.com"
                    value={settings.website}
                    onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                    className="squircle-md"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave("profile")}
                  className="modern-button btn-squircle"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Profile
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4 p-4 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">Browser notifications</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">SMS Notifications</h4>
                    <p className="text-sm text-muted-foreground">Text message alerts</p>
                  </div>
                  <Switch 
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                
                <div className="border-t border-border/50 pt-4">
                  <h4 className="font-medium text-foreground mb-3">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Complaint Updates</span>
                      <Switch 
                        checked={settings.complaintUpdates}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, complaintUpdates: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Community Updates</span>
                      <Switch 
                        checked={settings.communityUpdates}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, communityUpdates: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">System Alerts</span>
                      <Switch 
                        checked={settings.systemAlerts}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, systemAlerts: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Weekly Digest</span>
                      <Switch 
                        checked={settings.weeklyDigest}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weeklyDigest: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave("notification")}
                  className="modern-button btn-squircle"
                >
                  <i className="fas fa-bell mr-2"></i>
                  Save Preferences
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-4">
            <div className="space-y-4 p-4 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Profile Visibility</label>
                <Select value={settings.profileVisibility} onValueChange={(value) => setSettings(prev => ({ ...prev, profileVisibility: value }))}>
                  <SelectTrigger className="squircle-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="limited">Limited</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Email Address</span>
                  <Switch 
                    checked={settings.showEmail}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showEmail: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Location</span>
                  <Switch 
                    checked={settings.showLocation}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showLocation: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Allow Direct Messages</span>
                  <Switch 
                    checked={settings.allowMessages}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowMessages: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave("privacy")}
                  className="modern-button btn-squircle"
                >
                  <i className="fas fa-shield-alt mr-2"></i>
                  Save Privacy
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4 p-4 bg-gradient-to-r from-muted/30 to-muted/20 squircle-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Language</label>
                  <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger className="squircle-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">हिंदी</SelectItem>
                      <SelectItem value="mr">मराठी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Theme</label>
                  <Select value={settings.theme} onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}>
                    <SelectTrigger className="squircle-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auto-save Complaint Drafts</span>
                  <Switch 
                    checked={settings.autoSaveComplaints}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSaveComplaints: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enable GPS Location</span>
                  <Switch 
                    checked={settings.enableGPS}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableGPS: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Saver Mode</span>
                  <Switch 
                    checked={settings.dataSaver}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dataSaver: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Opt-out of Analytics</span>
                  <Switch 
                    checked={settings.analyticsOptOut}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, analyticsOptOut: checked }))}
                  />
                </div>
              </div>
              
              <div className="border-t border-border/50 pt-4 space-y-3">
                <h4 className="font-medium text-foreground">Data Management</h4>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleExportData}
                    variant="outline"
                    className="modern-button btn-squircle"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Export Data
                  </Button>
                  <Button 
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="modern-button btn-squircle"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Delete Account
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => handleSave("advanced")}
                  className="modern-button btn-squircle"
                >
                  <i className="fas fa-cog mr-2"></i>
                  Save Advanced
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}