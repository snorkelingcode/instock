import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Reuse Navigation and Footer components in a real implementation
const Navigation = () => (
  <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex justify-between items-center">
    <Link to="/" className="text-xl font-bold">Pokemon In-Stock Tracker</Link>
    
    <div className="hidden md:flex space-x-6">
      <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
      <Link to="/products" className="text-gray-700 hover:text-blue-600">Products</Link>
      <Link to="/news" className="text-gray-700 hover:text-blue-600">News</Link>
      <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
      <Link to="/contact" className="text-gray-700 hover:text-blue-600">Contact</Link>
    </div>
    
    <Button className="md:hidden">Menu</Button>
  </nav>
);

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
          <li><Link to="/products" className="text-gray-600 hover:text-blue-600">Products</Link></li>
          <li><Link to="/news" className="text-gray-600 hover:text-blue-600">News</Link></li>
          <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About</Link></li>
          <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact</Link></li>
        </ul>
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">Legal</h3>
        <ul className="space-y-2">
          <li><Link to="/privacy" className="text-gray-600 hover:text-blue-600 font-medium">Privacy Policy</Link></li>
          <li><Link to="/terms" className="text-gray-600 hover:text-blue-600">Terms of Service</Link></li>
          <li><Link to="/cookies" className="text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
        </ul>
      </div>
    </div>
  </footer>
);

const AdBanner = () => (
  <section className="bg-gray-200 p-6 rounded-lg mb-12 text-center">
    <p className="text-gray-700">Advertisement</p>
    <div className="h-16 flex items-center justify-center border border-dashed border-gray-400">
      <p className="text-gray-500">Google AdSense Banner (728×90)</p>
    </div>
  </section>
);

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        <div className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: March 1, 2025</p>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="mb-4">
                At Pokemon In-Stock Tracker ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at pokemoninstocktracker.com (the "Site").
              </p>
              <p className="mb-4">
                Please read this Privacy Policy carefully. By accessing or using our Site, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our Site.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
              <p className="mb-4">We may collect several types of information from and about users of our Site, including:</p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Personal Information</h3>
              <p className="mb-4">
                When you register for an account, sign up for alerts, or contact us, we may collect personally identifiable information, such as:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your name</li>
                <li>Email address</li>
                <li>Phone number (if you opt for SMS alerts)</li>
                <li>Account credentials</li>
                <li>Product preferences</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Usage Information</h3>
              <p className="mb-4">
                We may also collect information about how you access and use our Site, including:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages you visit</li>
                <li>Time and date of your visits</li>
                <li>Referring website addresses</li>
                <li>Other statistics about your interactions with our Site</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Collect Information</h2>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Direct Collection</h3>
              <p className="mb-4">
                We collect information directly from you when you:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Register for an account</li>
                <li>Sign up for email or text alerts</li>
                <li>Contact us via our contact form or email</li>
                <li>Subscribe to our newsletter</li>
                <li>Respond to surveys or feedback requests</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Automatic Collection</h3>
              <p className="mb-4">
                We use cookies and similar tracking technologies to collect information automatically about your equipment, browsing actions, and patterns. This helps us to improve our Site and deliver a better and more personalized service.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
              <p className="mb-4">We may use the information we collect about you for various purposes, including to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide, maintain, and improve our Site</li>
                <li>Notify you about changes to our Site or services</li>
                <li>Process and fulfill your alert requests</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Understand user preferences to enhance user experience</li>
                <li>Develop new products, services, features, and functionality</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Site</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Protect against, identify, and prevent fraud and other illegal activity</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Google AdSense</h2>
              <p className="mb-4">
                We use Google AdSense, a web advertising service provided by Google Inc., to display advertisements on our Site. Google AdSense uses cookies to serve ads based on your prior visits to our Site or other websites.
              </p>
              <p className="mb-4">
                Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our Site and/or other websites on the Internet. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
              </p>
              <p className="mb-4">
                Please note that Google has its own privacy policy, which we encourage you to review. Google's privacy policy can be found at <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>.
              </p>
              <p className="mb-4">
                We have no control over these third parties' tracking technologies or how they may be used. If you have any questions about an advertisement, you should contact the responsible advertiser directly.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking Technologies</h2>
              <p className="mb-4">
                We and our third-party service providers use cookies, web beacons, and other tracking technologies to collect information about your browsing activities over time and across different websites following your use of the Site.
              </p>
              <p className="mb-4">
                Cookies are small pieces of data stored on your device. They can be used to collect, store, and share data about your activities across websites, including on our Site. They allow us to remember things about your visits to our Site, such as your preferred language and other settings.
              </p>
              <p className="mb-4">
                We use the following types of cookies:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Essential Cookies:</strong> These cookies are necessary for the Site to function properly and cannot be disabled in our systems.</li>
                <li><strong>Analytical/Performance Cookies:</strong> These cookies allow us to recognize and count the number of visitors and see how visitors move around our Site when they are using it.</li>
                <li><strong>Functionality Cookies:</strong> These cookies enable the Site to provide enhanced functionality and personalization.</li>
                <li><strong>Targeting Cookies:</strong> These cookies record your visit to our Site, the pages you have visited, and the links you have followed.</li>
              </ul>
              <p className="mb-4">
                Most web browsers are set to accept cookies by default. If you prefer, you can usually set your browser to remove or reject cookies. Please note that doing so may affect the functionality of our Site.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Disclosure of Your Information</h2>
              <p className="mb-4">We may disclose personal information that we collect or you provide:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>To our subsidiaries and affiliates;</li>
                <li>To contractors, service providers, and other third parties we use to support our business;</li>
                <li>To fulfill the purpose for which you provide it;</li>
                <li>For any other purpose disclosed by us when you provide the information;</li>
                <li>With your consent;</li>
                <li>To comply with any court order, law, or legal process, including to respond to any government or regulatory request;</li>
                <li>To enforce or apply our terms of use and other agreements;</li>
                <li>If we believe disclosure is necessary or appropriate to protect the rights, property, or safety of our company, our customers, or others.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
              <p className="mb-4">
                You have certain rights regarding the personal information we hold about you. These may include rights to:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access and update your personal information;</li>
                <li>Request deletion of your personal information;</li>
                <li>Object to or restrict certain processing of your personal information;</li>
                <li>Opt out of marketing communications;</li>
                <li>Request a copy of your personal information.</li>
              </ul>
              <p className="mb-4">
                To exercise any of these rights, please contact us using the contact information provided below.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
              <p className="mb-4">
                We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="mb-4">
                Our Site is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us, and we will delete such information from our files.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to Our Privacy Policy</h2>
              <p className="mb-4">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="mb-4">
                If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-4">
                <p>Pokemon In-Stock Tracker</p>
                <p>Email: privacy@pokemoninstocktracker.com</p>
                <p>Contact Form: <Link to="/contact" className="text-blue-600 hover:underline">www.pokemoninstocktracker.com/contact</Link></p>
              </div>
            </section>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default PrivacyPolicy;
