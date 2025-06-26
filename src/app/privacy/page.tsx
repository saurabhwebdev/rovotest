import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | LPMS',
  description: 'Privacy Policy for Logistics Process Management System',
};

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Privacy Policy</h1>
      
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Introduction</h2>
          <p className="mb-3">
            This Privacy Policy explains how LPMS ("we", "us", or "our") collects, uses, shares, and protects your personal information 
            when you use our Logistics Process Management System (the "Service").
          </p>
          <p>
            We are committed to protecting your privacy and ensuring the security of your personal information. 
            This policy applies to all users of our Service, including administrators, transporters, dock operators, 
            gate guards, weighbridge operators, and other stakeholders.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Information We Collect</h2>
          <p className="mb-3">We collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, phone number, job title, company affiliation, and user credentials.</li>
            <li><strong>Vehicle Information:</strong> License plate numbers, vehicle specifications, driver details, and related documentation.</li>
            <li><strong>Transaction Data:</strong> Scheduling information, check-in/check-out times, weighbridge measurements, and dock operations details.</li>
            <li><strong>Audit Trail Data:</strong> User actions, system changes, and time-stamped activity logs.</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
            <li><strong>Usage Data:</strong> How you interact with our Service, features used, and time spent on various operations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">How We Use Your Information</h2>
          <p className="mb-3">We use the collected information for the following purposes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Providing and maintaining our Service</li>
            <li>Authenticating and authorizing user access</li>
            <li>Processing and tracking logistics operations</li>
            <li>Generating reports and analytics for operational insights</li>
            <li>Ensuring compliance with regulatory requirements</li>
            <li>Enhancing security and preventing fraud</li>
            <li>Improving and optimizing our Service</li>
            <li>Communicating with you about service-related matters</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, 
            unless a longer retention period is required or permitted by law. Transaction data and audit trails may be retained 
            for extended periods to comply with industry regulations, legal obligations, and for legitimate business purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information from unauthorized 
            access, disclosure, alteration, and destruction. These measures include encryption, access controls, regular security 
            assessments, and employee training. However, no method of transmission over the Internet or electronic storage is 100% 
            secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Sharing Your Information</h2>
          <p className="mb-3">We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> Third-party vendors who help us operate our Service (e.g., cloud hosting providers, analytics services).</li>
            <li><strong>Business Partners:</strong> Organizations we work with to provide integrated services, with your consent.</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental regulation.</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Your Rights</h2>
          <p className="mb-3">Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access, correct, or delete your personal information</li>
            <li>Restrict or object to the processing of your personal information</li>
            <li>Data portability</li>
            <li>Withdraw consent at any time (where processing is based on consent)</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us using the information in the "Contact Us" section.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Cookies and Similar Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and to enhance your experience. 
            You can control the use of cookies at the individual browser level, but disabling cookies may limit your use of 
            certain features or functions on our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, 
            legal, or regulatory reasons. We will notify you of any material changes through the Service or by other means.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <div className="mt-2">
            <p><strong>Email:</strong> privacy@lpms.com</p>
            <p><strong>Address:</strong> LPMS Headquarters, 123 Logistics Way, Enterprise City, EC 12345</p>
          </div>
        </section>

        <section>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            Last updated: {new Date().toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}
          </p>
        </section>
      </div>
    </div>
  );
} 