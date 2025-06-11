import React, { useState } from 'react';
import { Check, X, Star, Users, Shield, Zap, HeadphonesIcon, Globe, ArrowRight } from 'lucide-react';
import { Card } from '../components/common/Card';

const Pricing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      price: billingPeriod === 'monthly' ? 29 : 290,
      originalPrice: billingPeriod === 'yearly' ? 348 : null,
      features: [
        'Up to 5 users',
        '1,000 contacts',
        'Basic pipeline management',
        'Email integration',
        'Mobile app access',
        'Standard support',
      ],
      limitations: [
        'No advanced analytics',
        'No custom fields',
        'No API access',
      ],
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'Professional',
      description: 'Advanced features for growing businesses',
      price: billingPeriod === 'monthly' ? 79 : 790,
      originalPrice: billingPeriod === 'yearly' ? 948 : null,
      features: [
        'Up to 25 users',
        'Unlimited contacts',
        'Advanced pipeline management',
        'Email & calendar integration',
        'Advanced analytics & reporting',
        'Custom fields & workflows',
        'API access',
        'Priority support',
        'Team collaboration tools',
      ],
      limitations: [
        'No white-label options',
        'No dedicated account manager',
      ],
      popular: true,
      cta: 'Start Free Trial',
    },
    {
      name: 'Enterprise',
      description: 'Complete solution for large organizations',
      price: billingPeriod === 'monthly' ? 149 : 1490,
      originalPrice: billingPeriod === 'yearly' ? 1788 : null,
      features: [
        'Unlimited users',
        'Unlimited contacts',
        'Advanced pipeline management',
        'Full integration suite',
        'Advanced analytics & reporting',
        'Custom fields & workflows',
        'Full API access',
        'White-label options',
        'Dedicated account manager',
        'Custom onboarding',
        'SLA guarantee',
        '24/7 phone support',
      ],
      limitations: [],
      popular: false,
      cta: 'Contact Sales',
    },
  ];

  const features = [
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with real-time updates and shared pipelines.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with SOC 2 compliance and data encryption.',
    },
    {
      icon: Zap,
      title: 'AI-Powered Insights',
      description: 'Get intelligent recommendations and automated workflow suggestions.',
    },
    {
      icon: Globe,
      title: 'Global Accessibility',
      description: 'Access your CRM anywhere with mobile apps and offline capabilities.',
    },
  ];

  const faqs = [
    {
      question: 'Can I change plans at any time?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.',
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes, we offer a 14-day free trial for all plans. No credit card required to start.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.',
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Absolutely. You can cancel your subscription at any time with no cancellation fees.',
    },
    {
      question: 'Do you offer custom enterprise solutions?',
      answer: 'Yes, we work with enterprise clients to create custom solutions that fit their specific needs.',
    },
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    const savings = monthlyCost - yearlyPrice;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900/20 to-accent/20 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-dark-400 mb-8 max-w-3xl mx-auto">
            Choose the perfect plan for your team. Start with a free trial and scale as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-white' : 'text-dark-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingPeriod === 'yearly' ? 'bg-accent' : 'bg-dark-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-white' : 'text-dark-400'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                Save up to 17%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const savings = plan.originalPrice ? calculateSavings(plan.price * 12 / (billingPeriod === 'yearly' ? 10 : 12), plan.price) : null;
            
            return (
              <Card
                key={plan.name}
                className={`relative p-8 ${
                  plan.popular
                    ? 'border-accent shadow-xl scale-105 bg-gradient-to-b from-accent/5 to-purple-500/5'
                    : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-accent text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-dark-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-white">{formatPrice(plan.price)}</span>
                      {plan.price > 0 && (
                        <span className="text-dark-400 ml-2">
                          /{billingPeriod === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {plan.originalPrice && billingPeriod === 'yearly' && (
                      <div className="mt-2">
                        <span className="text-dark-500 line-through text-lg">
                          {formatPrice(plan.originalPrice)}
                        </span>
                        <span className="text-green-400 ml-2 text-sm font-medium">
                          Save {formatPrice(plan.originalPrice - plan.price)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-accent hover:bg-accent/80 text-white'
                        : 'bg-dark-200 hover:bg-dark-300 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center space-x-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-dark-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-3">Not included:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <li key={limitationIndex} className="flex items-center space-x-3">
                            <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <span className="text-dark-400 text-sm">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose SaleToru?</h2>
          <p className="text-xl text-dark-400 max-w-3xl mx-auto">
            Built for modern sales teams who demand more from their CRM
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center" hover>
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-dark-400 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-surface py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-dark-400">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-dark-400">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-accent to-purple-500 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of sales teams who trust SaleToru to close more deals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-accent px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2">
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white hover:text-accent transition-colors flex items-center justify-center space-x-2">
              <HeadphonesIcon className="w-4 h-4" />
              <span>Talk to Sales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;