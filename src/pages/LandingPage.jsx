import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Upload, Sparkles, Shield, ArrowRight, Smartphone, Laptop, Wallet, CreditCard, Key, Briefcase, PlusCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const categories = [
    { name: 'Mobile', icon: Smartphone, count: 'Phones & Tablets' },
    { name: 'Laptop', icon: Laptop, count: 'Laptops & MacBooks' },
    { name: 'Wallet', icon: Wallet, count: 'Wallets & Cash' },
    { name: 'ID Card', icon: CreditCard, count: 'Student Roll ID & Library Cards' },
    { name: 'Keys', icon: Key, count: 'Hostel & Vehicle Keys' },
    { name: 'Bag', icon: Briefcase, count: 'Backpacks & Lab Records' },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-24">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-1 pb-2 flex flex-col items-center justify-center">
        {/* Soft Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/60 via-amber-100/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        <div className="max-w-5xl mx-auto px-4 text-center flex flex-col items-center space-y-1 sm:space-y-1.5">
          
          {/* Institutional Header */}
          <div className="animate-fade-in-down">
            <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-psg-blue bg-blue-50/80 border border-blue-200/60 px-3.5 py-0.5 rounded-full">
              PSG COLLEGE OF ARTS AND SCIENCE
            </span>
          </div>

          {/* Official PSG Crest Logo Image (Extra-Large Hero Display) */}
          <div className="animate-fade-in-down animation-delay-100 py-1">
            <img
              src="/psg-logo.svg"
              alt="PSG College Crest"
              className="h-24 sm:h-36 lg:h-40 w-auto mx-auto drop-shadow-xl transition-transform hover:scale-105"
            />
          </div>

          {/* QuickFinder Logo Image (Extra Large with Aggressively Tight Vertical Margins) */}
          <div className="animate-fade-in-up -my-6 sm:-my-12 lg:-my-16 flex flex-col items-center">
            <img
              src="/quickfinder-logo.png"
              alt="QUICK FINDER"
              className="h-32 sm:h-52 lg:h-64 max-w-[92vw] w-auto mx-auto object-contain transition-transform hover:scale-105 filter drop-shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
            />
            <p className="text-base sm:text-xl lg:text-2xl font-black text-slate-800 tracking-tight font-['Outfit'] -mt-6 sm:-mt-10 lg:-mt-14">
              Campus Lost & Found Management Hub
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in-up animation-delay-100 pt-0.5">
            Connect with students, faculty, and campus security. Automatically match lost belongings with found items across the PSG CAS campus through multi-attribute verification.
          </p>

          {/* Main Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-3xl animate-fade-in-up animation-delay-200">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-8 py-3.5 rounded-2xl bg-psg-navy hover:bg-psg-dark text-white font-extrabold text-sm sm:text-base shadow-xl shadow-psg-navy/20 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
              >
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-7 py-3 rounded-2xl bg-psg-navy hover:bg-psg-dark text-white font-black text-sm tracking-wide shadow-lg shadow-psg-navy/20 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <span>SIGN IN TO CAMPUS PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="px-7 py-3 rounded-2xl bg-white hover:bg-slate-50 text-psg-navy font-extrabold text-sm tracking-wide border-2 border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <span>CREATE ACCOUNT</span>
                </Link>
              </>
            )}

            <Link
              to="/find"
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-sm transition-all flex items-center justify-center gap-2 border border-slate-200/80 shadow-sm"
            >
              <Search className="w-4 h-4 text-psg-blue" />
              <span>Search Directory</span>
            </Link>
          </div>

          {/* Standalone Metrics Grid Container */}
          <div className="w-full pt-4 sm:pt-6 animate-scale-up animation-delay-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-psg-navy/5 text-center">
              <div className="space-y-0.5 p-1.5">
                <span className="block text-2xl sm:text-3xl font-black text-psg-navy font-['Outfit']">95%+</span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Recovery Rate</span>
              </div>
              <div className="space-y-0.5 p-1.5 border-l border-slate-100">
                <span className="block text-2xl sm:text-3xl font-black text-psg-blue font-['Outfit']">GROQ AI</span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Smart Matching</span>
              </div>
              <div className="space-y-0.5 p-1.5 border-l border-slate-100">
                <span className="block text-2xl sm:text-3xl font-black text-psg-navy font-['Outfit']">100%</span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Campus Verification</span>
              </div>
              <div className="space-y-0.5 p-1.5 border-l border-slate-100">
                <span className="block text-2xl sm:text-3xl font-black text-psg-blue font-['Outfit']">24/7</span>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Active Support</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How Quick Finder Operates */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-psg-blue">Automated Recovery Workflow</span>
          <h2 className="text-3xl sm:text-4xl font-black text-psg-navy tracking-tight font-['Outfit']">
            How PSG Quick Finder Operates
          </h2>
          <p className="text-slate-500 text-sm font-medium">Four simple steps to recover lost belongings on campus</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Step 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-psg-navy text-white flex items-center justify-center font-black text-xl border-2 border-slate-300 shadow">
              1
            </div>
            <h3 className="text-lg font-extrabold text-psg-navy font-['Outfit']">1. Report Lost Item</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Submit details of your lost belonging including item name, category, campus location, date, and distinct marks.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-psg-blue text-white flex items-center justify-center font-black text-xl border-2 border-blue-400 shadow">
              2
            </div>
            <h3 className="text-lg font-extrabold text-psg-navy font-['Outfit']">2. Upload Found Belonging</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Found an item on campus? Upload photos, specify where you found it, and post a verification question.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-black text-xl border-2 border-slate-600 shadow">
              3
            </div>
            <h3 className="text-lg font-extrabold text-psg-navy font-['Outfit']">3. Intelligent Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Our automated engine calculates weighted similarity match scores across location, category, date, and description.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl border-2 border-emerald-400 shadow">
              4
            </div>
            <h3 className="text-lg font-extrabold text-psg-navy font-['Outfit']">4. Verify & Reconnect</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Submit proof of ownership. Once verified by the finder, student phone & email details are securely unlocked!
            </p>
          </div>

        </div>
      </section>

      {/* Frequently Lost Campus Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
        <div className="bg-psg-navy rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-blue-900/60">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">Campus Directory</span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight font-['Outfit'] mt-1">
                Frequently Lost Belongings
              </h2>
            </div>
            <Link
              to="/find"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-white hover:underline"
            >
              <span>Browse Complete Directory →</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={idx}
                  to={`/find?category=${cat.name}`}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white transition-all duration-300 hover:-translate-y-1 text-center group"
                >
                  <div className="w-10 h-10 mx-auto rounded-xl bg-psg-blue/60 group-hover:bg-white text-white group-hover:text-psg-navy flex items-center justify-center mb-2.5 transition-colors shadow">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                  <p className="text-[10px] text-slate-300 mt-0.5">{cat.count}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
