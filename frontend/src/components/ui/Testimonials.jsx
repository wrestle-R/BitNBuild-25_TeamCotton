import React from 'react'
import { TestimonialsSection } from './testimonials-with-marquee'

const Testimonials = () => {
  // Sample testimonials data (with author object)
  const testimonialsData = [
    {
      author: {
        name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616c96aea1c?w=100&h=100&fit=crop&crop=face",
        handle: "Marketing Director @ TechCorp Inc."
      },
      text: "This service has completely transformed how we handle our marketing campaigns. The results speak for themselves!"
    },
    {
      author: {
        name: "Michael Chen",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        handle: "CEO @ StartupXYZ"
      },
      text: "Outstanding support and incredible features. Our team productivity has increased by 200% since we started using this."
    },
    {
      author: {
        name: "Emily Rodriguez",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        handle: "Product Manager @ InnovateLabs"
      },
      text: "The user experience is phenomenal. Our customers love the new interface and functionality."
    },
    {
      author: {
        name: "David Thompson",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        handle: "CTO @ FutureTech"
      },
      text: "Reliable, scalable, and exactly what we needed. The integration was seamless and support was exceptional."
    },
    {
      author: {
        name: "Lisa Wang",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
        handle: "Operations Manager @ GrowthCo"
      },
      text: "This has streamlined our entire workflow. What used to take hours now takes minutes. Absolutely revolutionary!"
    },
    {
      author: {
        name: "James Miller",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
        handle: "Founder @ NextGen Solutions"
      },
      text: "The best investment we've made for our business. The ROI has been incredible and the team loves using it."
    }
  ];

  return (
    <TestimonialsSection
      title="What Our Customers Say"
      description="Don't just take our word for it. See what our amazing customers have to say about their experience with our platform."
      testimonials={testimonialsData}
      
    />
  )
}

export default Testimonials
