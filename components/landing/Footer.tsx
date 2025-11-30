import React from 'react';
import Link from 'next/link';

export const LandingFooter = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            {/* Add social media links here */}
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} MultiQuiz. All rights reserved.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
            <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">MultiQuiz</h3>
                <p className="text-gray-500">Create engaging quizzes in minutes.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-8 md:mt-0">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Product</h3>
                    <ul className="mt-4 space-y-4">
                        <li><Link href="#features" className="text-base text-gray-500 hover:text-gray-900">Features</Link></li>
                        <li><Link href="#pricing" className="text-base text-gray-500 hover:text-gray-900">Pricing</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Company</h3>
                    <ul className="mt-4 space-y-4">
                        <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">About</a></li>
                        <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Contact</a></li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </footer>
  );
};
