import { useState, useEffect } from 'react';
import { useUserContext } from '../../../context/UserContextSimplified';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import FooterSection from './FooterSection';

const LandingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useUserContext();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="w-full min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      
      <main className="overflow-hidden">
        <HeroSection user={user} />
      </main>

      <FeaturesSection />
      <TestimonialsSection />
      <ContactSection user={user} />
      <FooterSection />
    </div>
  );
};

export default LandingPage;