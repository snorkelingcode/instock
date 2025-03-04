import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Navigation component from other pages
const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  return (
    <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-col">
      <div className="flex justify-between items-center w-full">
        <Link to="/" className="text-xl font-bold">TCG In-Stock Tracker</Link>
        
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
          <Link to="/news" className="text-gray-700 hover:text-blue-600">News</Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
        </div>
        
        <Button 
          className="md:hidden" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          Menu
        </Button>
      </div>
      
      {isMenuOpen && (
        <div className="md:hidden w-full mt-4 flex flex-col space-y-3 pt-3 border-t border-gray-200">
          <Link to="/" className="text-gray-700 hover:text-blue-600 py-2">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-blue-600 py-2">Products</Link>
          <Link to="/news" className="text-gray-700 hover:text-blue-600 py-2">News</Link>
          <Link to="/about" className="text-gray-700 hover:text-blue-600 py-2">About</Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600 py-2">Contact</Link>
          <Link to="/cookies" className="text-gray-700 hover:text-blue-600 font-medium py-2">Cookie Policy</Link>
        </div>
      )}
    </nav>
  );
};

// Footer component from other pages
const Footer = () => (
  <footer className="bg-white p-8 rounded-lg shadow-md mt-16">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h3 className="font-semibold mb-4">TCG In-Stock Tracker</h3>
        <p className="text-gray-600 mb-4">
          Helping degens find products in stock since 2024.
        </p>
        <p className="text-gray-600">© 2025 In-Stock Tracker. All rights reserved.</p>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Site Links</h3>
        <ul className="space-y-2">
          <li><Link to="/" className="text-gray-600 hover:text-blue-600">Home</Link></li>
          <li><Link to="/products" className="text-gray-600 hover:text-blue-600">Products</Link></li>
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
          <li><Link to="/cookies" className="text-gray-600 hover:text-blue-600 font-medium">Cookie Policy</Link></li>
        </ul>
      </div>
    </div>
  </footer>
);

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        <div className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h1 className="text-3xl font-bold mb-6">Cookie Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: March 1, 2025</p>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="mb-4">
                This Cookie Policy explains how TCG In-Stock Tracker ("we," "our," or "us") uses cookies and similar technologies on our website at tcginstocktracker.com (the "Site"). By using our Site, you consent to the use of cookies as described in this policy.
              </p>
              <p className="mb-4">
                This policy provides you with clear and comprehensive information about the cookies and tracking technologies we use and the purposes for which we use them.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
              <p className="mb-4">
                Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit websites. They allow websites to recognize your device and remember certain information about your visit, such as your preferences and actions on the site.
              </p>
              <p className="mb-4">
                Cookies are widely used to make websites work more efficiently, enhance user experience, and provide information to website owners about how their sites are used.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Types of Cookies We Use</h2>
              <p className="mb-4">
                We use the following types of cookies on our Site:
              </p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Essential Cookies</h3>
              <p className="mb-4">
                These cookies are necessary for the Site to function properly. They enable core functionality such as security, network management, and accessibility. You may disable these by changing your browser settings, but this may affect how the Site functions.
              </p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Analytics Cookies</h3>
              <p className="mb-4">
                These cookies help us understand how visitors interact with our Site by collecting and reporting information anonymously. They allow us to recognize and count the number of visitors and to see how visitors move around our Site when they are using it.
              </p>
              <p className="mb-4">
                We use Google Analytics to gather statistical information about the use of our Site. Google Analytics stores information about what pages you visit, how long you are on the site, how you got here, and what you click on.
              </p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Advertising Cookies</h3>
              <p className="mb-4">
                These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed, and in some cases selecting advertisements that are based on your interests.
              </p>
              <p className="mb-4">
                We use Google AdSense to display advertisements on our Site. Google AdSense may use cookies to personalize the advertisements you see based on your browsing history.
              </p>
            </section>
            
            {/* Advertisement in content */}
            <div className="my-8 p-6 bg-gray-100 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-2">Advertisement</p>
              <div className="h-24 flex items-center justify-center border border-dashed border-gray-400">
                <p className="text-gray-500">Google AdSense Banner (728×90)</p>
              </div>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
              <p className="mb-4">
                Some cookies are placed by third parties on our website. These third parties may include:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Google (for Analytics and AdSense)</li>
                <li>Social media platforms (if you use social sharing features)</li>
                <li>Other analytics providers</li>
              </ul>
              <p className="mb-4">
                These third parties may process your personal information in accordance with their own privacy policies. We encourage you to read their privacy policies to understand how they process your information.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cookie Management</h2>
              <p className="mb-4">
                Most web browsers allow you to manage your cookie preferences. You can:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Delete cookies from your device</li>
                <li>Block cookies by activating the setting on your browser that allows you to refuse all or some cookies</li>
                <li>Set your browser to notify you when you receive a cookie</li>
              </ul>
              <p className="mb-4">
                Please note that if you choose to block all cookies (including essential cookies), you may not be able to access all or parts of our Site or certain features may not function properly.
              </p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Managing Google Cookies</h3>
              <p className="mb-4">
                You can opt out of Google Analytics tracking by installing the <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.
              </p>
              <p className="mb-4">
                To opt out of personalized advertising by Google, you can visit <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to Our Cookie Policy</h2>
              <p className="mb-4">
                We may update our Cookie Policy from time to time. We will notify you of any changes by posting the new Cookie Policy on this page and updating the "Last Updated" date at the top.
              </p>
              <p className="mb-4">
                We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="mb-4">
                If you have any questions about our Cookie Policy, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-4">
                <p>TCG In-Stock Tracker</p>
                <p>Email: privacy@tcginstocktracker.com</p>
                <p>Contact Form: <Link to="/contact" className="text-blue-600 hover:underline">www.tcginstocktracker.com/contact</Link></p>
              </div>
            </section>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default CookiePolicy;
