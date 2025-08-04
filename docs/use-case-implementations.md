# bpay Use Case Implementations Guide

## Overview
This guide provides specific implementations for common merchant integration scenarios using the bpay API system.

## Use Case 1: E-commerce Checkout Integration

### Scenario
Online store wants to offer split payments during checkout

### Implementation
```javascript
// Frontend - Create payment intent when user clicks "Pay with bpay"
async function initiatebpayCheckout(orderTotal, orderData) {
  const response = await fetch('/api/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_your_secret_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: orderTotal,
      currency: 'USD',
      metadata: {
        order_id: orderData.id,
        customer_email: orderData.email
      },
      customer: {
        email: orderData.email,
        name: orderData.customerName
      }
    })
  });
  
  const paymentIntent = await response.json();
  return paymentIntent.client_secret;
}

// Frontend - Confirm payment with bcard
async function confirmbpayPayment(clientSecret, selectedSources) {
  const bpayInstance = bpay('pk_test_your_public_key');
  
  const { error, paymentIntent } = await bpayInstance.confirmPayment({
    clientSecret,
    paymentMethod: {
      type: 'bcard',
      bcard: {
        funding_sources: selectedSources,
        split_strategy: 'percentage'
      }
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return paymentIntent;
}
```

### Webhook Handler
```javascript
// Backend - Handle payment completion
app.post('/webhooks/bpay', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['bpay-signature'];
  const payload = req.body;
  
  // Verify webhook signature
  const isValid = verifyWebhookSignature(payload, sig, process.env.BPAY_WEBHOOK_SECRET);
  if (!isValid) {
    return res.status(400).send('Invalid signature');
  }
  
  const event = JSON.parse(payload);
  
  if (event.type === 'payment_intent.succeeded') {
    const orderId = event.data.metadata.order_id;
    // Update order status to completed
    updateOrderStatus(orderId, 'completed');
    // Send confirmation email
    sendOrderConfirmation(orderId);
  }
  
  res.json({received: true});
});
```

## Use Case 2: Subscription Service with Split Billing

### Scenario
SaaS platform wants to allow customers to split recurring payments

### Implementation
```javascript
// Create subscription with split configuration
async function createSubscriptionWithSplit(customerId, planAmount, splitConfig) {
  // Create initial payment intent for setup
  const setupIntent = await fetch('/api/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_your_secret_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: planAmount,
      currency: 'USD',
      metadata: {
        customer_id: customerId,
        subscription_setup: true
      },
      split_configuration: splitConfig
    })
  });
  
  const intent = await setupIntent.json();
  
  // Store split configuration for future billing cycles
  await saveCustomerSplitPreferences(customerId, splitConfig);
  
  return intent;
}

// Process monthly billing
async function processMonthlyBilling(customerId, amount) {
  const splitConfig = await getCustomerSplitPreferences(customerId);
  
  const paymentIntent = await fetch('/api/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_your_secret_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'USD',
      metadata: {
        customer_id: customerId,
        billing_cycle: new Date().toISOString()
      },
      split_configuration: splitConfig
    })
  });
  
  return paymentIntent.json();
}
```

## Use Case 3: Marketplace with Multi-Party Splits

### Scenario
Marketplace platform needs to split payments between sellers and platform

### Implementation
```javascript
// Create marketplace payment with seller splits
async function createMarketplacePayment(order) {
  const platformFee = order.total * 0.15; // 15% platform fee
  const sellerAmount = order.total - platformFee;
  
  const paymentIntent = await fetch('/api/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_test_your_secret_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: order.total,
      currency: 'USD',
      metadata: {
        marketplace_order: order.id,
        seller_id: order.sellerId,
        buyer_id: order.buyerId
      },
      split_configuration: {
        marketplace_splits: [
          {
            account: order.sellerId,
            amount: sellerAmount,
            description: 'Seller payout'
          },
          {
            account: 'platform_account',
            amount: platformFee,
            description: 'Platform fee'
          }
        ]
      }
    })
  });
  
  return paymentIntent.json();
}

// Handle marketplace webhook events
app.post('/webhooks/marketplace', (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    const splits = event.data.split_configuration.marketplace_splits;
    
    // Process payouts to sellers
    splits.forEach(async (split) => {
      if (split.account !== 'platform_account') {
        await processSaSellerPayout(split.account, split.amount);
        await notifySeller(split.account, split.amount);
      }
    });
    
    // Update marketplace order status
    const orderId = event.data.metadata.marketplace_order;
    await updateMarketplaceOrder(orderId, 'completed');
  }
  
  res.json({received: true});
});
```

## Use Case 4: Point of Sale (POS) Integration

### Scenario
Physical store wants to accept split payments at checkout

### Implementation
```javascript
// POS Terminal Integration
class bpayPOSIntegration {
  constructor(apiKey, terminalId) {
    this.apiKey = apiKey;
    this.terminalId = terminalId;
  }
  
  async processInStorePurchase(amount, items) {
    // Create payment intent for in-store purchase
    const paymentIntent = await fetch('/api/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'USD',
        metadata: {
          terminal_id: this.terminalId,
          transaction_type: 'in_store',
          items: JSON.stringify(items)
        },
        split_configuration: {
          auto_split: true,
          split_strategy: 'smart'
        }
      })
    });
    
    const intent = await paymentIntent.json();
    
    // Display QR code for customer to scan with bpay app
    this.displayQRCode(intent.client_secret);
    
    return intent;
  }
  
  displayQRCode(clientSecret) {
    const qrData = {
      payment_intent: clientSecret,
      merchant_name: 'Your Store Name',
      amount: this.currentAmount
    };
    
    // Generate QR code for customer mobile app
    this.terminal.showQRCode(JSON.stringify(qrData));
  }
  
  async pollPaymentStatus(paymentIntentId) {
    const response = await fetch(`/api/v1/payment_intents/${paymentIntentId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
    
    const intent = await response.json();
    return intent.status;
  }
}
```

## Use Case 5: Mobile App Integration

### Scenario
Mobile app wants native split payment functionality

### Implementation (React Native)
```javascript
import { bpaySDK } from '@bpay/react-native';

// Initialize bpay SDK
const bpayClient = new bpaySDK({
  publicKey: 'pk_test_your_public_key',
  environment: 'sandbox'
});

// Create payment flow
export const PaymentScreen = ({ route }) => {
  const { orderTotal, orderData } = route.params;
  const [paymentStatus, setPaymentStatus] = useState('idle');
  
  const handlePayment = async () => {
    try {
      setPaymentStatus('creating');
      
      // Create payment intent via your backend
      const response = await fetch('https://yourapi.com/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: orderTotal,
          metadata: orderData
        })
      });
      
      const { client_secret } = await response.json();
      
      setPaymentStatus('processing');
      
      // Show bpay payment sheet
      const { paymentIntent, error } = await bpayClient.presentPaymentSheet({
        clientSecret: client_secret,
        merchantDisplayName: 'Your App Name',
        customFlow: false
      });
      
      if (error) {
        setPaymentStatus('failed');
        Alert.alert('Payment Error', error.message);
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('succeeded');
        navigation.navigate('PaymentSuccess', { paymentIntent });
      }
      
    } catch (error) {
      setPaymentStatus('failed');
      Alert.alert('Error', 'Payment initialization failed');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.amount}>${orderTotal}</Text>
      <Button
        title="Pay with bpay"
        onPress={handlePayment}
        disabled={paymentStatus !== 'idle'}
      />
      {paymentStatus === 'processing' && <ActivityIndicator />}
    </View>
  );
};
```

## Use Case 6: Donation Platform

### Scenario
Charity platform wants to allow donors to split donations across multiple payment methods

### Implementation
```javascript
// Donation form with split payment
const DonationForm = () => {
  const [donationAmount, setDonationAmount] = useState(0);
  const [donorInfo, setDonorInfo] = useState({});
  const [fundingSources, setFundingSources] = useState([]);
  
  const handleDonation = async () => {
    const paymentIntent = await fetch('/api/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk_test_your_secret_key',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: donationAmount,
        currency: 'USD',
        metadata: {
          donation_type: 'one_time',
          donor_email: donorInfo.email,
          campaign_id: 'holiday_2024',
          tax_deductible: true
        },
        customer: {
          email: donorInfo.email,
          name: donorInfo.name,
          phone: donorInfo.phone
        },
        split_configuration: {
          funding_sources: fundingSources,
          split_strategy: 'percentage'
        }
      })
    });
    
    const intent = await paymentIntent.json();
    
    // Redirect to payment confirmation
    window.location.href = `/donate/confirm?client_secret=${intent.client_secret}`;
  };
  
  return (
    <form onSubmit={handleDonation}>
      <input
        type="number"
        value={donationAmount}
        onChange={(e) => setDonationAmount(e.target.value)}
        placeholder="Donation amount"
      />
      <FundingSourceSelector
        sources={fundingSources}
        onChange={setFundingSources}
        totalAmount={donationAmount}
      />
      <button type="submit">Complete Donation</button>
    </form>
  );
};

// Webhook handler for donation processing
app.post('/webhooks/donations', (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    const donationData = {
      amount: event.data.amount,
      donor_email: event.data.metadata.donor_email,
      campaign_id: event.data.metadata.campaign_id,
      payment_intent_id: event.data.id,
      tax_deductible: event.data.metadata.tax_deductible
    };
    
    // Record donation in database
    recordDonation(donationData);
    
    // Send thank you email with tax receipt
    sendDonationReceipt(donationData);
    
    // Update campaign progress
    updateCampaignProgress(donationData.campaign_id, donationData.amount);
  }
  
  res.json({received: true});
});
```

## Common Integration Patterns

### Error Handling
```javascript
function handlePaymentError(error) {
  const errorMessages = {
    'insufficient_funds': 'Your funding sources don\'t have enough available balance.',
    'invalid_request': 'Please check your payment information and try again.',
    'rate_limit_exceeded': 'Too many requests. Please wait a moment and try again.',
    'authentication_error': 'Invalid API credentials.',
    'network_error': 'Connection problem. Please check your internet and try again.'
  };
  
  return errorMessages[error.code] || 'An unexpected error occurred. Please try again.';
}
```

### Webhook Verification
```javascript
function verifyWebhookSignature(payload, signature, secret) {
  const crypto = require('crypto');
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Rate Limiting Handling
```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after') || Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

## Testing Strategies

### Unit Testing
```javascript
describe('bpay Payment Integration', () => {
  test('creates payment intent successfully', async () => {
    const paymentData = {
      amount: 100.00,
      currency: 'USD',
      metadata: { order_id: 'test_order' }
    };
    
    const mockResponse = {
      id: 'pi_test_12345',
      client_secret: 'pi_test_12345_secret_abc',
      status: 'requires_payment_method'
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    
    const result = await createPaymentIntent(paymentData);
    expect(result.id).toBe('pi_test_12345');
  });
});
```

### Integration Testing
```javascript
describe('End-to-End Payment Flow', () => {
  test('completes payment successfully', async () => {
    // Create payment intent
    const intent = await createPaymentIntent(testPaymentData);
    
    // Simulate customer funding source selection
    const fundingSources = [
      { id: 1, percentage: 60 },
      { id: 2, percentage: 40 }
    ];
    
    // Confirm payment
    const result = await confirmPayment(intent.client_secret, fundingSources);
    
    expect(result.status).toBe('succeeded');
  });
});
```

This guide provides practical implementations for the most common merchant integration scenarios with the bpay API system.