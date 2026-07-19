'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo with Rupee symbol integrated into 'K' */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg viewBox="0 0 100 100" className="w-9 h-9 transform group-hover:scale-105 transition-transform duration-200">
              {/* Stem of K */}
              <rect x="25" y="15" width="11" height="70" rx="3.5" fill="#1E3A8A" />
              {/* Rupee double bars extending from stem */}
              <rect x="8" y="32" width="22" height="6.5" rx="2" fill="#1E3A8A" />
              <rect x="8" y="45" width="22" height="6.5" rx="2" fill="#1E3A8A" />
              {/* Diagonal top of K */}
              <path d="M 36 50 L 68 18 C 70 16, 75 18, 75 22 L 75 27 C 75 30, 48 54, 46 56 Z" fill="#EA580C" />
              {/* Diagonal bottom of K */}
              <path d="M 36 48 L 73 81 C 75 83, 75 86, 71 86 L 63 86 C 60 86, 46 72, 39 65 Z" fill="#EA580C" />
            </svg>
            <span className="text-2xl font-black tracking-tight text-[#1E3A8A] font-sans">
              kamai
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-[#1E3A8A] transition-colors">Features</a>
            <a href="#who-uses-it" className="text-sm font-semibold text-gray-600 hover:text-[#1E3A8A] transition-colors">Who Uses It</a>
            <a href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-[#1E3A8A] transition-colors">Pricing</a>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/oms"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] shadow-md hover:shadow-lg hover:shadow-orange-500/10 active:scale-98 transition-all duration-200"
            >
              Get Started for ₹299/mo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden p-2 text-gray-600 hover:text-[#1E3A8A] focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 space-y-3">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-gray-600 hover:text-[#1E3A8A] py-1"
            >
              Features
            </a>
            <a 
              href="#who-uses-it" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-gray-600 hover:text-[#1E3A8A] py-1"
            >
              Who Uses It
            </a>
            <a 
              href="#pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-gray-600 hover:text-[#1E3A8A] py-1"
            >
              Pricing
            </a>
            <Link 
              href="/oms"
              className="block w-full text-center px-5 py-3 rounded-xl text-base font-bold text-white bg-[#EA580C] hover:bg-[#d94e0b] shadow-md"
            >
              Get Started for ₹299/mo
            </Link>
          </div>
        )}
      </header>

      {/* 2. Hero Section (Above the Fold) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-gray-50 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left: Copy & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.08] tracking-tight">
                Stop Chasing Payments. <br />
                <span className="text-[#1E3A8A]">Start Tracking Your Kamai.</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                The all-in-one operating system and digital escrow for India’s independent creators, home bakers, and local merchants. Manage orders, secure 100% upfront payments, and auto-send WhatsApp receipts.
              </p>
              
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/oms"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg font-black text-white bg-[#EA580C] hover:bg-[#d94e0b] shadow-lg hover:shadow-orange-500/20 active:scale-98 transition-all duration-200 animate-pulse-subtle"
                >
                  Start Your 14-Day Free Trial
                </Link>
              </div>
              <p className="text-xs text-gray-400 font-semibold tracking-wide">
                No credit card required. Setup takes 60 seconds.
              </p>
            </div>

            {/* Hero Right: Chaotic Diary vs Clean Smartphone Mockup */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-6 lg:gap-4 justify-center items-center">
              {/* Chaotic Diary */}
              <div className="w-[260px] bg-amber-50/80 border border-amber-200/80 rounded-2xl shadow-md p-4 rotate-[-3deg] relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/10 rounded-bl-full flex items-center justify-center font-bold text-red-500 text-lg rotate-[15deg]">✕</div>
                <p className="text-[10px] font-bold tracking-wider text-amber-600/70 uppercase mb-2">📒 CAKE DIARY (JULY)</p>
                <div className="space-y-3 font-mono text-[11px] text-gray-500 leading-snug">
                  <div className="border-b border-amber-200 pb-1.5 line-through decoration-red-500/50">
                    <p className="font-bold text-gray-400">Priya (Anniversary)</p>
                    <p>₹1,800 - Advance due? Link sent?</p>
                  </div>
                  <div className="border-b border-amber-200 pb-1.5 relative">
                    <p className="font-bold text-red-700">Rohan Butterscotch</p>
                    <p>₹1,200 - Delivery Time? Check chat!</p>
                    <span className="absolute right-0 bottom-1.5 text-red-500 font-bold text-xs">??</span>
                  </div>
                  <div className="pb-1 line-through decoration-red-500/50">
                    <p className="font-bold text-gray-400">Uncle 2-tier Chocolate</p>
                    <p>₹3,500 - UPI paid or Cash?</p>
                  </div>
                </div>
              </div>

              {/* Clean Smartphone Mockup */}
              <div className="w-[280px] bg-slate-900 rounded-[38px] p-3 shadow-2xl rotate-[3deg] border-4 border-slate-800 shrink-0 relative overflow-hidden">
                {/* Speaker & Sensor bar */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-10" />
                
                {/* Mock Phone Screen */}
                <div className="bg-[#ECE5DD] w-full rounded-[28px] overflow-hidden aspect-[9/16] relative flex flex-col p-2.5 pt-6 font-sans">
                  
                  {/* WhatsApp Notification Banner */}
                  <div className="bg-white/95 backdrop-blur shadow-md rounded-xl p-2.5 border border-gray-100 flex items-start gap-2.5 mb-3 animate-bounce-subtle z-20">
                    <span className="text-lg leading-none mt-0.5">💬</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Kamai Alert</p>
                      <p className="text-[11px] font-bold text-gray-800 leading-tight mt-0.5">
                        ₹1,500 advance received for Order #104. Funds secured.
                      </p>
                    </div>
                  </div>

                  {/* Mock WhatsApp Chat */}
                  <div className="flex-1 flex flex-col justify-end gap-2 pb-1">
                    {/* User message */}
                    <div className="bg-[#E2F9C3] self-end max-w-[85%] rounded-xl rounded-tr-none p-2 shadow-sm text-[11px] text-gray-800 leading-normal">
                      <p className="font-bold text-[#075E54] text-[9px] mb-0.5">Kamai Escrow Link</p>
                      Please confirm order details and pay advance: kamai.in/pay/104
                    </div>
                    {/* System Confirmation */}
                    <div className="bg-white self-start max-w-[90%] rounded-xl rounded-tl-none p-2.5 shadow-sm text-[10px] text-gray-800 leading-snug border-l-4 border-emerald-500">
                      <p className="font-bold text-emerald-600 text-[9px] uppercase tracking-wider mb-1">✅ Order Confirmed</p>
                      <p className="font-semibold">Order ID: #104</p>
                      <p>Cake: Truffle Cake (2 lb)</p>
                      <p>Advance: ₹1,500 <span className="font-bold text-emerald-600">(SECURED)</span></p>
                      <p className="text-[8px] text-gray-400 mt-1 font-mono">Powered by Kamai Escrow</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Social Proof Banner (The Trust Layer) */}
      <section className="bg-white border-y border-gray-100 py-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
            Empowering 10,000+ local businesses across Bharat.
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 bg-[#E0F2FE] border border-blue-200/50 rounded-full px-5 py-2">
              <span className="text-xl">🛡️</span>
              <span className="text-xs font-black text-[#1E3A8A] uppercase tracking-wider">100% Secure UPI Payments</span>
            </div>
            <div className="flex items-center gap-2 bg-[#DCFCE7] border border-emerald-200/50 rounded-full px-5 py-2">
              <span className="text-xl">✅</span>
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">FSSAI Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-[#FFEDD5] border border-orange-200/50 rounded-full px-5 py-2">
              <span className="text-xl">🇮🇳</span>
              <span className="text-xs font-black text-orange-800 uppercase tracking-wider">Vande Bharatam Initiative</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Problem Section (Agitation) */}
      <section id="features" className="py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Running a local business shouldn't feel this chaotic.
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              Offline ledgers and scattered messages lead to lost margins, missed deliveries, and business stress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl">
                💬
              </div>
              <h3 className="text-xl font-bold text-gray-900">Scattered WhatsApp Chats</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Losing track of who ordered what, custom messages, sizes, and who paid the advance.
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl">
                ⏳
              </div>
              <h3 className="text-xl font-bold text-gray-900">Wasted Time in Lines</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Standing in wholesale markets for hours just to negotiate, buy, and carry raw materials.
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl">
                💸
              </div>
              <h3 className="text-xl font-bold text-gray-900">The Awkward Ask</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Hesitating to ask customers for pending balances or dealing with delayed payment excuses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Solution / Features Section */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 lg:space-y-32">
          
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Everything you need to professionalize your hustle.
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              We build tools tailored for independent operators to run, track, and scale their businesses.
            </p>
          </div>

          {/* Feature 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Graphic */}
            <div className="flex justify-center bg-gray-50 border border-gray-100 rounded-3xl p-8 aspect-video items-center overflow-hidden">
              <div className="w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 font-sans text-xs space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-gray-800">TCH-2026-0701</span>
                  <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold text-[9px]">Receipt</span>
                </div>
                <div className="space-y-1.5 text-gray-500 font-medium">
                  <p>Customer: Priya Roy</p>
                  <p>Item: Truffle Cake (1.5 lb)</p>
                  <p>Delivery: 21-July, 4 PM</p>
                </div>
                <hr className="border-dashed" />
                <div className="flex justify-between font-bold text-gray-800 text-sm">
                  <span>Total Cost</span>
                  <span>₹1,500</span>
                </div>
                <a href="#link" className="block text-center bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs hover:bg-[#075E54]">
                  📱 Send to WhatsApp
                </a>
              </div>
            </div>
            {/* Right Text */}
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                WhatsApp-Native CRM.
              </h3>
              <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
                Don't force your customers to download an app. Send professional, auto-calculated receipts and payment links directly to their WhatsApp.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Text (on desktop, will be ordered left) */}
            <div className="space-y-4 order-last lg:order-first">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                Digital Escrow for Wholesale.
              </h3>
              <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
                Skip the 2-hour queue at the main market. Pre-pay safely via Kamai Escrow, pick up your packed box in 60 seconds, and get instant refunds for out-of-stock items.
              </p>
            </div>
            {/* Right Graphic */}
            <div className="flex justify-center bg-gray-50 border border-gray-100 rounded-3xl p-8 aspect-video items-center overflow-hidden">
              <div className="w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 font-sans text-xs space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-black text-gray-800 text-sm tracking-wide">📦 Supply Merchant Order</span>
                  <span className="text-emerald-500 font-bold">● Active Escrow</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                    <span className="font-semibold">Step 1: Funds Locked in Escrow</span>
                    <span className="text-emerald-500 font-bold">🔒 Checked</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                    <span className="font-semibold">Step 2: Merchant Packing</span>
                    <span className="text-emerald-500 font-bold">✅ Packed</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                    <span className="font-semibold">Step 3: Ready for 60s Pickup</span>
                    <span className="text-[#EA580C] font-bold">⏱️ Waiting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Graphic */}
            <div className="flex justify-center bg-gray-50 border border-gray-100 rounded-3xl p-8 aspect-video items-center overflow-hidden">
              <div className="w-80 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 font-sans text-xs space-y-3">
                <p className="font-black text-gray-800 text-sm border-b pb-2">📊 Profit/Loss Ledger Widget</p>
                <div className="space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order Revenue:</span>
                    <span className="text-gray-900 font-bold">₹2,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Raw Ingredients Cost:</span>
                    <span className="text-red-500 font-bold">-₹850</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Delivery Boy Cost:</span>
                    <span className="text-red-500 font-bold">-₹150</span>
                  </div>
                </div>
                <hr className="border-dashed" />
                <div className="flex justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 items-center">
                  <span className="font-bold text-emerald-800">Net Margin Profit:</span>
                  <span className="font-black text-emerald-700 text-base">₹1,500 (60%)</span>
                </div>
              </div>
            </div>
            {/* Right Text */}
            <div className="space-y-4">
              <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                Automated Profit Ledger.
              </h3>
              <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">
                Input your raw material costs once. Kamai automatically calculates your net profit per order so you never underprice your hard work again.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 6. How It Works (3 Simple Steps) */}
      <section id="who-uses-it" className="py-20 lg:py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Simple 3-Step Setup
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              Start securing payments and tracking your profits in under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-black text-base">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900">Share Your Link</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Share your personalized Kamai link on your Instagram bio or WhatsApp status.
              </p>
            </div>
            {/* Step 2 */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-black text-base">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900">Get Secure Advances</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Customers fill out their order details and pay the UPI advance directly through the secure checkout.
              </p>
            </div>
            {/* Step 3 */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-black text-base">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900">Auto Logs & Alerts</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Kamai automatically logs the order, calculates costs, and alerts you when the balance is due.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Testimonial Section */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Hear from businesses that took control of their Kamai.
            </h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto font-medium">
              Real creators, home bakers, and merchants running their operations successfully.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Review 1 */}
            <div className="bg-[#FBFBFA] rounded-3xl border border-gray-100 p-8 space-y-6 flex flex-col justify-between">
              <p className="text-base sm:text-lg text-gray-700 italic font-medium leading-relaxed">
                "I used to manage 40 cake orders a week in a diary. I was losing money on forgotten UPI payments. Kamai fixed my business overnight."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-[#EA580C] font-black flex items-center justify-center text-lg">
                  P
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Priya</h4>
                  <p className="text-xs font-semibold text-gray-400">Home Baker, Kolkata</p>
                </div>
              </div>
            </div>
            {/* Review 2 */}
            <div className="bg-[#FBFBFA] rounded-3xl border border-gray-100 p-8 space-y-6 flex flex-col justify-between">
              <p className="text-base sm:text-lg text-gray-700 italic font-medium leading-relaxed">
                "My wholesale shop is too busy for inventory apps. With Kamai's Click-and-Collect, bakers pre-pay, we pack during quiet hours, and the app handles the rest."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-[#1E3A8A] font-black flex items-center justify-center text-lg">
                  R
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Rajesh</h4>
                  <p className="text-xs font-semibold text-gray-400">Supply Merchant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final Call-to-Action (Bottom of Page) */}
      <section id="pricing" className="py-20 lg:py-24 bg-[#1E3A8A] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-700 via-[#1E3A8A] to-blue-950 opacity-90" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to treat your business like a real business?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto font-medium">
              Join thousands of Karigars and creators building the new Indian economy.
            </p>
          </div>
          <div className="pt-2">
            <Link 
              href="/oms"
              className="inline-flex items-center justify-center px-10 py-5 rounded-2xl text-xl font-black text-white bg-[#EA580C] hover:bg-[#d94e0b] shadow-xl hover:shadow-orange-500/20 active:scale-98 transition-all duration-200 animate-pulse-subtle"
            >
              Claim Your Store Link Now
            </Link>
          </div>
          <p className="text-xs font-semibold text-blue-200 tracking-widest uppercase">
            No credit card required • Instant 60s onboarding
          </p>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 100 100" className="w-7 h-7">
                <rect x="25" y="15" width="11" height="70" rx="3.5" fill="#3B82F6" />
                <rect x="8" y="32" width="22" height="6.5" rx="2" fill="#3B82F6" />
                <rect x="8" y="45" width="22" height="6.5" rx="2" fill="#3B82F6" />
                <path d="M 36 50 L 68 18 C 70 16, 75 18, 75 22 L 75 27 C 75 30, 48 54, 46 56 Z" fill="#F97316" />
                <path d="M 36 48 L 73 81 C 75 83, 75 86, 71 86 L 63 86 C 60 86, 46 72, 39 65 Z" fill="#F97316" />
              </svg>
              <span className="text-lg font-black text-white">kamai</span>
            </div>
            
            {/* Footer Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
              <a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#terms" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#escrow" className="hover:text-white transition-colors">Escrow Guidelines</a>
              <a href="#support" className="hover:text-white transition-colors">Contact Support</a>
            </div>

            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
              Proudly Made in India for Bharat.
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center text-xs text-gray-600 font-medium">
            © {new Date().getFullYear()} Kamai Technologies. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
