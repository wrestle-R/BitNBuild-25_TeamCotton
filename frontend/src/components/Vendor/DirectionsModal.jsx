import React from 'react';
import { motion } from 'framer-motion';
import { FaDirections, FaRoute, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import { MdDirections } from 'react-icons/md';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useTheme } from '../../../context/ThemeContext';

const DirectionsModal = ({ 
  isOpen, 
  onClose, 
  directionsData, 
  onOpenInMaps 
}) => {
  const { isDark } = useTheme();

  if (!isOpen || !directionsData) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        <Card className={`${isDark ? 'bg-card/95 backdrop-blur-sm border-border/50' : 'bg-card/90 backdrop-blur-sm border-border'} shadow-2xl`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MdDirections className="w-6 h-6 text-blue-600" />
                <span>Turn-by-Turn Directions</span>
              </div>
              <Button
                variant="ghost" 
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <FaTimes className="w-4 h-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Route from {directionsData.from} to {directionsData.to}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Route Summary */}
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-400/20' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <FaRoute className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">Route Summary</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Distance</p>
                      <p className="font-semibold text-lg">{directionsData.distance}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated Time</p>
                      <p className="font-semibold text-lg">{directionsData.duration}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200/50">
                    <p className="text-sm text-muted-foreground">
                      Total Steps: <span className="font-medium">{directionsData.steps.length}</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={onOpenInMaps}
                    className="flex-1 gap-2"
                    variant="default"
                  >
                    <FaMapMarkerAlt className="w-4 h-4" />
                    Open in Google Maps
                  </Button>
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Route: ${directionsData.from} → ${directionsData.to}\nDistance: ${directionsData.distance}\nTime: ${directionsData.duration}`
                      );
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    📋 Copy Info
                  </Button>
                </div>
              </div>

              {/* Step-by-Step Directions */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FaDirections className="w-4 h-4" />
                  Step-by-Step Directions
                </h4>
                <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                  {directionsData.steps.map((step, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-md text-sm border ${isDark ? 'bg-muted/20 border-border/30' : 'bg-muted/50 border-border/50'} hover:bg-muted/30 transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="min-w-[28px] h-6 flex items-center justify-center font-mono text-xs">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground capitalize">
                            {step.maneuver?.type || 'continue'} {step.maneuver?.modifier ? `(${step.maneuver.modifier})` : ''}
                          </p>
                          <p className="text-muted-foreground text-xs mt-1 break-words">
                            {step.name || 'Unnamed road'}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-medium text-primary">
                              {(step.distance / 1000).toFixed(2)} km
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ~{Math.round(step.duration / 60)} min
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default DirectionsModal;