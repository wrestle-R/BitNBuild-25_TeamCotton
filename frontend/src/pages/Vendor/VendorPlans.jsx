import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../context/UserContextSimplified';
import { auth } from '../../../firebase.config';
import { FaClipboardList, FaPlus, FaEdit, FaTrash, FaCalendarDay, FaCalendarWeek, FaCalendar, FaArrowLeft, FaUtensils, FaClock, FaRupeeSign } from 'react-icons/fa';
import VendorSidebar from '../../components/Vendor/VendorSidebar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

const VendorPlans = () => {
  const { user } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [plans, setPlans] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planMenusDialogOpen, setPlanMenusDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planMenus, setPlanMenus] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const navigate = useNavigate();

const [formData, setFormData] = useState({
  name: '',
  price: '',
  duration_days: '',
  meals_per_day: 1,
  selectedMeals: [], // New: array of selected meal types
  planMenus: {}
});

  const planTypeIcons = {
    'One day': FaCalendarDay,
    'All week': FaCalendarWeek,
    'All month': FaCalendar
  };

  const getMealOptions = () => [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' }
  ];

  useEffect(() => {
    if (user && auth.currentUser) {
      fetchPlans();
      fetchMenus();
    }
  }, [user]);

  // Also add error handling to your fetch functions:
  const fetchPlans = async () => {
    try {
      if (!auth.currentUser) {
        console.log('No authenticated user');
        return;
      }
      
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/plans`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Plans data:', data);
        setPlans(data);
      } else {
        console.error('Failed to fetch plans:', response.status);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const fetchPlanMenus = async (planId) => {
    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/plans/${planId}/menus`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlanMenus(data);
      }
    } catch (error) {
      console.error('Error fetching plan menus:', error);
      toast.error('Failed to load plan menus');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.duration_days || formData.selectedMeals.length === 0) {
      toast.error('Please fill all required fields and select at least one meal');
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const url = editingPlan 
        ? `${import.meta.env.VITE_BACKEND_URL}/api/vendor/plans/${editingPlan._id}`
        : `${import.meta.env.VITE_BACKEND_URL}/api/vendor/plans`;

      const response = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          duration_days: parseInt(formData.duration_days),
          meals_per_day: formData.selectedMeals.length,
          selected_meals: formData.selectedMeals // Send selected meals to backend
        })
      });

      if (response.ok) {
        toast.success(editingPlan ? 'Plan updated successfully!' : 'Plan created successfully!');
        setDialogOpen(false);
        resetForm();
        fetchPlans();
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    }
  };

const handleDelete = async (planId) => {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/vendor/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      }
    });

    if (response.ok) {
      toast.success('Plan deleted successfully!');
      fetchPlans();
    }
  } catch (error) {
    console.error('Error deleting plan:', error);
    toast.error('Failed to delete plan');
  }
};

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      duration_days: '',
      meals_per_day: 1,
      selectedMeals: [],
      planMenus: {}
    });
    setEditingPlan(null);
  };

  const startEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price.toString(),
      duration_days: plan.duration_days.toString(),
      meals_per_day: plan.meals_per_day,
      selectedMeals: plan.selected_meals || [], // Load selected meals from plan
      planMenus: {}
    });
    setDialogOpen(true);
  };

  const handleViewPlanMenus = (plan) => {
    setSelectedPlan(plan);
    fetchPlanMenus(plan._id);
    setPlanMenusDialogOpen(true);
  };

  const getPlanTypeColor = (planType) => {
    switch (planType) {
      case 'One day': return 'bg-blue-500';
      case 'All week': return 'bg-green-500';
      case 'All month': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDurationText = (days, planName) => {
    switch (planName) {
      case 'One day': return '1 Day';
      case 'All week': return '1 Week';
      case 'All month': return '1 Month';
      default: return `${days} Days`;
    }
  };

const safePrice = (plan) => {
  if (!plan || !plan.price) return 0;
  if (typeof plan.price === 'object' && plan.price.$numberDecimal) {
    return parseFloat(plan.price.$numberDecimal);
  }
  return typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
};

  const handleMealSelection = (mealType, isSelected) => {
    setFormData(prev => {
      const newSelectedMeals = isSelected 
        ? [...prev.selectedMeals, mealType]
        : prev.selectedMeals.filter(m => m !== mealType);
    
      return {
        ...prev,
        selectedMeals: newSelectedMeals,
        meals_per_day: newSelectedMeals.length
      };
    });
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
      <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

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
                onClick={() => navigate('/vendor/dashboard')}
                className="flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
                  <FaClipboardList className="w-10 h-10 text-primary" />
                  Subscription Plans
                </h1>
                <p className="text-muted-foreground font-inter mt-2">
                  Create and manage daily, weekly, and monthly meal subscription plans
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <FaPlus className="w-4 h-4 mr-2" />
                    Add Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
                    <DialogDescription>
                      Set up a subscription plan for your customers
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Plan Type */}
                    <div className="space-y-2">
                      <Label htmlFor="plan-type">Plan Type</Label>
                      <Select 
                        value={formData.name} 
                        onValueChange={(value) => {
                          setFormData(prev => ({ 
                            ...prev, 
                            name: value,
                            duration_days: value === 'One day' ? '1' : value === 'All week' ? '7' : '30'
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="One day">One Day Plan</SelectItem>
                          <SelectItem value="All week">All Week Plan</SelectItem>
                          <SelectItem value="All month">All Month Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Enter price"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Meal Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Select Meals</Label>
                      <div className="space-y-2">
                        {getMealOptions().map((meal) => (
                          <div key={meal.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={meal.value}
                              checked={formData.selectedMeals.includes(meal.value)}
                              onChange={(e) => handleMealSelection(meal.value, e.target.checked)}
                              className="rounded"
                            />
                            <Label htmlFor={meal.value} className="text-sm font-normal cursor-pointer">
                              {meal.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {formData.selectedMeals.length === 0 && (
                        <p className="text-xs text-muted-foreground">Select at least one meal type</p>
                      )}
                    </div>

                    {/* Menu Assignment Section - Updated */}
                    {formData.duration_days && formData.selectedMeals.length > 0 && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center gap-2">
                          <FaUtensils className="w-4 h-4 text-primary" />
                          <h4 className="font-semibold text-base">Assign Menus</h4>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-4">
                          {Array.from({ length: parseInt(formData.duration_days) }, (_, dayIndex) => (
                            <div key={dayIndex} className="p-3 bg-muted/50 rounded-lg">
                              <p className="font-medium mb-3 text-sm">Day {dayIndex + 1}</p>
                              <div className="grid grid-cols-1 gap-3">
                                {formData.selectedMeals.map((mealType, mealIndex) => (
                                  <div key={mealType} className="space-y-1">
                                    <Label className="text-xs font-medium capitalize">{mealType}</Label>
                                    <Select
                                      value={formData.planMenus?.[`${dayIndex + 1}-${mealType}`] || ''}
                                      onValueChange={menuId =>
                                        setFormData(prev => ({
                                          ...prev,
                                          planMenus: {
                                            ...prev.planMenus,
                                            [`${dayIndex + 1}-${mealType}`]: menuId
                                          }
                                        }))
                                      }
                                    >
                                      <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select menu" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {menus.filter(menu => menu.meal_type === mealType).map(menu => (
                                          <TooltipProvider key={menu._id}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <SelectItem value={menu._id} className="cursor-pointer">
                                                  <div className="flex items-center justify-between w-full">
                                                    <span className="font-medium capitalize">{menu.meal_type}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                      ({menu.items?.length || 0} items)
                                                    </span>
                                                  </div>
                                                </SelectItem>
                                              </TooltipTrigger>
                                              <TooltipContent side="right" className="max-w-xs">
                                                <div className="space-y-2">
                                                  <p className="font-semibold text-xs mb-2">Menu Items:</p>
                                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                                    {menu.items?.map((item, idx) => (
                                                      <div key={idx} className="flex items-center gap-2">
                                                        {item.image_url && (
                                                          <img 
                                                            src={item.image_url} 
                                                            alt={item.name} 
                                                            className="w-6 h-6 object-cover rounded" 
                                                          />
                                                        )}
                                                        <span className="text-xs">{item.name}</span>
                                                      </div>
                                                    ))}
                                                    {(!menu.items || menu.items.length === 0) && (
                                                      <p className="text-xs text-muted-foreground">No items added yet</p>
                                                    )}
                                                  </div>
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button onClick={handleSubmit} className="flex-1">
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                      </Button>
                      <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Plans Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AnimatePresence>
              {plans.map((plan) => {
                const IconComponent = planTypeIcons[plan.name];
                return (
                  <motion.div
                    key={plan._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg relative overflow-hidden">
                      {/* Plan Type Indicator */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${getPlanTypeColor(plan.name)}`}></div>
                      
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-bold flex items-center gap-2">
                            {IconComponent && <IconComponent className="w-6 h-6 text-primary" />}
                            {plan.name} Plan
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPlanMenus(plan)}
                              title="View Menus"
                            >
                              <FaUtensils className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(plan)}
                            >
                              <FaEdit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPlanToDelete(plan._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <FaTrash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <FaRupeeSign className="w-3 h-3" />
                            ₹{safePrice(plan)}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            {getDurationText(plan.duration_days, plan.name)}
                          </Badge>
                          <Badge variant="outline">
                            {plan.selected_meals?.join(', ') || `${plan.meals_per_day} meal${plan.meals_per_day > 1 ? 's' : ''}/day`}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="text-center p-4 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold text-primary">₹{safePrice(plan)}</p>
                            <p className="text-sm text-muted-foreground">
                              for {getDurationText(plan.duration_days)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ₹{(safePrice(plan) / plan.duration_days).toFixed(2)} per day
                            </p>
                            <p className="text-sm text-muted-foreground">₹{safePrice(selectedPlan)}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-center p-2 bg-muted/30 rounded">
                              <p className="font-semibold">{plan.duration_days}</p>
                              <p className="text-muted-foreground">Days</p>
                            </div>
                            <div className="text-center p-2 bg-muted/30 rounded">
                              <p className="font-semibold">{plan.meals_per_day}</p>
                              <p className="text-muted-foreground">Meals/Day</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {plans.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <FaClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No plans yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first subscription plan to start offering meal packages
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <FaPlus className="w-4 h-4 mr-2" />
                Create Your First Plan
              </Button>
            </motion.div>
          )}

          {/* Plan Menus Dialog */}
          <Dialog open={planMenusDialogOpen} onOpenChange={setPlanMenusDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto flex flex-col justify-center items-center">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FaUtensils className="w-5 h-5" />
                  {selectedPlan?.name} Plan - Menu Schedule
                </DialogTitle>
                <DialogDescription>
                  Manage the menu schedule for this subscription plan
                </DialogDescription>
              </DialogHeader>
              
              {selectedPlan && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold">Duration</p>
                      <p className="text-sm text-muted-foreground">{getDurationText(selectedPlan.duration_days)}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold">Price</p>
                      <p className="text-sm text-muted-foreground">₹{safePrice(selectedPlan)}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold">Meals/Day</p>
                      <p className="text-sm text-muted-foreground">{selectedPlan.meals_per_day}</p>
                    </div>
                  </div>

                  <Tabs defaultValue="schedule" className="w-full">
                    <TabsList className="grid w-full grid-cols-1">
                      <TabsTrigger value="schedule">Menu Schedule</TabsTrigger>
                    </TabsList>
                    <TabsContent value="schedule" className="space-y-4">
                      {selectedPlan.duration_days <= 7 ? (
                        <div className="space-y-4">
                          {Array.from({ length: selectedPlan.duration_days }, (_, dayIndex) => (
                            <Card key={dayIndex} className="p-4">
                              <h4 className="font-semibold mb-3">Day {dayIndex + 1}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {selectedPlan.selected_meals?.map((mealType, mealIndex) => {
                                  const assignedMenu = planMenus.find(
                                    pm => pm.day_number === dayIndex + 1 && pm.meal_number === mealIndex + 1
                                  );
                                  return (
                                    <div key={mealType} className="p-3 border border-border rounded-lg">
                                      <h5 className="font-medium text-sm mb-2 capitalize">
                                        {mealType}
                                      </h5>
                                      {assignedMenu ? (
                                        <div className="text-xs">
                                          <p className="font-medium">{assignedMenu.menu?.meal_type}</p>
                                          <p className="text-muted-foreground">
                                            {assignedMenu.menu?.items?.length || 0} items
                                          </p>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-muted-foreground">No menu assigned</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            Menu management for monthly plans will be available soon.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Plan Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this plan? All associated menus will also be removed. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleDelete(planToDelete);
                    setDeleteDialogOpen(false);
                  }}
                  className="bg-destructive text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default VendorPlans;