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
          <Link to="/terms" className="text-gray-700 hover:text-blue-600 font-medium py-2">Terms of Service</Link>
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
          <li><Link to="/terms" className="text-gray-600 hover:text-blue-600 font-medium">Terms of Service</Link></li>
          <li><Link to="/cookies" className="text-gray-600 hover:text-blue-600">Cookie Policy</Link></li>
        </ul>
      </div>
    </div>
  </footer>
);

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] font-['Inter']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Navigation />
        
        <div className="bg-white p-8 rounded-lg shadow-md mb-12">
          <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-8">Last Updated: March 1, 2025</p>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="mb-4">
                Welcome to TCG In-Stock Tracker. These Terms of Service ("Terms") govern your access to and use of tcginstocktracker.com (the "Site"). By accessing or using our Site, you agree to be bound by these Terms.
              </p>
              <p className="mb-4">
                Please read these Terms carefully before using our Site. If you do not agree to these Terms, you must not access or use our Site.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Use of the Site</h2>
              <p className="mb-4">
                TCG In-Stock Tracker provides a platform for users to view information about trading card game product availability across various retailers. We do not sell products directly. When you click on product links, you will be redirected to third-party retailer websites where you may complete purchases.
              </p>
              <p className="mb-4">
                You may use our Site only for lawful purposes and in accordance with these Terms. You agree not to use our Site:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>In any way that violates applicable federal, state, local, or international law or regulation.</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
                <li>To impersonate or attempt to impersonate TCG In-Stock Tracker, a TCG In-Stock Tracker employee, another user, or any other person or entity.</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Site.</li>
                <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Site or any server, computer, or database connected to the Site.</li>
                <li>To attack the Site via a denial-of-service attack or a distributed denial-of-service attack.</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Intellectual Property Rights</h2>
              <p className="mb-4">
                The Site and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, and the design, selection, and arrangement thereof) are owned by TCG In-Stock Tracker, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
              <p className="mb-4">
                These Terms permit you to use the Site for your personal, non-commercial use only. You must not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Site, except as follows:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials.</li>
                <li>You may store files that are automatically cached by your Web browser for display enhancement purposes.</li>
                <li>You may print or download one copy of a reasonable number of pages of the Site for your own personal, non-commercial use and not for further reproduction, publication, or distribution.</li>
              </ul>
            </section>
            
            {/* Advertisement in content */}
            <div className="my-8 p-6 bg-gray-100 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-2">Advertisement</p>
              <div className="h-24 flex items-center justify-center border border-dashed border-gray-400">
                <p className="text-gray-500">Google AdSense Banner (728×90)</p>
              </div>
            </div>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Accuracy of Information</h2>
              <p className="mb-4">
                We strive to provide accurate information about product availability and pricing. However, we cannot guarantee that all information on our Site is accurate, complete, or current. Product availability and pricing may change rapidly, and there may be a delay between when a change occurs and when it is reflected on our Site.
              </p>
              <p className="mb-4">
                All product information is provided for informational purposes only. Pricing, availability, and other details are subject to change without notice. The inclusion of any products on our Site does not imply or warrant that these products will be available at any particular time.
              </p>
              <p className="mb-4">
                We are not responsible for any errors or omissions in the content on the Site. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update information at any time without prior notice.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Third-Party Links</h2>
              <p className="mb-4">
                The Site may contain links to third-party websites or services that are not owned or controlled by TCG In-Stock Tracker. These links are provided for your convenience and reference only.
              </p>
              <p className="mb-4">
                TCG In-Stock Tracker has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We do not warrant the offerings of any of these entities/individuals or their websites.
              </p>
              <p className="mb-4">
                When you click on product links and are redirected to retailer websites, you are subject to those websites' terms and policies. We strongly advise you to read the terms and conditions and privacy policies of any third-party websites that you visit.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Disclaimer of Warranties</h2>
              <p className="mb-4">
                THE SITE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. NEITHER TCG IN-STOCK TRACKER NOR ANY PERSON ASSOCIATED WITH TCG IN-STOCK TRACKER MAKES ANY WARRANTY WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE SITE.
              </p>
              <p className="mb-4">
                WITHOUT LIMITING THE FOREGOING, NEITHER TCG IN-STOCK TRACKER NOR ANYONE ASSOCIATED WITH TCG IN-STOCK TRACKER REPRESENTS OR WARRANTS THAT THE SITE WILL BE ACCURATE, RELIABLE, ERROR-FREE, OR UNINTERRUPTED, THAT DEFECTS WILL BE CORRECTED, THAT OUR SITE OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS, OR THAT THE SITE WILL OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Limitation of Liability</h2>
              <p className="mb-4">
                TO THE FULLEST EXTENT PROVIDED BY LAW, IN NO EVENT WILL TCG IN-STOCK TRACKER, ITS AFFILIATES, OR THEIR LICENSORS, SERVICE PROVIDERS, EMPLOYEES, AGENTS, OFFICERS, OR DIRECTORS BE LIABLE FOR DAMAGES OF ANY KIND, UNDER ANY LEGAL THEORY, ARISING OUT OF OR IN CONNECTION WITH YOUR USE, OR INABILITY TO USE, THE SITE, ANY WEBSITES LINKED TO IT, ANY CONTENT ON THE SITE OR SUCH OTHER WEBSITES, INCLUDING ANY DIRECT, INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO, PERSONAL INJURY, PAIN AND SUFFERING, EMOTIONAL DISTRESS, LOSS OF REVENUE, LOSS OF PROFITS, LOSS OF BUSINESS OR ANTICIPATED SAVINGS, LOSS OF USE, LOSS OF GOODWILL, LOSS OF DATA, AND WHETHER CAUSED BY TORT (INCLUDING NEGLIGENCE), BREACH OF CONTRACT, OR OTHERWISE, EVEN IF FORESEEABLE.
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
              <h2 className="text-2xl font-semibold mb-4">Indemnification</h2>
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless TCG In-Stock Tracker, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Site.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Governing Law</h2>
              <p className="mb-4">
                These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of the state of Texas, without giving effect to any choice or conflict of law provision or rule.
              </p>
              <p className="mb-4">
                Any legal suit, action, or proceeding arising out of, or related to, these Terms or the Site shall be instituted exclusively in the federal courts of the United States or the courts of the State of Texas, although we retain the right to bring any suit, action, or proceeding against you for breach of these Terms in your country of residence or any other relevant country.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Changes to the Terms</h2>
              <p className="mb-4">
                We may revise and update these Terms from time to time in our sole discretion. All changes are effective immediately when we post them and apply to all access to and use of the Site thereafter.
              </p>
              <p className="mb-4">
                Your continued use of the Site following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Severability</h2>
              <p className="mb-4">
                If any provision of these Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms will continue in full force and effect.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
              <p className="mb-4">
                Questions or comments about the Site or these Terms can be sent to:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 mb-4">
                <p>TCG In-Stock Tracker</p>
                <p>Email: legal@tcginstocktracker.com</p>
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

export default TermsOfService;
