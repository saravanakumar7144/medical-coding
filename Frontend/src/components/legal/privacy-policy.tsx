import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const PRIVACY_CONTENT = {
  lastUpdated: 'December 14, 2024',
  version: '1.0',
  sections: [
    {
      title: '1. Introduction',
      content: `Welcome to Panaceon's Privacy Policy. This policy describes how we collect, use, protect, and share information when you use our Medical Coding Platform. We are committed to protecting your privacy and handling your data in an open and transparent manner.

This Privacy Policy applies to all users of the Panaceon Platform, including medical coders, billing specialists, managers, executives, auditors, and administrators.

Panaceon is HIPAA compliant and follows all applicable federal and state privacy regulations.`
    },
    {
      title: '2. Information We Collect',
      content: `We collect several types of information to provide and improve our services:

**A. Account Information**
• Full name (first and last name)
• Email address
• Username
• Phone number
• Employee ID
• Job role and department
• Organization/tenant affiliation

**B. Authentication and Security Data**
• Password hashes (never stored in plaintext)
• Multi-factor authentication settings
• Session tokens and refresh tokens
• Login history and timestamps
• Failed login attempts
• Device and browser information

**C. Protected Health Information (PHI)**
• Patient demographics (encrypted)
• Medical diagnoses and procedures
• Insurance information
• Claims data and billing information
• Documentation and medical charts
• Provider information

**D. Usage Data**
• Pages visited and features used
• Time spent on Platform
• Search queries and filters
• Code selections and modifications
• Claims submitted and status
• Reports generated
• Keyboard shortcuts and preferences

**E. Technical Data**
• IP address
• Browser type and version
• Operating system
• Screen resolution
• Referral source
• API requests and responses`
    },
    {
      title: '3. How We Use Your Information',
      content: `We use collected information for the following purposes:

**A. Service Delivery**
• Provide medical coding, billing, and claims management services
• Process and submit insurance claims
• Generate reports and analytics
• Facilitate communication between team members

**B. Platform Improvement**
• Analyze usage patterns to improve features
• Develop new functionality based on user needs
• Train and improve AI/ML models for code suggestions
• Optimize platform performance and reliability

**C. Security and Compliance**
• Authenticate users and prevent unauthorized access
• Detect and prevent fraud and abuse
• Maintain audit logs for compliance
• Investigate security incidents
• Enforce our Terms and Conditions

**D. Communication**
• Send account activation and password reset emails
• Provide customer support
• Notify users of platform updates
• Share important security and compliance information
• Send newsletters (with opt-out option)

**E. Legal Obligations**
• Comply with HIPAA and other regulations
• Respond to legal requests and court orders
• Protect our rights and property
• Resolve disputes and enforce agreements`
    },
    {
      title: '4. Data Storage and Security',
      content: `We implement comprehensive security measures to protect your data:

**A. Encryption**
• All PHI encrypted at rest using AES-256
• All communications encrypted using TLS 1.3
• Database-level encryption with tenant-specific keys
• Encrypted backups stored in separate locations

**B. Access Controls**
• Role-based access control (RBAC)
• Multi-factor authentication (MFA) available
• Automatic session timeout after inactivity
• Password strength requirements enforced
• Access logs maintained for all PHI

**C. Infrastructure Security**
• Azure cloud infrastructure with SOC 2 compliance
• Firewalls and intrusion detection systems
• Regular security patches and updates
• Network segmentation and isolation
• DDoS protection

**D. Physical Security**
• Data centers with 24/7 monitoring
• Biometric access controls
• Video surveillance
• Climate and power redundancy

**E. Data Retention**
• Active data: Retained as long as account is active
• Audit logs: Retained for 7 years (HIPAA requirement)
• Backups: Daily backups with 30-day retention
• Deleted data: Securely purged within 90 days`
    },
    {
      title: '5. Data Sharing and Disclosure',
      content: `We share your information only in limited circumstances:

**A. Within Your Organization**
• Data is shared with other users in your organization based on role permissions
• Administrators can view user activity and audit logs
• Team members can collaborate on claims and coding

**B. Service Providers**
• Cloud hosting provider (Microsoft Azure)
• Email service provider (for activation and notifications)
• Analytics service (anonymized data only)
• Security and monitoring services

All service providers sign Business Associate Agreements (BAA) and comply with HIPAA.

**C. Legal Requirements**
• Compliance with court orders and subpoenas
• Response to lawful requests from government authorities
• Protection of our legal rights
• Prevention of fraud or illegal activity

**D. Business Transfers**
• In the event of merger, acquisition, or sale, data may be transferred to successor entity
• Users will be notified of any such transfer
• Privacy protections will continue to apply

**E. With Your Consent**
• Any other sharing requires explicit user consent
• Users can withdraw consent at any time`
    },
    {
      title: '6. Your Privacy Rights',
      content: `You have the following rights regarding your personal information:

**A. Access Right**
• Request a copy of all personal data we hold about you
• Receive data in a structured, machine-readable format
• Response provided within 30 days

**B. Correction Right**
• Request correction of inaccurate or incomplete data
• Update your profile information at any time

**C. Deletion Right**
• Request deletion of your personal data
• Subject to legal retention requirements (e.g., HIPAA 7-year retention)
• Some data may be retained in anonymized form

**D. Portability Right**
• Export your data in CSV or JSON format
• Transfer data to another service provider

**E. Objection Right**
• Object to processing of your data for certain purposes
• Opt out of marketing communications
• Restrict automated decision-making

**F. Complaint Right**
• File a complaint with our Privacy Officer
• Contact regulatory authorities (e.g., HHS Office for Civil Rights)

To exercise any of these rights, contact privacy@panaceon.com`
    },
    {
      title: '7. Cookies and Tracking Technologies',
      content: `We use cookies and similar technologies for:

**Essential Cookies** (Required)
• Session management and authentication
• Security and fraud prevention
• Platform functionality

**Analytics Cookies** (Optional)
• Usage statistics and trends
• Performance monitoring
• Feature effectiveness

**Preference Cookies** (Optional)
• User interface settings
• Language preferences
• Display customization

You can control cookies through your browser settings. Disabling essential cookies may impair platform functionality.`
    },
    {
      title: '8. Third-Party Services',
      content: `We integrate with certain third-party services:

**Microsoft Azure**
• Cloud hosting and infrastructure
• Data storage and databases
• Privacy Policy: https://privacy.microsoft.com/

**AI/ML Services**
• Medical code suggestion models
• Natural language processing
• All PHI is anonymized before processing

We carefully vet all third-party services for security and privacy compliance.`
    },
    {
      title: '9. International Data Transfers',
      content: `Your data is primarily stored in the United States. If you access the Platform from outside the U.S.:

• Data may be transferred to and processed in the U.S.
• U.S. privacy laws may differ from your country
• We implement appropriate safeguards for international transfers
• EU users: We comply with GDPR requirements`
    },
    {
      title: '10. Children\'s Privacy',
      content: `The Panaceon Platform is not intended for use by individuals under 18 years of age. We do not knowingly collect information from children. If we become aware that a child has provided personal information, we will delete it immediately.`
    },
    {
      title: '11. Data Breach Notification',
      content: `In the event of a data breach involving PHI:

• Affected users will be notified within 60 days
• Notification will include nature of breach and data affected
• Steps to protect yourself will be provided
• Regulatory authorities will be notified as required
• Incident report will be published (anonymized)

For non-PHI breaches, notifications will be provided as required by applicable law.`
    },
    {
      title: '12. Changes to This Privacy Policy',
      content: `We may update this Privacy Policy periodically to reflect:

• Changes in our practices or services
• Legal or regulatory updates
• User feedback and suggestions

When we make changes:
• Updated policy will be posted on the Platform
• Users will be notified via email for material changes
• Effective date will be updated at the top
• Continued use constitutes acceptance

Previous versions of this policy are archived and available upon request.`
    },
    {
      title: '13. California Privacy Rights (CCPA)',
      content: `California residents have additional rights under the California Consumer Privacy Act (CCPA):

• Right to know what personal information is collected
• Right to know whether personal information is sold or disclosed
• Right to opt-out of sale of personal information
• Right to deletion of personal information
• Right to non-discrimination for exercising CCPA rights

Note: We do not sell personal information to third parties.

California residents can exercise these rights by contacting privacy@panaceon.com`
    },
    {
      title: '14. Contact Information',
      content: `For privacy-related questions or concerns:

**Privacy Officer**
Email: privacy@panaceon.com
Phone: 1-800-PANACEON
Mail: Panaceon Privacy Officer
      [Company Address]

**Security Officer**
Email: security@panaceon.com

**General Support**
Email: support@panaceon.com
Website: www.panaceon.com/support

**Response Time**
We will respond to all privacy inquiries within 5 business days and provide a full response within 30 days.`
    }
  ]
};

export function PrivacyPolicy() {
  return (
    <Card className="w-full max-w-4xl mx-auto my-8 shadow-xl">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-3xl font-bold text-gray-900">
          Privacy Policy
        </CardTitle>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-600">
            Last Updated: {PRIVACY_CONTENT.lastUpdated}
          </p>
          <p className="text-sm text-gray-600">
            Version: {PRIVACY_CONTENT.version}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6 py-4">
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 font-medium">
                Your privacy is important to us. This Privacy Policy explains how we collect, use, protect, and share your information.
              </p>
            </div>

            {PRIVACY_CONTENT.sections.map((section, index) => (
              <div key={index} className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {section.title}
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            ))}

            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                By using the Panaceon Platform, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
