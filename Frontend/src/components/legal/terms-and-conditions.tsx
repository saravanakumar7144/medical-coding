import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const TERMS_CONTENT = {
  lastUpdated: 'December 14, 2024',
  version: '1.0',
  sections: [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using the Panaceon Medical Coding Platform ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use the Platform. Your continued use of the Platform constitutes acceptance of any modifications to these terms.`
    },
    {
      title: '2. HIPAA Compliance and Protected Health Information (PHI)',
      content: `This Platform is HIPAA compliant and handles Protected Health Information (PHI) in accordance with the Health Insurance Portability and Accountability Act of 1996 and its implementing regulations.

• All users must complete HIPAA training before accessing PHI
• Users are responsible for maintaining the confidentiality and security of PHI
• Any unauthorized disclosure of PHI may result in immediate termination and legal action
• Business Associate Agreements (BAA) are available upon request
• All PHI is encrypted both at rest (AES-256) and in transit (TLS 1.3)
• Audit logs are maintained for all access to PHI`
    },
    {
      title: '3. User Responsibilities',
      content: `As a user of the Platform, you agree to:

• Maintain the confidentiality of your login credentials
• Use strong passwords meeting our security requirements (8-12 characters, uppercase, lowercase, number)
• Never share your account with others
• Report any security incidents or suspected breaches immediately
• Use the Platform only for legitimate medical coding, billing, and claims management purposes
• Comply with all applicable federal and state regulations
• Complete all required training and certifications
• Log out when leaving your workstation unattended`
    },
    {
      title: '4. Data Security and Privacy',
      content: `We implement industry-leading security measures to protect your data:

• All data is encrypted using AES-256 encryption at rest
• All communications use TLS 1.3 encryption in transit
• Multi-factor authentication (MFA) is available and recommended
• Regular security audits are conducted by third-party experts
• Penetration testing is performed quarterly
• Data backups are performed daily with 30-day retention
• Disaster recovery procedures are in place with 99.9% uptime SLA`
    },
    {
      title: '5. Multi-Tenant Architecture',
      content: `The Platform operates on a multi-tenant architecture where:

• Each organization\'s data is logically separated and isolated
• Row-level security ensures tenant data separation
• No tenant can access another tenant\'s data
• Data is encrypted with tenant-specific encryption keys
• Audit logs track all cross-tenant access attempts (which are prohibited)
• Regular security reviews verify tenant isolation`
    },
    {
      title: '6. Service Availability and Uptime',
      content: `We strive to provide reliable service:

• Enterprise tier: 99.9% uptime SLA
• Professional tier: 99.5% uptime SLA
• Scheduled maintenance windows: Sundays 2:00 AM - 4:00 AM EST
• Users will be notified 48 hours in advance of scheduled maintenance
• Emergency maintenance may be performed without notice
• Service status is available at status.panaceon.com`
    },
    {
      title: '7. User Roles and Access Control',
      content: `The Platform supports role-based access control (RBAC):

• Administrator: Full system access, user management, configuration
• Manager: Team oversight, reporting, performance metrics
• Auditor: Read-only access, compliance review, quality assurance
• Coder: Medical coding, chart review, code assignment
• Billing Specialist: Claims submission, payment posting, denial management
• Executive: Analytics, dashboards, strategic insights

Role permissions are enforced at the application and database levels. Users may be assigned multiple roles based on their responsibilities.`
    },
    {
      title: '8. AI and Automation',
      content: `The Platform uses artificial intelligence to assist with:

• Medical code suggestions (ICD-10, CPT, HCPCS)
• Claims scrubbing and error detection
• Denial prediction and prevention
• Documentation quality assessment
• Revenue cycle optimization

All AI suggestions must be reviewed and approved by qualified professionals. The Platform does not make autonomous coding or billing decisions. Users retain full responsibility for all submitted codes and claims.`
    },
    {
      title: '9. Audit Logs and Compliance',
      content: `Comprehensive audit logging is maintained for:

• All user login and logout events
• PHI access and modifications
• Code assignments and changes
• Claims submissions and status changes
• System configuration changes
• Failed login attempts and security events

Audit logs are retained for 7 years in compliance with federal requirements. Logs are tamper-proof and available for regulatory review.`
    },
    {
      title: '10. Intellectual Property',
      content: `All content, features, and functionality of the Platform are owned by Panaceon and protected by copyright, trademark, and other intellectual property laws. You may not:

• Copy, modify, or distribute Platform content
• Reverse engineer or decompile the Platform
• Remove any copyright or proprietary notices
• Use the Platform to create competing services
• Extract data through automated means (scraping, bots)`
    },
    {
      title: '11. Limitation of Liability',
      content: `To the maximum extent permitted by law:

• Panaceon is not liable for any indirect, incidental, or consequential damages
• Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim
• We are not responsible for errors in AI suggestions or coding recommendations
• Users are solely responsible for the accuracy of submitted codes and claims
• We do not guarantee specific revenue outcomes or reimbursement rates`
    },
    {
      title: '12. Indemnification',
      content: `You agree to indemnify and hold Panaceon harmless from any claims, damages, or expenses arising from:

• Your violation of these Terms and Conditions
• Your violation of any law or regulation
• Your infringement of any third-party rights
• Incorrect coding or billing submitted through the Platform
• Unauthorized access to or disclosure of PHI`
    },
    {
      title: '13. Termination',
      content: `We may terminate or suspend your access to the Platform:

• Immediately for any violation of these Terms
• Upon request from your organization\'s administrator
• For non-payment of fees
• For suspected fraudulent or illegal activity
• At our discretion with 30 days\' notice

Upon termination, you must immediately cease using the Platform. Your organization\'s administrator may export data within 30 days of termination.`
    },
    {
      title: '14. Modifications to Terms',
      content: `We reserve the right to modify these Terms at any time. When we make changes:

• Users will be notified via email and in-app notification
• Continued use of the Platform after changes constitutes acceptance
• Material changes will require explicit re-acceptance
• Previous versions of Terms are archived and available upon request`
    },
    {
      title: '15. Governing Law and Dispute Resolution',
      content: `These Terms are governed by the laws of the United States and the State of Delaware, without regard to conflict of law provisions.

Any disputes will be resolved through:
1. Good faith negotiation between the parties
2. Mediation if negotiation fails
3. Binding arbitration in accordance with AAA rules
4. Litigation only if arbitration is unsuccessful

Class action lawsuits are not permitted.`
    },
    {
      title: '16. Contact Information',
      content: `For questions about these Terms and Conditions, please contact:

Panaceon Support Team
Email: support@panaceon.com
Phone: 1-800-PANACEON
Address: [Company Address]

For HIPAA-related concerns:
Privacy Officer: privacy@panaceon.com
Security Officer: security@panaceon.com`
    }
  ]
};

export function TermsAndConditions() {
  return (
    <Card className="w-full max-w-4xl mx-auto my-8 shadow-xl">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-3xl font-bold text-gray-900">
          Terms and Conditions
        </CardTitle>
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-600">
            Last Updated: {TERMS_CONTENT.lastUpdated}
          </p>
          <p className="text-sm text-gray-600">
            Version: {TERMS_CONTENT.version}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6 py-4">
          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed">
              Please read these Terms and Conditions carefully before using the Panaceon Medical Coding Platform.
              These terms govern your use of our services and contain important information about your rights and obligations.
            </p>

            {TERMS_CONTENT.sections.map((section, index) => (
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
                By using the Panaceon Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
