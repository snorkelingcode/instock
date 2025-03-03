import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// Navigation component from other pages
const Navigation = () => (
  <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
    <Link to="/" className="text-xl font-bold">Pokemon In-Stock Tracker</Link>
    
    <div className="hidden md:flex space-x-6">
      <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
      <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
      <Link to="/news" className="text-gray-700 hover:text-blue-600">News</Link>
      <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
      <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">Contact</Link>
    </div>
    
    <Button className="md:hidden">Menu</Button>
  </nav>
);

// Footer component from other pages
const Footer = () => (
  <footer className="bg-white p-8 rounded-lg shadow-md mt-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="font-semibold mb-4">Pokemon In-Stock Tracker</h3>
        <p className="text-gray-600 mb-4">
          Helping Pokemon fans find products in stock since 2024.
        </p>
        <p className="text-gray-600">© 2025 In-Stock Tracker. All rights reserved.</p>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Site Links</h3>
        <ul className="space-y-2">
          <li><Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link></li>
          <li><Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link></li>
          <li><Link to="/news" className="text-gray-600 hover:text-blue-600">News</Link></li>
          <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link></li>
          <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link></li>
        </ul>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Legal</h3>
        <ul className="space-y-2">
          <li><Link to="/privacy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
          <li><Link to="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
          <li><Link to="/cookies" className="text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
        </ul>
      </div>
    </div>
  </footer>
);

const ContactPage = () => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Received",
      description: "We've received your message and will respond within 24 hours. Thank you!",
    });
  };
  
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2 bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
            <p className="text-gray-700 mb-8">
              Have questions or suggestions? We'd love to hear from you! Fill out the form below and our team will get back to you within 24 hours.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Enter your first name" required />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Enter your last name" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="Enter your email address" required />
              </div>
              
              <div className="space-y-2">
                <Label>What are you contacting us about?</Label>
                <RadioGroup defaultValue="question">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="question" id="question" />
                    <Label htmlFor="question" className="font-normal">General Question</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="suggestion" id="suggestion" />
                    <Label htmlFor="suggestion" className="font-normal">Suggestion</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partnership" id="partnership" />
                    <Label htmlFor="partnership" className="font-normal">Business Partnership</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bug" id="bug" />
                    <Label htmlFor="bug" className="font-normal">Website Issue/Bug</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="font-normal">Other</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Your Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Please provide details about your question, suggestion, or issue..." 
                  className="min-h-[150px]"
                  required
                />
              </div>
              
              {/* Advertisement placed within the form */}
              <div className="my-8 p-6 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-2">Advertisement</p>
                <div className="h-16 flex items-center justify-center border border-dashed border-gray-400">
                  <p className="text-gray-500">Google AdSense Banner (728×90)</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox id="newsletter" className="mt-1" />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="newsletter" className="font-normal">
                    Subscribe to our newsletter for product restock alerts and Pokemon TCG news
                  </Label>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox id="terms" className="mt-1" required />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="terms" className="font-normal">
                    I agree to the <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                  </Label>
                </div>
              </div>
              
              <Button type="submit" className="w-full md:w-auto">Submit Message</Button>
            </form>
          </div>
          
          <div>
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Email</p>
                  <a href="mailto:info@pokemoninstocktracker.com" className="text-blue-600 hover:underline">
                    info@pokemoninstocktracker.com
                  </a>
                </div>
                
                <div>
                  <p className="font-medium">Hours of Operation</p>
                  <p className="text-gray-700">Our support team is available:</p>
                  <p className="text-gray-700">Monday - Friday: 9am - 5pm EST</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium">How accurate are your stock alerts?</h3>
                  <p className="text-gray-700 mt-1">
                    Our alerts are based on real-time inventory data and typically notify users within seconds of a restock.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Is this service free to use?</h3>
                  <p className="text-gray-700 mt-1">
                    Yes! Basic stock tracking and website access is completely free. We offer premium plans with additional features.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">How do I set up alerts?</h3>
                  <p className="text-gray-700 mt-1">
                    Create an account and visit your profile to set up product-specific or category-wide alerts via email, SMS, or push notification.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">What retailers do you track?</h3>
                  <p className="text-gray-700 mt-1">
                    We currently track Pokemon Center, Target, Walmart, Best Buy, GameStop, and dozens of other retailers.
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Link to="/faq" className="text-blue-600 hover:underline">
                  View all FAQs
                </Link>
              </div>
            </div>
            
            {/* Advertisement in the sidebar */}
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-2">Advertisement</p>
              <div className="h-40 flex items-center justify-center border border-dashed border-gray-400">
                <p className="text-gray-500">Google AdSense (300×250)</p>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default ContactPage;
