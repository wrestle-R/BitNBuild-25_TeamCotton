import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaUser, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const CustomerProfile = () => {
  const { user, token } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    address: '',
    preference: '',
    photoUrl: ''
  });

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/customer/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setFormData({
          name: data.name || '',
          contactNumber: data.contactNumber || '',
          address: data.address || '',
          preference: data.preference || '',
          photoUrl: data.photoUrl || ''
        });
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/customer/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data.customer);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original data
    setFormData({
      name: profileData?.name || '',
      contactNumber: profileData?.contactNumber || '',
      address: profileData?.address || '',
      preference: profileData?.preference || '',
      photoUrl: profileData?.photoUrl || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <motion.div 
          className="p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
              <FaUser className="w-10 h-10 text-primary" />
              Profile
            </h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <FaEdit className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <FaSave className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  className="flex items-center gap-2"
                >
                  <FaTimes className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <main className="p-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Your Profile Information</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Update your account details' : 'View and manage your account details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your name"
                        />
                      ) : (
                        <p className="text-lg text-foreground px-3 py-2 border rounded-md bg-muted/50">
                          {profileData?.name || 'Not set'}
                        </p>
                      )}
                    </div>

                    {/* Email Field (Read-only) */}
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <p className="text-lg text-foreground px-3 py-2 border rounded-md bg-muted/50 opacity-60">
                        {profileData?.email || user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    {/* Phone Number Field */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={formData.contactNumber}
                          onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                          placeholder="Enter your phone number"
                          type="tel"
                        />
                      ) : (
                        <p className="text-lg text-foreground px-3 py-2 border rounded-md bg-muted/50">
                          {profileData?.contactNumber || 'Not provided'}
                        </p>
                      )}
                    </div>

                    {/* Photo URL Field */}
                    <div className="space-y-2">
                      <Label htmlFor="photoUrl">Profile Photo URL</Label>
                      {isEditing ? (
                        <Input
                          id="photoUrl"
                          value={formData.photoUrl}
                          onChange={(e) => handleInputChange('photoUrl', e.target.value)}
                          placeholder="Enter photo URL (https://...)"
                          type="url"
                        />
                      ) : (
                        <div className="px-3 py-2 border rounded-md bg-muted/50">
                          {profileData?.photoUrl ? (
                            <div className="flex items-center gap-3">
                              <img 
                                src={profileData.photoUrl} 
                                alt="Profile" 
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                              <span className="text-sm text-muted-foreground truncate">
                                {profileData.photoUrl}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No photo uploaded</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Preference Field */}
                    <div className="space-y-2">
                      <Label>Food Preference</Label>
                      {isEditing ? (
                        <Select
                          value={formData.preference}
                          onValueChange={(value) => handleInputChange('preference', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="veg">Vegetarian</SelectItem>
                            <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="px-3 py-2 border rounded-md bg-muted/50">
                          {profileData?.preference ? (
                            <Badge variant={profileData.preference === 'veg' ? 'default' : 'destructive'}>
                              {profileData.preference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Address Field - Full Width */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter your address"
                        />
                      ) : (
                        <p className="text-lg text-foreground px-3 py-2 border rounded-md bg-muted/50">
                          {profileData?.address || 'Not provided'}
                        </p>
                      )}
                    </div>

                    {/* Account Info - Full Width */}
                    {profileData && (
                      <div className="space-y-2 md:col-span-2 pt-4 border-t">
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">Account created:</span>{' '}
                            {new Date(profileData.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Last updated:</span>{' '}
                            {new Date(profileData.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerProfile;