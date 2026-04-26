const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Kothari Education</p>

      <p className="text-gray-600 mb-8">
        We respect your privacy and are committed to protecting your personal information.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Information We Collect</h2>
          <p className="text-gray-600">
            We may collect your name, contact details, educational information, and basic technical data
            to provide and improve our services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Use of Information</h2>
          <p className="text-gray-600">
            Your information is used to deliver educational services, process payments, communicate updates,
            and improve our platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Sharing of Information</h2>
          <p className="text-gray-600">
            We do not sell your data. Information may be shared only with trusted service providers
            (e.g., payment gateways) or when required by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Data Security</h2>
          <p className="text-gray-600">
            We take reasonable steps to protect your information from unauthorized access or misuse.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Your Rights</h2>
          <p className="text-gray-600">
            You can request to access, update, or delete your personal data by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Contact Us</h2>
          <p className="text-gray-600">
            For any privacy-related questions, please reach out to us via the{' '}
            <a href="/contact" className="text-primary-600 hover:underline">Contact page</a>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
