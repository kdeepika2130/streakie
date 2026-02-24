import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Github, Heart } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <span className="font-display font-bold text-xl text-neutral-900">
                StreakMates <span className="ml-1 text-2xl">🔥</span>
              </span>
            </Link>
            <p className="text-neutral-600 mb-4 text-sm">
              Build better habits together. Track your progress, join accountability circles, and achieve your goals.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
          <div className="col-span-1">
            <h3 className="font-display font-semibold text-neutral-900 mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Features</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Pricing</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Testimonials</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">FAQ</a></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h3 className="font-display font-semibold text-neutral-900 mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">About</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Team</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Careers</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Press</a></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h3 className="font-display font-semibold text-neutral-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Terms of Service</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Cookie Policy</a></li>
              <li><a href="#" className="text-neutral-600 hover:text-primary-600">Data Processing</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p className="text-neutral-600">&copy; {new Date().getFullYear()} StreakMates. All rights reserved.</p>
          <p className="text-neutral-600 flex items-center mt-4 md:mt-0">
            Made with <Heart size={16} className="text-red-500 mx-1" /> for better habits
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;