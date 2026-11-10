// pages/email-success.tsx

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function EmailSuccess() {
  const router = useRouter();
  const { type } = router.query;
  
  // Determine email type (default to 'cart' for backwards compatibility)
  const emailType = type === 'invoice' ? 'invoice' : 'cart';
  
  // Dynamic content based on email type
  const content = {
    cart: {
      title: 'Cart Sent Successfully!',
      subtitle: 'Your cart has been sent to our team. We\'ll review your request and get back to you shortly.',
      pageTitle: 'Cart Sent - FluidPower Group',
      nextSteps: [
        'Our team will review your cart',
        'We\'ll contact you to discuss pricing and options',
        'We\'ll help you complete your order'
      ]
    },
    invoice: {
      title: 'Invoice Sent Successfully!',
      subtitle: 'The invoice has been emailed to your customer. A copy has also been sent to your business email for record keeping.',
      pageTitle: 'Invoice Sent - FluidPower Group',
      nextSteps: [
        'Customer will receive the invoice via email',
        'Payment details are included in the invoice',
        'You can create another invoice anytime'
      ]
    }
  };
  
  const currentContent = content[emailType];

  return (
    <>
      <Head>
        <title>{currentContent.pageTitle}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-green-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {currentContent.title}
          </h1>

          <p className="text-gray-600 mb-6">
            {currentContent.subtitle}
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">What&apos;s Next?</h2>
            <ul className="text-sm text-gray-700 space-y-2 text-left">
              {currentContent.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-yellow-500 mr-2">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            {emailType === 'cart' ? (
              // Cart email success - Continue Shopping
              <button
                onClick={() => router.push('/catalogue')}
                className="w-full cursor-pointer transition-all duration-300 inline-block font-bold text-lg"
                style={{
                  padding: "16px 32px",
                  borderRadius: "40px",
                  background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 215, 0, 0.9)",
                  color: "#000",
                  boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 4px 12px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px) scale(1)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                }}
              >
                Continue Shopping
              </button>
            ) : (
              // Invoice email success - Create Another Invoice
              <button
                onClick={() => router.push('/invoice-builder')}
                className="w-full cursor-pointer transition-all duration-300 inline-block font-bold text-lg"
                style={{
                  padding: "16px 32px",
                  borderRadius: "40px",
                  background: "radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 215, 0, 0.9)",
                  color: "#000",
                  boxShadow: "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(250, 204, 21, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.9), inset 0 4px 12px rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(255, 215, 0, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px) scale(1)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(250, 204, 21, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.8), inset 0 3px 10px rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(255, 215, 0, 0.4)";
                }}
              >
                Create Another Invoice
              </button>
            )}

            <button
              onClick={() => router.push('/')}
              className="w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              Return to Home
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Need immediate assistance?</p>
            <p className="text-sm">
              <a href="tel:+61347203323" className="text-blue-600 hover:underline font-semibold">
                03 4720 3323
              </a>
              {' | '}
              <a href="mailto:info@fluidpowergroup.com.au" className="text-blue-600 hover:underline font-semibold">
                info@fluidpowergroup.com.au
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}