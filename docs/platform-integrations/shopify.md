# bpay Shopify Integration Guide

## Overview
Integrate bpay split payments into your Shopify store using our official Shopify App or custom implementation. Enable customers to pay using multiple funding sources with seamless checkout experience.

## Prerequisites
- Shopify store (any plan)
- Shopify Partner account (for custom apps)
- bpay merchant account
- SSL enabled (required)

## Integration Methods

### Method 1: Official Shopify App (Recommended)

#### Installation
1. **Install from Shopify App Store**
   ```
   Visit: https://apps.shopify.com/bpay-split-payments
   Click "Add app" and follow installation steps
   ```

2. **Configure API Keys**
   - Go to `Apps > bpay Split Payments > Settings`
   - Enter your API credentials:
     - **Test Secret Key**: `sk_test_...`
     - **Test Public Key**: `pk_test_...` 
     - **Live Secret Key**: `sk_live_...`
     - **Live Public Key**: `pk_live_...`

3. **Enable Payment Method**
   - Navigate to `Settings > Payments`
   - In "Supported payment methods" section
   - Find "bpay Split Payments" and click "Activate"

#### App Configuration
```json
{
  "payment_method_name": "Split Payment with bpay",
  "payment_description": "Pay using multiple cards and funding sources",
  "enable_express_checkout": true,
  "show_funding_sources": true,
  "auto_split_enabled": true,
  "split_strategy": "smart",
  "webhook_endpoints": [
    "payment_intent.succeeded",
    "payment_intent.failed"
  ]
}
```

### Method 2: Custom Private App

#### Step 1: Create Private App
1. **Enable Private App Development**
   ```
   Shopify Admin > Apps > Develop Apps > Allow custom app development
   ```

2. **Create New Private App**
   ```
   Click "Create an app" > Enter app name "bpay Integration"
   ```

3. **Configure Scopes**
   ```
   Admin API access scopes needed:
   - read_orders, write_orders
   - read_payments, write_payments  
   - read_checkouts, write_checkouts
   - read_customers
   ```

#### Step 2: Install bpay App
```bash
# Clone bpay Shopify app template
git clone https://github.com/bpay/shopify-app-template
cd shopify-app-template

# Install dependencies  
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys:
# SHOPIFY_API_KEY=your_shopify_api_key
# SHOPIFY_API_SECRET=your_shopify_api_secret
# BPAY_SECRET_KEY=sk_test_your_secret_key
# BPAY_PUBLIC_KEY=pk_test_your_public_key

# Deploy to Shopify
npm run deploy
```

#### Step 3: Create Payment Gateway
```javascript
// app/routes/api/payments.js
import { authenticate } from "../shopify.server";
import bpay from "@bpay/node";

const bpayClient = new bpay(process.env.BPAY_SECRET_KEY);

export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  
  if (request.method === "POST") {
    const { amount, currency, order_id } = await request.json();
    
    try {
      // Create bpay payment intent
      const paymentIntent = await bpayClient.paymentIntents.create({
        amount: parseFloat(amount),
        currency: currency,
        metadata: {
          shopify_order_id: order_id,
          shop_domain: session.shop
        }
      });
      
      return json({
        success: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id
      });
      
    } catch (error) {
      console.error("Payment intent creation failed:", error);
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }
}
```

#### Step 4: Implement Checkout Extension
```javascript
// extensions/checkout-bpay/src/index.js
import {
  reactExtension,
  useApi,
  useTranslate,
  useSettings,
  Banner,
  BlockStack,
  Button,
  InlineLayout,
  Text,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension(
  'purchase.checkout.payment-method-list.render-after',
  () => <Extension />
);

function Extension() {
  const { extension, cost, shop } = useApi();
  const translate = useTranslate();
  const settings = useSettings();
  
  const showbpayOption = settings.enable_bpay_checkout && cost.totalAmount.amount > 0;
  
  if (!showbpayOption) return null;
  
  return (
    <BlockStack border="base" cornerRadius="base" padding="base">
      <InlineLayout
        spacing="base"
        columns={['auto', 'fill']}
        blockAlignment="center"
      >
        <img 
          src="https://assets.bpay.com/logos/bpay-icon.svg" 
          alt="bpay"
          width="24"
          height="24"
        />
        <BlockStack spacing="extraTight">
          <Text size="medium" emphasis="strong">
            Split Payment with bpay
          </Text>
          <Text size="small" appearance="subdued">
            Pay using multiple cards and funding sources
          </Text>
        </BlockStack>
      </InlineLayout>
      
      <Button
        kind="secondary"
        accessibilityLabel="Pay with bpay"
        onPress={() => redirectTobpayCheckout()}
      >
        Choose Payment Sources
      </Button>
    </BlockStack>
  );
}

async function redirectTobpayCheckout() {
  const { cost, lines } = useApi();
  
  // Create payment intent via app proxy
  const response = await fetch('/apps/bpay/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: cost.totalAmount.amount,
      currency: cost.totalAmount.currencyCode,
      line_items: lines.map(line => ({
        id: line.merchandise.id,
        quantity: line.quantity,
        price: line.cost.totalAmount.amount
      }))
    })
  });
  
  const { client_secret } = await response.json();
  
  // Redirect to bpay-hosted checkout
  window.location.href = `https://checkout.bpay.com/?client_secret=${client_secret}`;
}
```

### Method 3: Liquid Template Integration

#### Step 1: Add bpay.js to Theme
```liquid
<!-- layout/theme.liquid - Add before closing </head> -->
{% if checkout.payment_method contains 'bpay' %}
  <script src="https://js.bpay.com/v1/"></script>
{% endif %}
```

#### Step 2: Create Payment Template
```liquid
<!-- sections/bpay-checkout.liquid -->
<div class="bpay-checkout-section">
  <div class="bpay-header">
    <img src="https://assets.bpay.com/logos/bpay-logo.svg" alt="bpay" class="bpay-logo">
    <h3>Split Your Payment</h3>
    <p>Pay using multiple cards and funding sources</p>
  </div>
  
  <div id="bpay-payment-element">
    <!-- bpay Elements will mount here -->
  </div>
  
  <div class="bpay-benefits">
    <div class="benefit-item">
      <span class="icon">💳</span>
      <span>Use multiple cards</span>
    </div>
    <div class="benefit-item">
      <span class="icon">🎯</span>
      <span>Smart splitting</span>
    </div>
    <div class="benefit-item">
      <span class="icon">🔒</span>
      <span>Secure payments</span>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  if (typeof bpay !== 'undefined') {
    initializebpayCheckout();
  }
});

async function initializebpayCheckout() {
  const bpayInstance = bpay('{{ settings.bpay_public_key }}');
  
  // Get cart total from Shopify
  const cartTotal = {{ cart.total_price | divided_by: 100.0 }};
  const currency = '{{ shop.currency }}';
  
  try {
    // Create payment intent via Shopify app proxy
    const response = await fetch('/apps/bpay-proxy/payment-intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Shop-Domain': '{{ shop.domain }}'
      },
      body: JSON.stringify({
        amount: cartTotal,
        currency: currency,
        cart_token: '{{ cart.token }}',
        line_items: [
          {% for item in cart.items %}
          {
            variant_id: {{ item.variant_id }},
            quantity: {{ item.quantity }},
            price: {{ item.price | divided_by: 100.0 }},
            title: '{{ item.title | escape }}'
          }{% unless forloop.last %},{% endunless %}
          {% endfor %}
        ]
      })
    });
    
    const { client_secret } = await response.json();
    
    // Create bpay elements
    const elements = bpayInstance.elements({
      clientSecret: client_secret,
      appearance: {
        theme: 'flat',
        variables: {
          colorPrimary: '{{ settings.color_primary }}',
          colorBackground: '{{ settings.color_background }}',
          fontFamily: '{{ settings.type_body_font.family }}'
        }
      }
    });
    
    // Mount payment element
    const paymentElement = elements.create('payment');
    paymentElement.mount('#bpay-payment-element');
    
    // Handle payment submission
    const form = document.querySelector('form[action="/cart"]');
    if (form) {
      form.addEventListener('submit', async (e) => {
        if (document.querySelector('#bpay-payment-element').style.display !== 'none') {
          e.preventDefault();
          await handlePaymentSubmission(bpayInstance, elements);
        }
      });
    }
    
  } catch (error) {
    console.error('bpay initialization failed:', error);
  }
}

async function handlePaymentSubmission(bpayInstance, elements) {
  const { error, paymentIntent } = await bpayInstance.confirmPayment({
    elements,
    confirmParams: {
      return_url: `{{ shop.secure_url }}/checkouts/thank-you`
    }
  });
  
  if (error) {
    showError(error.message);
  } else if (paymentIntent.status === 'succeeded') {
    // Redirect to success page
    window.location.href = `{{ shop.secure_url }}/checkouts/thank-you?payment_intent=${paymentIntent.id}`;
  }
}

function showError(message) {
  const errorDiv = document.querySelector('.bpay-error') || 
    document.createElement('div');
  errorDiv.className = 'bpay-error alert alert-error';
  errorDiv.textContent = message;
  
  const paymentElement = document.querySelector('#bpay-payment-element');
  paymentElement.parentNode.insertBefore(errorDiv, paymentElement);
}
</script>

<style>
.bpay-checkout-section {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  background: #fafbfc;
}

.bpay-header {
  text-align: center;
  margin-bottom: 20px;
}

.bpay-logo {
  height: 32px;
  margin-bottom: 8px;
}

.bpay-benefits {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e1e5e9;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.bpay-error {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
```

## Webhook Configuration

### Step 1: Create Webhook Endpoint
```javascript
// Shopify app - app/routes/webhooks.bpay.js
import { authenticate } from "../shopify.server";
import crypto from "crypto";

export async function action({ request }) {
  const payload = await request.text();
  const signature = request.headers.get("bpay-signature");
  
  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature, process.env.BPAY_WEBHOOK_SECRET)) {
    return new Response("Invalid signature", { status: 401 });
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data);
      break;
    case "payment_intent.failed":
      await handlePaymentFailure(event.data);
      break;
  }
  
  return new Response("OK", { status: 200 });
}

async function handlePaymentSuccess(paymentIntent) {
  const { session } = await authenticate.admin(request);
  const orderId = paymentIntent.metadata.shopify_order_id;
  
  if (orderId) {
    // Update Shopify order status
    const order = await session.rest.resources.Order.find({
      session,
      id: orderId
    });
    
    if (order) {
      // Mark order as paid
      await order.save({
        financial_status: "paid",
        note: `bpay payment completed. Payment ID: ${paymentIntent.id}`
      });
      
      // Send order confirmation email
      await session.rest.resources.Order.find({
        session,
        id: orderId
      }).then(order => order.send_receipt());
    }
  }
}

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Step 2: Register Webhook URL
In your bpay merchant dashboard:
```
Webhook URL: https://your-app.ngrok.io/webhooks/bpay
Events: payment_intent.succeeded, payment_intent.failed
```

## Advanced Features

### Custom Checkout Flow
```javascript
// Custom checkout with bpay Elements
async function createCustomCheckout() {
  const bpayInstance = bpay(publicKey);
  
  // Get cart data from Shopify
  const cart = await fetch('/cart.js').then(r => r.json());
  
  // Create payment intent
  const paymentIntent = await createPaymentIntent({
    amount: cart.total_price / 100,
    currency: cart.currency,
    line_items: cart.items.map(item => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price / 100,
      title: item.title
    }))
  });
  
  // Create checkout form
  const elements = bpayInstance.elements({
    clientSecret: paymentIntent.client_secret,
    appearance: {
      theme: 'flat',
      variables: {
        colorPrimary: getComputedStyle(document.documentElement)
          .getPropertyValue('--color-primary'),
      }
    }
  });
  
  const paymentElement = elements.create('payment', {
    layout: {
      type: 'accordion',
      defaultCollapsed: false,
      radios: true
    }
  });
  
  paymentElement.mount('#payment-element');
  
  // Handle form submission
  document.querySelector('#submit-payment').addEventListener('click', async () => {
    const { error, paymentIntent } = await bpayInstance.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/thank-you`
      }
    });
    
    if (error) {
      console.error('Payment failed:', error);
    } else {
      console.log('Payment succeeded:', paymentIntent);
    }
  });
}
```

### Multi-Currency Support
```javascript
// Handle multiple currencies
const currencyConfig = {
  'USD': { min_amount: 0.50, max_amount: 999999 },
  'EUR': { min_amount: 0.50, max_amount: 999999 },
  'GBP': { min_amount: 0.30, max_amount: 999999 },
  'CAD': { min_amount: 0.50, max_amount: 999999 }
};

function validateAmount(amount, currency) {
  const config = currencyConfig[currency];
  if (!config) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  
  if (amount < config.min_amount || amount > config.max_amount) {
    throw new Error(`Amount must be between ${config.min_amount} and ${config.max_amount} ${currency}`);
  }
  
  return true;
}
```

## Testing

### Test Environment Setup
```javascript
// Use Shopify development store
const testConfig = {
  shopify_domain: 'your-dev-store.myshopify.com',
  bpay_public_key: 'pk_test_...',
  bpay_secret_key: 'sk_test_...',
  webhook_url: 'https://your-ngrok-url.ngrok.io/webhooks/bpay'
};

// Test scenarios
const testScenarios = [
  {
    name: 'Successful payment',
    amount: 100.00,
    currency: 'USD',
    expected_status: 'succeeded'
  },
  {
    name: 'Insufficient funds',
    amount: 10000.00,
    currency: 'USD',
    expected_status: 'failed'
  }
];
```

### Debug Mode
```javascript
// Enable debug logging
if (window.location.hostname.includes('myshopify.com')) {
  window.bpayDebug = true;
  
  // Log all bpay events
  document.addEventListener('bpay_event', (e) => {
    console.log('bpay Event:', e.detail);
  });
}
```

## Troubleshooting

### Common Issues

1. **App installation fails**
   - Check Partner account permissions
   - Verify app configuration in Partner Dashboard
   - Review API scopes

2. **Payments not processing**
   - Verify API keys are correct
   - Check webhook endpoint accessibility
   - Review payment intent status

3. **Checkout not loading**
   - Ensure bpay.js is loading correctly
   - Check browser console for errors
   - Verify public key configuration

### Debug Tools
```javascript
// Shopify app debug helper
function debugbpayIntegration() {
  console.log('Shopify Store:', Shopify.shop);
  console.log('Cart Total:', Shopify.cart.total_price);
  console.log('bpay Public Key:', window.bpayPublicKey);
  console.log('Current URL:', window.location.href);
  
  // Test API connectivity
  fetch('/apps/bpay/health')
    .then(r => r.json())
    .then(data => console.log('App Health:', data))
    .catch(err => console.error('App Health Check Failed:', err));
}
```

## Support Resources

- **Shopify Partner Documentation**: https://partners.shopify.com
- **bpay Shopify Guide**: https://docs.bpay.com/shopify
- **Support**: shopify-support@bpay.com
- **Community**: https://community.bpay.com/shopify