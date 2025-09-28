import React from 'react'
import { TestimonialsSection } from './testimonials-with-marquee'

const Testimonials = () => {
  // Testimonials from NourishNet users (vendors and customers)
  const testimonialsData = [
    {
      author: {
        name: "Rajesh Kumar",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        handle: "Owner @ Mumbai Tiffin Service"
      },
      text: "NourishNet's route optimization has cut our delivery time by 40%. We can now serve 300% more customers with the same delivery staff!"
    },
    {
      author: {
        name: "Priya Sharma",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616c96aea1c?w=100&h=100&fit=crop&crop=face",
        handle: "Software Engineer @ InfoTech"
      },
      text: "I love being able to track my tiffin delivery in real-time. The subscription management is so flexible - I can pause for holidays easily!"
    },
    {
      author: {
        name: "Amit Patel",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        handle: "Founder @ Ahmedabad Home Kitchen"
      },
      text: "The vendor dashboard is incredible. Managing 500+ subscribers, daily menus, and analytics has never been this simple. Revenue increased by 60%!"
    },
    {
      author: {
        name: "Sneha Reddy",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        handle: "Marketing Manager @ TechCorp"
      },
      text: "The mobile app is so user-friendly. I can see my delivery person's exact location and get notified when they're 5 minutes away. Perfect!"
    },
    {
      author: {
        name: "Vikram Singh",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        handle: "Owner @ Delhi Homestyle Tiffins"
      },
      text: "The automated billing and subscription system has eliminated all payment hassles. Customer retention improved by 80% since using NourishNet."
    },
    {
      author: {
        name: "Meera Iyer",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
        handle: "HR Executive @ Bangalore IT Hub"
      },
      text: "Finally, a tiffin service that fits my busy schedule! The flexible meal plans and reliable delivery tracking make it perfect for working professionals."
    }
  ];

  return (
    <TestimonialsSection
      title="Loved by Vendors & Customers"
      description="See how NourishNet is transforming tiffin services across India, helping vendors grow their business and customers enjoy hassle-free meal deliveries."
      testimonials={testimonialsData}
      
    />
  )
}

export default Testimonials
