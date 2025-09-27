import React from 'react'
import { AnimatedText } from "@/components/ui/animated-underline-text-one";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { FaStore, FaShoppingBasket } from 'react-icons/fa';

const ContactSection = () => {
  const navigate = useNavigate();

  const handleVendorAuth = () => {
    navigate('/vendor/auth');
  };

  const handleCustomerAuth = () => {
    navigate('/customer/auth');
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 pb-20">
      <AnimatedText
        text="Join NourishNet Today!"
        textClassName="text-5xl font-bold mb-2"
        underlinePath="M 0,10 Q 75,0 150,10 Q 225,20 300,10"
        underlineHoverPath="M 0,10 Q 75,20 150,10 Q 225,0 300,10"
        underlineDuration={1.5}
      />
      
      <div className="flex flex-col items-center space-y-6">
        <p className="text-lg text-muted-foreground text-center max-w-2xl">
          Whether you're a tiffin service provider looking to digitize your business, 
          or a customer seeking fresh home-cooked meals, we have the perfect solution for you.
        </p>
        
        <div className="flex gap-4 flex-col sm:flex-row">
          <Button 
            onClick={handleVendorAuth}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <FaStore className="w-5 h-5" />
            Join as Vendor
          </Button>
          
          <Button 
            onClick={handleCustomerAuth}
            size="lg"
            variant="outline"
            className="border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <FaShoppingBasket className="w-5 h-5" />
            Order Now
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ContactSection