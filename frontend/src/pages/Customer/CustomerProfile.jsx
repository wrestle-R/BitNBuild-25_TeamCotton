import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaUser, FaPhone, FaMapMarkerAlt, FaCamera, FaSave, FaArrowLeft } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CustomerProfile = () => {
  const { user, updateProfileImage } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    photoUrl: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      coordinates: null
    }
  });

  useEffect(() => {
    if (user && auth.currentUser) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/profile`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      const text = await response.text();
      if (response.ok) {
        const data = JSON.parse(text);
        setFormData({
          name: data.name || '',
          contactNumber: data.contactNumber || '',
          photoUrl: data.photoUrl || '',
          address: {
            street: data.address?.street || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            pincode: data.address?.pincode || '',
            coordinates: (
              data.address?.coordinates &&
              typeof data.address.coordinates.lat === 'number' &&
              typeof data.address.coordinates.lng === 'number'
            )
              ? data.address.coordinates
              : null
          }
        });
        
        // Update the profile image in context when profile is loaded
        if (data.photoUrl) {
          updateProfileImage(data.photoUrl);
        }
      } else {
        throw new Error('Profile fetch failed');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          photoUrl: data.data.url
        }));
        // Update the profile image in the context for sidebar
        updateProfileImage(data.data.url);
        toast.success('Profile image uploaded successfully!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Update the profile image in context if it was changed
        if (formData.photoUrl) {
          updateProfileImage(formData.photoUrl);
        }
        toast.success('Profile updated successfully!');
        fetchProfile(); // Refresh to get updated coordinates
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <CustomerSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customer/dashboard')}
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
              <FaUser className="w-10 h-10 text-primary" />
              Customer Profile
            </h1>
            
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground font-montserrat">
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your basic profile details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={formData.photoUrl} alt={formData.name} />
                      <AvatarFallback className="text-2xl">
                        <FaUser />
                      </AvatarFallback>
                    </Avatar>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingImage}
                      />
                      <Button variant="outline" disabled={uploadingImage}>
                        <FaCamera className="w-4 h-4 mr-2" />
                        {uploadingImage ? 'Uploading...' : 'Change Photo'}
                      </Button>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email Field (Read-only) */}
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="bg-muted/50 opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Number</Label>
                    <Input
                      id="contact"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="Enter your contact number"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-4">
                   
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.address.street}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, street: e.target.value }
                        }))}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.address.city}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, city: e.target.value }
                          }))}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.address.state}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            address: { ...prev.address, state: e.target.value }
                          }))}
                          placeholder="State"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN Code</Label>
                      <Input
                        id="pincode"
                        value={formData.address.pincode}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          address: { ...prev.address, pincode: e.target.value }
                        }))}
                        placeholder="PIN Code"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full"
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
              <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-foreground font-montserrat flex items-center gap-2">
                    <FaMapMarkerAlt className="w-5 h-5 text-primary" />
                    Location
                  </CardTitle>
                  <CardDescription>
                    Your location on the map
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 rounded-lg overflow-hidden border border-border">
                    {formData.address.coordinates ? (
                      <MapContainer
                        center={[formData.address.coordinates.lat, formData.address.coordinates.lng]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[formData.address.coordinates.lat, formData.address.coordinates.lng]}>
                          <Popup>
                            <div className="text-center">
                              <strong>{formData.name}</strong><br />
                              {formData.address.street}<br />
                              {formData.address.city}, {formData.address.state}
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <div className="text-center text-muted-foreground">
                          <FaMapMarkerAlt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Save your address to see location on map</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {formData.address.coordinates && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Coordinates:</strong> {formData.address.coordinates.lat.toFixed(6)}, {formData.address.coordinates.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;