/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { User, AdminSettings } from '../types';
import { 
  Award, Check, Sparkles, CreditCard, ShieldCheck, 
  Smartphone, Wallet, ArrowRight, X, AlertTriangle 
} from 'lucide-react';

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
        // Run Real Cashfree SDK Checkout Flow
        try {
          await loadCashfreeScript();
          const isProd = !settings.cashfreeAppId.toLowerCase().includes('test');
          const cashfree = window.Cashfree({
            mode: isProd ? 'production' : 'sandbox'
          });

          cashfree.checkout({
            paymentSessionId: orderData.payment_session_id,
            returnUrl: `${window.location.origin}/?payment_status=verify&order_id=${orderData.order_id}`
          });
        } catch (sdkErr: any) {
          console.warn('Could not launch cashfree SDK, falling back to simulator', sdkErr);
          setMockOrderData({
            ...orderData,
            warning: 'V3 checkout script blocked by iframe boundaries or network policy, simulated fallback enabled.'
          });
          setShowSimulator(true);
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      
      {!showSimulator ? (
        <div className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-scale-up flex flex-col">
          
          {/* Top Elegant Banner */}
          <div className="bg-teal-600 p-8 text-center text-white relative">
            <div className="absolute top-4 left-4">
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-bold tracking-widest uppercase rounded">
                Expired
              </span>
            </div>

            {onClose && (
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            )}

            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Award size={24} className="text-white" />
            </div>
            
            <h3 className="text-2xl font-extrabold font-display">Trial Expired</h3>
            <p className="text-teal-50 text-xs mt-1">
              Unlock Premium access to continue searching & applying.
            </p>
          </div>

          {/* Value List */}
          <div className="p-6 md:p-8 space-y-5">
            <div className="space-y-3">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-display">
                Features included in your membership
              </p>
              
              <div className="grid grid-cols-1 gap-2.5">
                {(settings.paywallFeatures && settings.paywallFeatures.length > 0
                  ? settings.paywallFeatures
                  : [
                      'Unlimited Premium Job Applications',
                      'Access Live HR/Recruiter Contact Details',
                      'Post in Community Feed with Image Uploads',
                      'Direct WhatsApp Chat with Hiring Managers'
                    ]
                  ).map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Check size={10} className="stroke-[3.5]" />
                    </div>
                    <span className="font-semibold">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-display">Premium Plan</p>
                <p className="text-xs text-slate-800 font-bold">Billed monthly. Cancel anytime.</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-slate-900 font-display">{formattedPrice}</span>
                <span className="text-xs text-slate-400 font-bold"> / mo</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg font-medium border border-rose-100">
                {errorMsg}
              </p>
            )}

            {/* Subscribe Action */}
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-sm font-display"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Activate Membership Now</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-400 text-center font-medium leading-normal">
              Secured & processed under Cashfree SDK Gateway. By continuing, you agree to our terms of services and automatic billing cycles.
            </p>
          </div>

        </div>
      ) : (
        /* GORGEOUS CASHFREE PAYMENT GATEWAY SIMULATOR */
        <div className="w-full max-w-md bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white animate-scale-up">
          
          {/* Header */}
          <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-600 flex items-center justify-center font-black text-xs">
                CF
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-gray-100 font-display">Cashfree Checkout</h3>
                <p className="text-[9px] text-teal-400 font-semibold tracking-widest uppercase">Simulator Mode</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowSimulator(false)}
              className="text-gray-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Warning about Simulator Fallback */}
            {mockOrderData?.warning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-[10px] text-amber-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p>{mockOrderData.warning}</p>
              </div>
            )}

            {/* Order Brief */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="text-[10px] text-slate-400">Order Reference ID</p>
                <p className="font-mono text-slate-200 mt-0.5 font-bold">{mockOrderData.order_id}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Total Amount</p>
                <p className="text-base font-black text-teal-400 mt-0.5 font-display">{formattedPrice}</p>
              </div>
            </div>

            {/* Tabs for simulated payment methods */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-xs font-display">
              <button
                onClick={() => setSelectedMethod('card')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMethod === 'card' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Card
              </button>
              <button
                onClick={() => setSelectedMethod('upi')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMethod === 'upi' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                UPI / QR
              </button>
              <button
                onClick={() => setSelectedMethod('net')}
                className={`py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedMethod === 'net' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Netbanking
              </button>
            </div>

            {/* Input Details based on Method */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 min-h-36 flex flex-col justify-center">
              {selectedMethod === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">CVV</label>
                      <input
                        type="password"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white mt-1 focus:outline-none focus:border-teal-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'upi' && (
                <div className="text-center space-y-2 py-2">
                  <div className="w-20 h-20 bg-white p-1 rounded-xl mx-auto flex items-center justify-center">
                    {/* Simulated QR Code */}
                    <div className="w-full h-full bg-slate-900 flex flex-wrap p-1 gap-1">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`flex-1 min-w-[20%] h-4 rounded-xs ${i % 3 === 0 ? 'bg-white' : 'bg-slate-950'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Scan QR Code using GooglePay, PhonePe, or BHIM UPI</p>
                </div>
              )}

              {selectedMethod === 'net' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Popular Banks</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bank, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => alert(`Selected ${bank}`)}
                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-left text-xs rounded-xl font-bold truncate text-slate-300 hover:text-white"
                      >
                        🏦 {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSimulatePayment('FAILED')}
                disabled={isLoading}
                className="py-3 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-2xl text-xs font-bold transition-all cursor-pointer"
              >
                Simulate Fail
              </button>

              <button
                type="button"
                onClick={() => handleSimulatePayment('SUCCESS')}
                disabled={isLoading}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck size={16} />
                <span>Simulate Success</span>
              </button>
            </div>

            <p className="text-[9px] text-slate-500 text-center leading-normal">
              This simulator mimics the Cashfree Checkout SDK panel to enable quick testing of the paywall lock state. No real money will be charged.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
