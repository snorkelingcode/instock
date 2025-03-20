
import React from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="bg-white p-8 rounded-lg shadow-md mb-12">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: March 1, 2025</p>
        
        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="mb-4">
              At TCG Updates ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at tcgupdates.com (the "Site").
            </p>
            <p className="mb-4">
              Please read this Privacy Policy carefully. By accessing or using our Site, you acknowledge that you have read, understood, and agreed to be bound by all the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our Site.
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
            <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
            <p className="mb-4">
              We use analytics services such as Google Analytics to help us understand how users engage with our Site. These tools may use cookies and similar technologies to collect information about your use of the Site and your device.
            </p>
            <p className="mb-4">
              You can learn more about how Google uses your data when you use our Site by visiting <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>.
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
              <p>TCG Updates</p>
              <p>Email: privacy@tcgupdates.com</p>
              <p>Contact Form: <Link to="/contact" className="text-blue-600 hover:underline">www.tcgupdates.com/contact</Link></p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;
