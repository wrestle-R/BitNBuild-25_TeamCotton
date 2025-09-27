import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserContext } from '../../../context/UserContextSimplified';
import { FaStore, FaSearch, FaFilter, FaHeart, FaShoppingCart, FaStar } from 'react-icons/fa';
import CustomerSidebar from '../../components/Customer/CustomerSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { toast } from 'sonner';

const CustomerMarket = () => {
  const { user } = useUserContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPreference, setFilterPreference] = useState('all');

  useEffect(() => {
    // Simulate loading vendors - replace with actual API call
    setTimeout(() => {
      setVendors([
        {
          id: 1,
          name: "Green Garden Kitchen",
          profileImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=150",
          rating: 4.8,
          specialty: "veg",
          address: { city: "Mumbai", state: "Maharashtra" },
          plans: 12,
          description: "Fresh organic vegetarian meals"
        },
        {
          id: 2,
          name: "Spice Route Delights",
          profileImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=150",
          rating: 4.6,
          specialty: "nonveg",
          address: { city: "Delhi", state: "Delhi" },
          plans: 8,
          description: "Authentic Indian cuisine with meat options"
        },
        {
          id: 3,
          name: "Healthy Bites Co.",
          profileImage: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=150",
          rating: 4.7,
          specialty: "veg",
          address: { city: "Bangalore", state: "Karnataka" },
          plans: 15,
          description: "Nutritious and balanced vegetarian meals"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPreference = filterPreference === 'all' || vendor.specialty === filterPreference;
    return matchesSearch && matchesPreference;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <CustomerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <div className="p-6">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-foreground font-montserrat flex items-center gap-3">
              <FaStore className="w-10 h-10 text-primary" />
              Market
            </h1>
            <p className="text-muted-foreground font-inter mt-2">
              Discover vendors and explore meal plans
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search vendors or cuisines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Filter */}
                  <div className="w-full md:w-48">
                    <Select value={filterPreference} onValueChange={setFilterPreference}>
                      <SelectTrigger>
                        <FaFilter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        <SelectItem value="veg">Vegetarian Only</SelectItem>
                        <SelectItem value="nonveg">Non-Vegetarian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Vendors Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {filteredVendors.map((vendor, index) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="bg-card/80 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={vendor.profileImage} alt={vendor.name} />
                          <AvatarFallback>
                            <FaStore />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-montserrat">{vendor.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <FaStar className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{vendor.rating}</span>
                            </div>
                            <Badge variant={vendor.specialty === 'veg' ? 'default' : 'destructive'} className="text-xs">
                              {vendor.specialty === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <FaHeart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-3">{vendor.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>{vendor.address.city}, {vendor.address.state}</span>
                      <span>{vendor.plans} meal plans</span>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <FaShoppingCart className="w-4 h-4 mr-2" />
                        View Plans
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* No Results */}
          {filteredVendors.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <FaStore className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No vendors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filters to find vendors.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerMarket;