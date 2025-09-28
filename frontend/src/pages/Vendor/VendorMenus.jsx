import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaUtensils, FaPlus, FaEdit, FaTrash, FaImage, FaArrowLeft } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const VendorMenus = () => {
  const { user, vendorProfile } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    meal_type: '',
    non_veg: false,
    items: [{ name: '', image_url: '', description: '' }]
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/menus`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMenus(data);
      }
    } catch (error) {
      console.error('Error fetching menus:', error);
      toast.error('Failed to load menus');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, itemIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const idToken = await auth.currentUser.getIdToken();
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();
      if (data.success) {
        const newItems = [...formData.items];
        newItems[itemIndex].image_url = data.data.url;
        setFormData(prev => ({ ...prev, items: newItems }));
        toast.success('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.meal_type || formData.items.some(item => !item.name.trim())) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const url = editingMenu 
        ? `${import.meta.env.VITE_BACKEND_URL}/api/vendor/menus/${editingMenu._id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/vendor/menus`;

      const response = await fetch(url, {
        method: editingMenu ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingMenu ? 'Menu updated successfully!' : 'Menu created successfully!');
        setDialogOpen(false);
        resetForm();
        fetchMenus();
      }
    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error('Failed to save menu');
    }
  };

  const handleDelete = async (menuId) => {
    if (!confirm('Are you sure you want to delete this menu?')) return;

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/menus/${menuId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        }
      });

      if (response.ok) {
        toast.success('Menu deleted successfully!');
        fetchMenus();
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
      toast.error('Failed to delete menu');
    }
  };

  const resetForm = () => {
    setFormData({
      meal_type: '',
      non_veg: false,
      items: [{ name: '', image_url: '', description: '' }]
    });
    setEditingMenu(null);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', image_url: '', description: '' }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const startEdit = (menu) => {
    setEditingMenu(menu);
    setFormData({
      meal_type: menu.meal_type,
      non_veg: menu.non_veg,
      items: menu.items.length > 0 ? menu.items : [{ name: '', image_url: '', description: '' }]
    });
    setDialogOpen(true);
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
      <VendorSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        profileImage={vendorProfile?.profileImage}
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
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor/dashboard')}
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button> */}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
                  {/* <FaUtensils className="w-10 h-10 text-primary" /> */}
                  Menu Management
                </h1>
                <p className="text-muted-foreground font-inter mt-2">
                  Create and manage your menu items for different meal types
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Menu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingMenu ? 'Edit Menu' : 'Create New Menu'}</DialogTitle>
                    <DialogDescription>
                      Add menu items for a specific meal type
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Meal Type */}
                    <div className="space-y-2">
                      <Label>Meal Type</Label>
                      <Select value={formData.meal_type} onValueChange={(value) => setFormData(prev => ({ ...prev, meal_type: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select meal type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast</SelectItem>
                          <SelectItem value="lunch">Lunch</SelectItem>
                          <SelectItem value="dinner">Dinner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Non-Veg Toggle */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="nonveg"
                        checked={formData.non_veg}
                        onChange={(e) => setFormData(prev => ({ ...prev, non_veg: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="nonveg">Non-Vegetarian Menu</Label>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">Menu Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                          <FaPlus className="w-3 h-3 mr-1" />
                          Add Item
                        </Button>
                      </div>

                      {formData.items.map((item, index) => (
                        <Card key={index} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">Item {index + 1}</Label>
                              {formData.items.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-destructive"
                                >
                                  <FaTrash className="w-3 h-3" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor={`name-${index}`}>Item Name *</Label>
                                <Input
                                  id={`name-${index}`}
                                  value={item.name}
                                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                                  placeholder="Enter item name"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`image-${index}`}>Item Image</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, index)}
                                    className="flex-1"
                                  />
                                  {item.image_url && (
                                    <img
                                      src={item.image_url}
                                      alt={item.name}
                                      className="w-10 h-10 object-cover rounded border"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label htmlFor={`desc-${index}`}>Description</Label>
                              <Input
                                id={`desc-${index}`}
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                placeholder="Enter item description"
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSubmit} className="flex-1">
                        {editingMenu ? 'Update Menu' : 'Create Menu'}
                      </Button>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Menu Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnimatePresence>
              {menus.map((menu) => (
                <motion.div
                  key={menu._id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold capitalize">
                          {menu.meal_type}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit(menu)}
                          >
                            <FaEdit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(menu._id)}
                            className="text-destructive"
                          >
                            <FaTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={menu.non_veg ? "destructive" : "secondary"}>
                          {menu.non_veg ? "Non-Veg" : "Veg"}
                        </Badge>
                        <Badge variant="outline">
                          {menu.items.length} items
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {menu.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-10 h-10 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                                <FaImage className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {menu.items.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{menu.items.length - 3} more items
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {menus.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaUtensils className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No menus yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first menu to start offering food to customers
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <FaPlus className="w-4 h-4 mr-2" />
                Create Your First Menu
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorMenus;