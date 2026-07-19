/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, AdminSettings } from '../types';
import { 
  Award, Check, Sparkles, CreditCard, ShieldCheck, 
  Smartphone, Wallet, ArrowRight, X, AlertTriangle 
} from 'lucide-react';
import { getUserBadge } from '../lib/badgeUtils';

interface PaywallProps {
  user: User;
  settings: AdminSettings;
  onPaymentSuccess: (updatedUser: User) => void;
  onClose?: () => void;
}

// Ensure TypeScript declaration for global Cashfree SDK
declare global {
  interface Window {
    Cashfree: any;
  }
}

export default function Paywall({ user, settings, onPaymentSuccess, onClose }: PaywallProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [mockOrderData, setMockOrderData] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'net'>('card');
  const [cardNumber, setCardNumber] = useState('4321 8901 2345 6789');
  const [cardExpiry, setCardExpiry] = useState('12/29');
  const [cardCvv, setCardCvv] = useState('123');
  const [errorMsg, setErrorMsg] = useState('');

  // Cashfree integration states
  const [isPolling, setIsPolling] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [paymentLink, setPaymentLink] = useState('');

  // Prevent background scrolling when active premium/upgrade modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Polling effect for Cashfree order payments
  useEffect(() => {
    let interval: any;
    if (isPolling && currentOrderId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/status/${currentOrderId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'SUCCESS') {
              setIsPolling(false);
              const syncRes = await fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
              });
              if (syncRes.ok) {
                const updatedUser = await syncRes.json();
                onPaymentSuccess(updatedUser);
              }
            }
          }
        } catch (e) {
          console.error('Polling payment status error:', e);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, currentOrderId, user.email, onPaymentSuccess]);

  const loadCashfreeScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Cashfree) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          amount: settings.membershipPrice || 499
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate transaction order on the backend');
      }

      const orderData = await response.json();
      
      if (orderData.isMock) {
        setMockOrderData(orderData);
        setShowSimulator(true);
      } else {
        // Run Real Cashfree SDK Flow
        try {
          const isWrongDomain = window.location.hostname !== 'sebok.in' && 
            window.location.hostname !== 'www.sebok.in' &&
            !window.location.hostname.includes('localhost') && 
            !window.location.hostname.includes('127.0.0.1');

          if (isWrongDomain) {
            console.log('[Cashfree] Non-authorized testing domain detected. Bypassing SDK inline checkout to prevent domain-lock error, falling back to secure payment tab.');
            setPaymentLink(orderData.payment_link);
            setCurrentOrderId(orderData.order_id);
            setIsPolling(true);
            if (orderData.payment_link) {
              window.open(orderData.payment_link, '_blank');
            }
            return;
          }

          await loadCashfreeScript();
          
          const cashfree = window.Cashfree({
            mode: orderData.isSandbox ? 'sandbox' : 'production'
          });

          // Open Cashfree standard checkout
          try {
            cashfree.checkout({
              paymentSessionId: orderData.payment_session_id,
              redirectTarget: '_modal'
            });
          } catch (inlineErr) {
            console.warn('Modal checkout launch failed, fallback to iframe/redirect mode', inlineErr);
          }

          // Show polling screen and payment link button in parallel for bulletproof usability
          setPaymentLink(orderData.payment_link);
          setCurrentOrderId(orderData.order_id);
          setIsPolling(true);
        } catch (sdkErr: any) {
          console.warn('Could not launch inline Cashfree script, falling back to secure payment tab', sdkErr);
          setPaymentLink(orderData.payment_link);
          setCurrentOrderId(orderData.order_id);
          setIsPolling(true);
          if (orderData.payment_link) {
            window.open(orderData.payment_link, '_blank');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Transaction failed. Make sure server is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock Gateway verification submission
  const handleSimulatePayment = async (status: 'SUCCESS' | 'FAILED') => {
    setIsLoading(true);
    try {
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: mockOrderData.order_id,
          status,
          userId: user.id,
          userEmail: user.email,
          amount: settings.membershipPrice,
          txId: 'CF_SIM_TX_' + Math.floor(Math.random() * 900000000 + 100000000)
        })
      });

      if (verifyRes.ok) {
        if (status === 'SUCCESS') {
          // Re-sync user session
          const syncRes = await fetch('/api/users/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email })
          });
          if (syncRes.ok) {
            const updatedUser = await syncRes.json();
            onPaymentSuccess(updatedUser);
          }
        } else {
          alert('Simulated transaction reported as failed. Feel free to try again.');
          setShowSimulator(false);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setShowSimulator(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: settings.currency || 'INR',
    maximumFractionDigits: 0
  }).format(settings.membershipPrice || 499);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-0 md:p-4">
      
      {!showSimulator ? (
        <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[390px] bg-white md:rounded-2xl overflow-y-auto shadow-2xl border-0 md:border border-slate-100 animate-scale-up flex flex-col">
          
          {/* Top Elegant Banner */}
          <div className="bg-teal-600 p-5 md:p-6 text-center text-white relative shrink-0">
            <div className="absolute top-3 left-3">
              <span className={`px-1.5 py-0.5 text-white text-[8px] font-bold tracking-widest uppercase rounded ${
                getUserBadge(user, settings) === 'PREMIUM' ? 'bg-amber-500' : 'bg-rose-500'
              }`}>
                {getUserBadge(user, settings) || 'TRIAL'}
              </span>
            </div>

            {onClose && (
              <button 
                onClick={onClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer z-10"
                title="Close"
              >
                <X size={16} />
              </button>
            )}

            <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <Award size={20} className="text-white" />
            </div>
            
            <h3 className="text-lg md:text-xl font-extrabold font-display">
              {getUserBadge(user, settings) === 'PREMIUM' 
                ? (settings.paywallExtendTitle || 'Extend Premium') 
                : (settings.paywallTitle || 'Activate Premium')}
            </h3>
            <p className="text-teal-50 text-[11px] mt-0.5">
              {getUserBadge(user, settings) === 'PREMIUM' 
                ? (settings.paywallExtendSubtitle || 'Extend your manual premium access for another month.') 
                : (settings.paywallSubtitle || 'Unlock Premium access to continue searching & applying.')}
            </p>
          </div>

          {/* Value List */}
          <div className="p-4 md:p-5 space-y-4">
            <div className="space-y-2.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display">
                Features included in your membership
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                {(settings.paywallFeatures && settings.paywallFeatures.length > 0
                  ? settings.paywallFeatures
                  : [
                      'Unlimited Premium Job Applications',
                      'Access Live HR/Recruiter Contact Details',
                      'Post in Community Feed with Image Uploads',
                      'Direct WhatsApp Chat with Hiring Managers'
                    ]
                  ).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] md:text-xs text-slate-600">
                    <div className="w-4.5 h-4.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check size={9} className="stroke-[3.5]" />
                    </div>
                    <span className="font-semibold leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider font-display">Premium Plan</p>
                <p className="text-[11px] md:text-xs text-slate-800 font-bold">
                  {settings.paywallPriceDescription || 'One-time manual purchase. Extend anytime.'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-lg md:text-xl font-bold text-slate-900 font-display">{formattedPrice}</span>
                <span className="text-[10px] text-slate-400 font-bold">/mo</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg font-medium border border-rose-100">
                {errorMsg}
              </p>
            )}

            {/* Subscribe Action */}
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-2.5 md:py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs md:text-sm font-display"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {getUserBadge(user, settings) === 'PREMIUM' 
                      ? (settings.paywallExtendButtonText || 'Extend Membership Now') 
                      : (settings.paywallButtonText || 'Activate Membership Now')}
                  </span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            <p className="text-[9px] text-gray-400 text-center font-medium leading-normal">
              {settings.paywallFooterText || 'Secured & processed under Cashfree Secure Gateway. This is a one-time manual charge. No automatic renewals or recurring billing cycles.'}
            </p>
          </div>

        </div>
      ) : isPolling && paymentLink ? (
        /* BEAUTIFUL SECURE CASHFREE REDIRECT & POLLING GATEWAY */
        <div className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[390px] bg-slate-900 md:rounded-2xl overflow-y-auto shadow-2xl border-0 md:border border-slate-800 text-white animate-scale-up flex flex-col p-6 items-center justify-center text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-teal-500/15 flex items-center justify-center text-teal-400 border border-teal-500/30 animate-pulse">
            <CreditCard size={28} className="animate-bounce" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-extrabold text-sm text-gray-100 font-display">Cashfree Secure Checkout</h3>
            <p className="text-[10px] text-teal-400 font-semibold tracking-wide uppercase">Waiting for payment...</p>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed max-w-xs">
            We have created a secure transaction request with Cashfree. Please click the button below to complete your payment in a secure tab.
          </p>

          <div className="space-y-3 w-full">
            <a
              href={paymentLink}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-teal-600/20 font-display"
            >
              <span>Open Secure Payment Tab</span>
              <ArrowRight size={14} />
            </a>

            <button
              onClick={() => {
                setIsPolling(false);
                setPaymentLink('');
                setCurrentOrderId('');
              }}
              className="text-slate-400 hover:text-white text-[10px] font-semibold underline underline-offset-4 cursor-pointer"
            >
              Cancel & Return
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center pt-2 border-t border-slate-800 w-full text-[9px] text-slate-400">
            <ShieldCheck size={12} className="text-teal-500" />
            <span>Secured & encrypted by Cashfree Payments</span>
          </div>
        </div>
      ) : (
        /* GORGEOUS CASHFREE PAYMENT GATEWAY SIMULATOR */
        <div className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-[390px] bg-slate-900 md:rounded-2xl overflow-y-auto shadow-2xl border-0 md:border border-slate-800 text-white animate-scale-up flex flex-col">
          
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-teal-600 flex items-center justify-center font-black text-[10px]">
                CF
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-gray-100 font-display">Cashfree Checkout</h3>
                <p className="text-[8px] text-teal-400 font-semibold tracking-widest uppercase">Simulator Mode</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowSimulator(false)}
              className="text-gray-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Warning about Simulator Fallback */}
            {mockOrderData?.warning && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-1.5 text-[9px] text-amber-300">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p>{mockOrderData.warning}</p>
              </div>
            )}

            {/* Order Brief */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
              <div>
                <p className="text-[9px] text-slate-400">Order Reference ID</p>
                <p className="font-mono text-slate-200 mt-0.5 font-bold">{mockOrderData.order_id}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400">Total Amount</p>
                <p className="text-sm font-black text-teal-400 mt-0.5 font-display">{formattedPrice}</p>
              </div>
            </div>

            {/* Tabs for simulated payment methods */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-[11px] font-display">
              <button
                onClick={() => setSelectedMethod('card')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMethod === 'card' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setSelectedMethod('upi')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMethod === 'upi' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                UPI / QR
              </button>
              <button
                onClick={() => setSelectedMethod('net')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMethod === 'net' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Netbanking
              </button>
            </div>

            {/* Input Details based on Method */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 min-h-32 flex flex-col justify-center">
              {selectedMethod === 'card' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-white mt-1 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-white mt-1 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-white mt-1 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'upi' && (
                <div className="text-center space-y-1.5 py-1">
                  <div className="w-16 h-16 bg-white p-1 rounded-lg mx-auto flex items-center justify-center">
                    {/* Simulated QR Code */}
                    <div className="w-full h-full bg-slate-900 flex flex-wrap p-0.5 gap-0.5">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`flex-1 min-w-[20%] h-3 rounded-xs ${i % 3 === 0 ? 'bg-white' : 'bg-slate-950'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400">Scan QR Code using GooglePay, PhonePe, or BHIM UPI</p>
                </div>
              )}

              {selectedMethod === 'net' && (
                <div className="space-y-1.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Popular Banks</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['State Bank', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bank, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => alert(`Selected ${bank}`)}
                        className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-left text-[11px] rounded-lg font-bold truncate text-slate-300 hover:text-white"
                      >
                        🏦 {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Action buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleSimulatePayment('FAILED')}
                disabled={isLoading}
                className="py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                Simulate Fail
              </button>

              <button
                type="button"
                onClick={() => handleSimulatePayment('SUCCESS')}
                disabled={isLoading}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ShieldCheck size={14} />
                <span>Simulate Success</span>
              </button>
            </div>

            <p className="text-[8px] text-slate-500 text-center leading-normal">
              This simulator mimics the Cashfree Checkout SDK panel to enable quick testing of the paywall lock state. No real money will be charged.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
