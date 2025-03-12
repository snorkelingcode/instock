
import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import AdContainer from "@/components/ads/AdContainer";
import { useMetaTags } from "@/hooks/use-meta-tags";
import EmptyStateHandler from "@/components/ui/empty-state-handler";

const CookiePolicy = () => {
  // Add meta tags for SEO and AdSense compliance
  useMetaTags({
    title: "Cookie Policy | TCG In-Stock Tracker",
    description: "Learn about how TCG In-Stock Tracker uses cookies and similar technologies to enhance your browsing experience and provide personalized services.",
    keywords: "cookie policy, privacy, cookies, tracking technologies, user data, TCG tracker",
    ogTitle: "Cookie Policy | TCG In-Stock Tracker",
    ogDescription: "Information about cookies and tracking technologies used on TCG In-Stock Tracker to improve your experience."
  });

  const [contentLoaded, setContentLoaded] = React.useState(false);
  
  // Simulate loading state for demonstration
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setContentLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Layout>
      <EmptyStateHandler
        isLoading={!contentLoaded}
        hasItems={true}
        loadingComponent={<div className="p-8 text-center">Loading cookie policy...</div>}
        emptyComponent={<div className="p-8 text-center">Cookie policy is currently unavailable.</div>}
      >
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
            
            {/* Place ad after meaningful content */}
            <AdContainer 
              className="my-8" 
              adSlot="auto" 
              adFormat="horizontal" 
              fullWidth={true} 
            />
            
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
              
              <h3 className="text-xl font-medium mt-6 mb-3">Preference Cookies</h3>
              <p className="mb-4">
                These cookies allow our Site to remember choices you make and provide enhanced, more personal features. For example, these cookies can be used to remember your login details or language preference.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
              <p className="mb-4">
                Some cookies are placed by third parties on our website. These third parties may include:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Google (for Analytics)</li>
                <li>Social media platforms (if you use social sharing features)</li>
                <li>Other analytics providers</li>
              </ul>
              <p className="mb-4">
                These third parties may process your personal information in accordance with their own privacy policies. We encourage you to read their privacy policies to understand how they process your information.
              </p>
            </section>
            
            {/* Place ad after meaningful content */}
            <AdContainer 
              className="my-8" 
              adSlot="auto" 
              adFormat="rectangle" 
              fullWidth={true} 
            />
            
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
      </EmptyStateHandler>
    </Layout>
  );
};

export default CookiePolicy;
