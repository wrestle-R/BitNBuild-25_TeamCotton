import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaExclamationTriangle, FaSave, FaArrowLeft, FaPlus, FaTimes } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';

const CustomerAllergies = () => {
  const { user } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    allergies: [],
    dietaryRestrictions: [],
    additionalNotes: ''
  });

  const [newAllergy, setNewAllergy] = useState({
    name: '',
    severity: 'mild'
  });

  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const dietaryOptions = [
    'gluten-free',
    'dairy-free', 
    'nut-free',
    'soy-free',
    'egg-free',
    'shellfish-free',
    'vegan',
    'vegetarian',
    'other'
  ];

  useEffect(() => {
    fetchAllergies();
  }, []);

  const fetchAllergies = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      const token = await auth.currentUser.getIdToken();
      console.log('🔍 Fetching allergies from:', `${API_BASE}/api/allergies`);
      const response = await fetch(`${API_BASE}/api/allergies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setFormData({
            allergies: result.data.allergies || [],
            dietaryRestrictions: result.data.dietaryRestrictions || [],
            additionalNotes: result.data.additionalNotes || ''
          });
        }
      } else if (response.status === 404) {
        // No allergy record found, this is normal for first-time users
        console.log('No allergy record found, using default empty state');
      } else {
        console.error('Failed to fetch allergies:', response.status, response.statusText);
        toast.error('Failed to load allergy information');
      }
    } catch (error) {
      console.error('Error fetching allergies:', error);
      toast.error('Failed to load allergy information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      console.log('💾 Saving allergies to:', `${API_BASE}/api/allergies`, formData);
      const response = await fetch(`${API_BASE}/api/allergies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Allergies updated successfully');
        // Refresh the data to show updated info
        await fetchAllergies();
      } else {
        const errorData = await response.text();
        let errorMessage = 'Failed to update allergies';
        try {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.message || errorMessage;
        } catch (e) {
          console.error('Error parsing response:', errorData);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving allergies:', error);
      toast.error('Failed to save allergy information');
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.name.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, { ...newAllergy, name: newAllergy.name.trim() }]
      }));
      setNewAllergy({ name: '', severity: 'mild' });
    }
  };

  const removeAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const toggleDietaryRestriction = (restriction) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-foreground font-inter text-lg">Loading allergies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <div className="p-4 lg:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customer/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <div className="text-center mb-8">
              <FaExclamationTriangle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-montserrat font-bold text-foreground mb-2">
                Allergy Information
              </h1>
              <p className="text-muted-foreground font-inter">
                Help us understand your dietary needs and allergies for better meal recommendations
              </p>
            </div>

            {/* Allergies Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaExclamationTriangle className="w-5 h-5 text-primary" />
                  Food Allergies
                </CardTitle>
                <CardDescription>
                  Add specific foods or ingredients that cause allergic reactions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Allergy */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter allergy (e.g., peanuts, dairy)"
                    value={newAllergy.name}
                    onChange={(e) => setNewAllergy(prev => ({ ...prev, name: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                  />
                  <Select
                    value={newAllergy.severity}
                    onValueChange={(value) => setNewAllergy(prev => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addAllergy} disabled={!newAllergy.name.trim()}>
                    <FaPlus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Current Allergies */}
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergy, index) => (
                    <Badge
                      key={index}
                      variant={allergy.severity === 'severe' ? 'destructive' : 'secondary'}
                      className="flex items-center gap-2 px-3 py-1"
                    >
                      <span>{allergy.name}</span>
                      <span className="text-xs opacity-70">({allergy.severity})</span>
                      <button
                        onClick={() => removeAllergy(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {formData.allergies.length === 0 && (
                  <p className="text-muted-foreground text-sm">No allergies added yet</p>
                )}
              </CardContent>
            </Card>

            {/* Dietary Restrictions Section */}
            <Card>
              <CardHeader>
                <CardTitle>Dietary Restrictions</CardTitle>
                <CardDescription>
                  Select any dietary preferences or restrictions you follow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dietaryOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={formData.dietaryRestrictions.includes(option)}
                        onCheckedChange={() => toggleDietaryRestriction(option)}
                      />
                      <Label htmlFor={option} className="text-sm capitalize cursor-pointer">
                        {option.replace('-', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
                <CardDescription>
                  Any other dietary information or special requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter any additional dietary information, cross-contamination concerns, or special requirements..."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.additionalNotes.length}/500 characters
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                <FaSave className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Allergy Information'}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAllergies;