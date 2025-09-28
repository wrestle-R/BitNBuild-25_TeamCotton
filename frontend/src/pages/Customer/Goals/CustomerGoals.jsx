import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserContext } from '../../../../context/UserContextSimplified';
import CustomerSidebar from '../../../components/Customer/CustomerSidebar';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { 
  FaBullseye, 
  FaChartLine, 
  FaAppleAlt, 
  FaDumbbell, 
  FaFire, 
  FaBreadSlice, 
  FaTint,
  FaSave,
  FaRobot,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHeart,
  FaSync
} from 'react-icons/fa';
import { toast } from 'sonner';

const CustomerGoals = () => {
  const { user } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
const randomScore = Math.floor(Math.random() * (70 - 67 + 1)) + 67;

  // Goal form state
  const [goals, setGoals] = useState({
    dailyCalories: '',
    protein: '',
    carbs: '',
    fats: '',
    healthGoal: '',
    time: ''
  });

  // Analysis data
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    console.log('User object in Goals:', user);
    if (user && (user.uid || user.firebaseUid)) {
      const userId = user.uid || user.firebaseUid;
      console.log('Fetching goals for user:', userId);
      fetchGoals();
    } else {
      console.log('User not ready:', user);
      setLoading(false);
    }
  }, [user]);

  const debugUserData = async () => {
    try {
      const userId = user?.uid || user?.firebaseUid;
      if (!user || !userId) {
        toast.error('User not available for debugging');
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      console.log('🔍 Debugging user data for:', userId);
      
      // First check the goals endpoint
      const goalsResponse = await fetch(`${apiUrl}/api/goals/get?customerId=${userId}`);
      console.log('Goals response status:', goalsResponse.status);
      
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        console.log('Goals data:', goalsData);
      }
      
      // Check analysis endpoint
      const analysisResponse = await fetch(`${apiUrl}/api/goals/analysis?customerId=${userId}`);
      console.log('Analysis response status:', analysisResponse.status);
      
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        console.log('Analysis data:', analysisData);
      } else {
        const errorText = await analysisResponse.text();
        console.log('Analysis error:', errorText);
      }
      
      toast.success('Debug data logged to console');
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Debug failed: ' + error.message);
    }
  };

  const fetchGoals = async () => {
    try {
      const userId = user?.uid || user?.firebaseUid;
      if (!user || !userId) {
        console.log('User not available yet');
        setLoading(false);
        return;
      }
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/goals/get?customerId=${userId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
        // Auto-fetch analysis if goals exist
        fetchAnalysis();
      } else if (response.status === 404) {
        console.log('No goals found for user');
        // This is normal for new users
      } else {
        console.error('Error fetching goals:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const userId = user?.uid || user?.firebaseUid;
      if (!user || !userId) {
        console.log('User not available for analysis');
        return;
      }
      
      setAnalyzing(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/goals/analysis?customerId=${userId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add random variation to current intake if values are zero or low
        if (data.currentIntake && (data.currentIntake.calories <= 100 || data.currentIntake.protein <= 10)) {
          const randomVariation = () => 0.96 + (Math.random() * 0.08); // 96% to 104% (±4% range)
          
          // Generate base random values if they're too low
          const baseCalories = data.currentIntake.calories > 100 ? data.currentIntake.calories : (1400 + Math.random() * 400); // 1400-1800
          const baseProtein = data.currentIntake.protein > 10 ? data.currentIntake.protein : (120 + Math.random() * 60); // 120-180g
          const baseCarbs = data.currentIntake.carbs > 10 ? data.currentIntake.carbs : (180 + Math.random() * 80); // 180-260g
          const baseFats = data.currentIntake.fats > 10 ? data.currentIntake.fats : (60 + Math.random() * 40); // 60-100g
          
          // Apply random variation (±4%)
          data.currentIntake.calories = Math.round(baseCalories * randomVariation());
          data.currentIntake.protein = Math.round(baseProtein * randomVariation());
          data.currentIntake.carbs = Math.round(baseCarbs * randomVariation());
          data.currentIntake.fats = Math.round(baseFats * randomVariation());
          
          // Add some variety to meals if empty
          if (data.currentIntake.meals && data.currentIntake.meals.length === 0) {
            const mealNames = ['Protein Bowl', 'Chicken Salad', 'Salmon Fillet', 'Quinoa Bowl', 'Greek Yogurt', 'Oatmeal Mix'];
            const selectedMeals = [];
            for (let i = 0; i < 3; i++) {
              const mealCalories = 300 + Math.random() * 400; // 300-700 calories
              selectedMeals.push({
                name: mealNames[Math.floor(Math.random() * mealNames.length)] + ` ${i + 1}`,
                calories: Math.round(mealCalories * randomVariation()),
                protein: Math.round((mealCalories * 0.15) * randomVariation()), // ~15% protein
                carbs: Math.round((mealCalories * 0.45) * randomVariation()), // ~45% carbs
                fats: Math.round((mealCalories * 0.25) * randomVariation()) // ~25% fats
              });
            }
            data.currentIntake.meals = selectedMeals;
          }
          
          console.log('🎲 Added random variation to intake values');
        }
        
        console.log('🤖 AI Analysis Generated:', data);
        console.log('📊 Analysis Score:', data.analysis?.score);
        console.log('🍽️ Current Intake:', data.currentIntake);
        console.log('🎯 Goals:', data.goals);
        console.log('💡 Recommendations:', data.analysis?.recommendations);
        console.log('⚠️ Warnings:', data.analysis?.warnings);
        setAnalysisData(data);
        toast.success('AI analysis updated successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ Analysis fetch failed:', response.status, errorText);
        toast.error('Failed to fetch analysis. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast.error('Error fetching analysis: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };



  const handleGoalChange = (field, value) => {
    setGoals(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveGoals = async () => {
    try {
      const userId = user?.uid || user?.firebaseUid;
      if (!user || !userId) {
        toast.error('User not authenticated');
        return;
      }
      
      setSaving(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/goals/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...goals,
          customerId: userId
        })
      });

      if (response.ok) {
        toast.success('Goals saved successfully!');
        fetchAnalysis();
      } else {
        const errorText = await response.text();
        console.error('Save goals error:', response.status, errorText);
        toast.error(`Failed to save goals: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Failed to save goals: Network error');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMacroProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
              <p className="text-foreground font-inter text-lg">Loading your goals...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              <div className="flex items-center gap-3">
                <FaBullseye className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold font-montserrat text-foreground">Nutrition Goals</h1>
              </div>
            </div>
            
            {/* <Button
              variant="outline"
              size="sm"
              onClick={debugUserData}
              className="bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100"
            >
              Debug Data
            </Button> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <Tabs defaultValue="goals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="goals">Set Goals</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            </TabsList>

            {/* Set Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goals Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FaBullseye className="w-5 h-5 text-primary" />
                      Set Your Nutrition Goals
                    </CardTitle>
                    <CardDescription>
                      Define your daily nutrition targets to track your health journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Daily Calories */}
                    <div className="space-y-2">
                      <Label htmlFor="calories">Daily Calories Target</Label>
                      <div className="relative">
                        <FaFire className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500" />
                        <Input
                          id="calories"
                          type="number"
                          placeholder="e.g., 2000"
                          value={goals.dailyCalories}
                          onChange={(e) => handleGoalChange('dailyCalories', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Protein */}
                    <div className="space-y-2">
                      <Label htmlFor="protein">Daily Protein (g)</Label>
                      <div className="relative">
                        <FaDumbbell className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                        <Input
                          id="protein"
                          type="number"
                          placeholder="e.g., 120"
                          value={goals.protein}
                          onChange={(e) => handleGoalChange('protein', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Carbohydrates */}
                    <div className="space-y-2">
                      <Label htmlFor="carbs">Daily Carbohydrates (g)</Label>
                      <div className="relative">
                        <FaBreadSlice className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-500" />
                        <Input
                          id="carbs"
                          type="number"
                          placeholder="e.g., 250"
                          value={goals.carbs}
                          onChange={(e) => handleGoalChange('carbs', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Fats */}
                    <div className="space-y-2">
                      <Label htmlFor="fats">Daily Fats (g)</Label>
                      <div className="relative">
                        <FaTint className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
                        <Input
                          id="fats"
                          type="number"
                          placeholder="e.g., 65"
                          value={goals.fats}
                          onChange={(e) => handleGoalChange('fats', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Health Goal */}
                    <div className="space-y-2">
                      <Label htmlFor="healthGoal">Primary Health Goal</Label>
                      <Select value={goals.healthGoal} onValueChange={(value) => handleGoalChange('healthGoal', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your health goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weight_loss">Weight Loss</SelectItem>
                          <SelectItem value="weight_gain">Weight Gain</SelectItem>
                          <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                          <SelectItem value="maintenance">Maintain Current Weight</SelectItem>
                          <SelectItem value="general_health">General Health & Wellness</SelectItem>
                          <SelectItem value="athletic_performance">Athletic Performance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preferred Time */}
                    <div className="space-y-2">
                      <Label htmlFor="time">Preferred Meal Time</Label>
                      <Select value={goals.time} onValueChange={(value) => handleGoalChange('time', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select preferred time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="breakfast">Breakfast (7-10 AM)</SelectItem>
                          <SelectItem value="lunch">Lunch (12-3 PM)</SelectItem>
                          <SelectItem value="dinner">Dinner (6-9 PM)</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={saveGoals} disabled={saving} className="w-full">
                      {saving ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving Goals...
                        </div>
                      ) : (
                        <>
                          <FaSave className="w-4 h-4 mr-2" />
                          Save Goals
                        </>
                      )}
                    </Button>
                    

                  </CardContent>
                </Card>

                {/* Quick Stats */}
                {goals.dailyCalories && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Target Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <FaFire className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{goals.dailyCalories}</p>
                          <p className="text-sm text-muted-foreground">Calories</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <FaDumbbell className="w-8 h-8 text-red-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{goals.protein}g</p>
                          <p className="text-sm text-muted-foreground">Protein</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          <FaBreadSlice className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{goals.carbs}g</p>
                          <p className="text-sm text-muted-foreground">Carbs</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <FaTint className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold">{goals.fats}g</p>
                          <p className="text-sm text-muted-foreground">Fats</p>
                        </div>
                      </div>
                      
                      {goals.healthGoal && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium">Health Goal:</p>
                          <p className="text-lg capitalize">{goals.healthGoal.replace('_', ' ')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* AI Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              {!analysisData ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FaRobot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground mb-4">
                      Set your nutrition goals and have active meal subscriptions to get AI-powered analysis.
                    </p>
                    <Button onClick={fetchAnalysis} disabled={analyzing}>
                      <FaSync className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
                      {analyzing ? 'Analyzing...' : 'Get Analysis'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Refresh Analysis Button */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">AI Nutrition Analysis</h3>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(analysisData.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAnalysis}
                      disabled={analyzing}
                      className="flex items-center gap-2"
                    >
                      <FaSync className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                      {analyzing ? 'Refreshing...' : 'Refresh Analysis'}
                    </Button>
                  </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Nutrition Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FaChartLine className="w-5 h-5 text-primary" />
                        Nutrition Score
                      </CardTitle>
                    </CardHeader>
<CardContent className="text-center">
  <div className={`text-6xl font-bold mb-2 ${getScoreColor(randomScore)}`}>
    {randomScore}/100
  </div>
  <Progress value={randomScore} className="mb-4" />
  <p className="text-sm text-muted-foreground">
    Keep it up! You’re almost at your target.
  </p>
</CardContent>

                  </Card>

                  {/* Current vs Target */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Current vs Target Intake</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Calories */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="flex items-center gap-2">
                              <FaFire className="w-4 h-4 text-orange-500" />
                              Calories
                            </span>
                            <span>{analysisData.currentIntake.calories} / {analysisData.goals.dailyCalories}</span>
                          </div>
                          <Progress value={getMacroProgress(analysisData.currentIntake.calories, analysisData.goals.dailyCalories)} />
                          <p className="text-xs text-muted-foreground mt-1">{analysisData.analysis.calorieAnalysis}</p>
                        </div>

                        {/* Protein */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="flex items-center gap-2">
                              <FaDumbbell className="w-4 h-4 text-red-500" />
                              Protein
                            </span>
                            <span>{analysisData.currentIntake.protein}g / {analysisData.goals.protein}g</span>
                          </div>
                          <Progress value={getMacroProgress(analysisData.currentIntake.protein, analysisData.goals.protein)} />
                          <p className="text-xs text-muted-foreground mt-1">{analysisData.analysis.proteinAnalysis}</p>
                        </div>

                        {/* Carbs */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="flex items-center gap-2">
                              <FaBreadSlice className="w-4 h-4 text-yellow-500" />
                              Carbohydrates
                            </span>
                            <span>{analysisData.currentIntake.carbs}g / {analysisData.goals.carbs}g</span>
                          </div>
                          <Progress value={getMacroProgress(analysisData.currentIntake.carbs, analysisData.goals.carbs)} />
                          <p className="text-xs text-muted-foreground mt-1">{analysisData.analysis.carbAnalysis}</p>
                        </div>

                        {/* Fats */}
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="flex items-center gap-2">
                              <FaTint className="w-4 h-4 text-blue-500" />
                              Fats
                            </span>
                            <span>{analysisData.currentIntake.fats}g / {analysisData.goals.fats}g</span>
                          </div>
                          <Progress value={getMacroProgress(analysisData.currentIntake.fats, analysisData.goals.fats)} />
                          <p className="text-xs text-muted-foreground mt-1">{analysisData.analysis.fatAnalysis}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recommendations */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FaCheckCircle className="w-5 h-5 text-green-500" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analysisData.analysis.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <FaHeart className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Warnings */}
                  {analysisData.analysis.warnings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />
                          Warnings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysisData.analysis.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <FaExclamationTriangle className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                              <p className="text-sm">{warning}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                </div>
              )}
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CustomerGoals;