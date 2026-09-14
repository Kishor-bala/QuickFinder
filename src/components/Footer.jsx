import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Heart, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import PsgLogo from './PsgLogo';

export default function Footer() {
  return (
    <footer className="bg-psg-navy text-slate-300 border-t border-blue-900/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* PSG Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <PsgLogo variant="dark" size="lg" showTagline={true} />
            <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
              Official Lost & Found System for <strong>PSG College of Arts and Science</strong>. Built to securely connect students, faculty, staff, and campus security to recover lost belongings across the campus.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white font-semibold pt-1">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/20">
                <MapPin className="w-3.5 h-3.5 text-white" />
                <span>Peelamedu, Coimbatore - 641004</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/20">
                <Phone className="w-3.5 h-3.5 text-white" />
                <span>Campus Security: 0422-2572177</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Campus Navigation</h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <Link to="/find" className="hover:text-white transition-colors">Search Lost Items</Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-white transition-colors">Upload Found Item</Link>
              </li>
              <li>
                <Link to="/report-lost" className="hover:text-white transition-colors">Report Lost Belonging</Link>
              </li>
              <li>
                <Link to="/my-items" className="hover:text-white transition-colors">My Reports & Claims</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Student / Staff Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Security & Verification */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Privacy & Security</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Student roll numbers, phone numbers, and emails are protected and only shared once ownership claims are verified by the finder or campus administrator.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-200">
              <Shield className="w-4 h-4 text-white" />
              <span>Verified Campus Claims System</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-blue-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} PSG College of Arts and Science — Campus Quick Finder. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for the PSG Campus Community.
          </p>
        </div>
      </div>
    </footer>
  );
}
