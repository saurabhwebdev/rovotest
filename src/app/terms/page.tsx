import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | LPMS',
  description: 'Terms of Service for Logistics Process Management System',
};

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Terms of Service</h1>
      
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">1. Acceptance of Terms</h2>
          <p className="mb-3">
            By accessing or using the Logistics Process Management System (the "Service"), you agree to be bound by these Terms of Service 
            ("Terms"). If you disagree with any part of the terms, you may not access the Service.
          </p>
          <p>
            These Terms apply to all users of the Service, including without limitation users who are administrators, 
            transporters, dock operators, gate guards, weighbridge operators, and other stakeholders.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">2. Service Description</h2>
          <p>
            LPMS provides an integrated logistics management platform designed to streamline and optimize logistics operations, 
            including truck scheduling, gate management, dock operations, weighbridge processes, and related activities. 
            The Service includes web applications, mobile interfaces, reporting tools, and other features that may be 
            updated or modified from time to time.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">3. User Accounts</h2>
          <p className="mb-3">
            To access certain features of the Service, you must register for an account. You agree to provide accurate, 
            current, and complete information during the registration process and to update such information to keep it 
            accurate, current, and complete.
          </p>
          <p className="mb-3">
            You are responsible for safeguarding the password that you use to access the Service and for any activities 
            or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination 
            of upper and lower case letters, numbers, and symbols) with your account.
          </p>
          <p>
            You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware 
            of any breach of security or unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">4. User Roles and Permissions</h2>
          <p className="mb-3">
            The Service implements role-based access control. Your account will be assigned one or more roles that determine 
            the features and data you can access. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only access features and data authorized for your assigned role(s)</li>
            <li>Not attempt to circumvent access restrictions</li>
            <li>Immediately report any access to unauthorized features or data</li>
            <li>Follow organizational protocols for role changes or permission updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">5. Data Integrity and Accuracy</h2>
          <p>
            You are responsible for the accuracy of data you enter into the Service. This includes, but is not limited to, 
            vehicle information, scheduling details, measurements, timestamps, and other operational data. Intentional 
            falsification of data is strictly prohibited and may result in termination of access and potential legal action.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">6. Intellectual Property Rights</h2>
          <p className="mb-3">
            The Service and its original content, features, and functionality are and will remain the exclusive property of 
            LPMS and its licensors. The Service is protected by copyright, trademark, and other laws of both the country 
            in which LPMS operates and foreign countries.
          </p>
          <p>
            Our trademarks and trade dress may not be used in connection with any product or service without the prior 
            written consent of LPMS.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">7. User Content</h2>
          <p className="mb-3">
            You retain any and all rights to any content you submit, post, or display on or through the Service ("User Content"). 
            By submitting, posting, or displaying User Content on or through the Service, you grant us a worldwide, non-exclusive, 
            royalty-free license to use, reproduce, adapt, publish, translate, and distribute such content for the purpose of 
            providing and improving the Service.
          </p>
          <p>
            You represent and warrant that: (i) the User Content is yours or you have the right to use it and grant us the 
            rights and license as provided in these Terms, and (ii) the posting of your User Content on or through the Service 
            does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">8. Prohibited Uses</h2>
          <p className="mb-3">You agree not to use the Service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>In any way that violates any applicable national or international law or regulation</li>
            <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter", "spam", or any other similar solicitation</li>
            <li>To impersonate or attempt to impersonate LPMS, a LPMS employee, another user, or any other person or entity</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm LPMS or users of the Service</li>
            <li>To attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service, the server on which the Service is stored, or any server, computer, or database connected to the Service</li>
            <li>To attack the Service via a denial-of-service attack or a distributed denial-of-service attack</li>
            <li>To use the Service for any purpose that is unlawful or prohibited by these Terms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">9. Service Availability and Maintenance</h2>
          <p className="mb-3">
            We strive to ensure that the Service is available 24/7. However, we do not guarantee uninterrupted access 
            to the Service. We reserve the right to temporarily suspend access to the Service for maintenance, upgrades, 
            or other operational reasons.
          </p>
          <p>
            We will make reasonable efforts to provide advance notice of scheduled maintenance activities that may 
            affect Service availability.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">10. Termination</h2>
          <p className="mb-3">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
            including without limitation if you breach the Terms.
          </p>
          <p>
            Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
            you may simply discontinue using the Service or contact your system administrator.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">11. Limitation of Liability</h2>
          <p>
            In no event shall LPMS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for 
            any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, 
            data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access 
            or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from 
            the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, 
            contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility 
            of such damage.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">12. Disclaimer</h2>
          <p>
            Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. 
            The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, 
            implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">13. Compliance with Laws</h2>
          <p>
            You agree to comply with all applicable domestic and international laws, statutes, ordinances, and regulations 
            regarding your use of the Service and your listing, purchase, solicitation of offers to purchase, and sale of items.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">14. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of the country in which LPMS operates, 
            without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms 
            will not be considered a waiver of those rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">15. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, 
            we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material 
            change will be determined at our sole discretion. By continuing to access or use our Service after those revisions 
            become effective, you agree to be bound by the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">16. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="mt-2">
            <p><strong>Email:</strong> legal@lpms.com</p>
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