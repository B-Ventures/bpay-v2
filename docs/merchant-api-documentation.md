# bpay Merchant API v1.0 - Complete Integration Guide

## Overview

The bpay Merchant API enables businesses to accept split payments from customers using multiple funding sources. Our API follows REST principles and fintech industry standards, making integration seamless across any platform.

### Key Benefits
- **Smart Payment Splitting**: Automatically split payments across multiple funding sources
- **bcard Generation**: Virtual cards created instantly for secure transactions  
- **Universal Integration**: Works with any e-commerce platform or custom application
- **Real-time Processing**: Instant payment confirmation and settlement
- **Comprehensive Webhooks**: Real-time notifications for all payment events

## Authentication

All API requests require authentication using your secret API key in the Authorization header:

```bash
Authorization: Bearer sk_test_your_secret_key_here
```

### API Keys
- **Test Mode**: `sk_test_...` for sandbox environment
- **Live Mode**: `sk_live_...` for production environment
- **Public Key**: `pk_test_...` or `pk_live_...` for client-side operations

## Base URLs

- **Sandbox**: `https://api-sandbox.bpay.com/api/v1`
- **Production**: `https://api.bpay.com/api/v1`

## Rate Limits

- **100 requests per minute** per merchant account
- **20 burst requests** for peak usage
- Rate limit headers included in all responses

## Core Payment Flow

### 1. Create Payment Intent
```bash
POST /api/v1/payment_intents
```

**Request Body:**
```json
{
  "amount": 99.99,
  "currency": "USD",
  "metadata": {
    "order_id": "order_123",
    "customer_id": "cust_456"
  },
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "split_configuration": {
    "auto_split": true,
    "split_strategy": "smart"
  },
  "return_url": "https://yoursite.com/success",
  "webhook_url": "https://yoursite.com/webhooks/bpay"
}
```

**Response:**
```json
{
  "id": "pi_1234567890abcdef1234567890",
  "object": "payment_intent",
  "amount": 99.99,
  "currency": "USD",
  "status": "requires_payment_method",
  "client_secret": "pi_1234567890abcdef1234567890_secret_abc123",
  "metadata": {
    "order_id": "order_123",
    "customer_id": "cust_456"
  },
  "created": 1642781234,
  "livemode": false
}
```

### 2. Confirm Payment Intent
```bash
POST /api/v1/payment_intents/{INTENT_ID}/confirm
```

**Request Body:**
```json
{
  "payment_method": {
    "type": "bcard",
    "bcard": {
      "funding_sources": [
        {
          "id": 1,
          "amount": 60.00,
          "percentage": 60
        },
        {
          "id": 2,
          "amount": 39.99,
          "percentage": 40
        }
      ],
      "split_strategy": "percentage"
    }
  }
}
```

**Response:**
```json
{
  "id": "pi_1234567890abcdef1234567890",
  "object": "payment_intent",
  "amount": 99.99,
  "currency": "USD",
  "status": "processing",
  "payment_method": {
    "type": "bcard",
    "bcard": {
      "funding_sources": [...],
      "split_strategy": "percentage"
    }
  },
  "created": 1642781234,
  "livemode": false
}
```

### 3. Retrieve Payment Intent
```bash
GET /api/v1/payment_intents/{INTENT_ID}
```

## API Endpoints Reference

### Payment Intents

#### Create Payment Intent
- **Endpoint**: `POST /api/v1/payment_intents`
- **Purpose**: Initialize a new payment that customers can split across funding sources
- **Use Case**: Start checkout process, create payment session

#### Confirm Payment Intent  
- **Endpoint**: `POST /api/v1/payment_intents/{id}/confirm`
- **Purpose**: Process the payment with selected bcard configuration
- **Use Case**: Complete payment after customer selects funding sources

#### Retrieve Payment Intent
- **Endpoint**: `GET /api/v1/payment_intents/{id}`
- **Purpose**: Get current status and details of a payment intent
- **Use Case**: Check payment status, display transaction details

#### List Payment Intents
- **Endpoint**: `GET /api/v1/payment_intents`
- **Purpose**: Retrieve all payment intents for your merchant account
- **Use Case**: Transaction history, reporting, reconciliation

### Merchant Information

#### Get Merchant Details
```bash
GET /api/v1/merchant
```

**Response:**
```json
{
  "id": 123,
  "business_name": "Your Business Name",
  "business_email": "business@example.com",
  "website": "https://yourwebsite.com",
  "environment": "sandbox",
  "platform_type": "shopify",
  "total_volume": 12500.00,
  "allowed_domains": ["yourwebsite.com", "checkout.yoursite.com"],
  "is_active": true,
  "created": 1642781234
}
```

#### Get API Usage Statistics
```bash
GET /api/v1/merchant/usage?date=2024-01-15
```

**Response:**
```json
{
  "total_requests": 1250,
  "date": "2024-01-15",
  "endpoints": {
    "/api/v1/payment_intents": 800,
    "/api/v1/payment_intents/{id}/confirm": 400,
    "/api/v1/merchant": 50
  }
}
```

### Webhook Events

#### List Events
```bash
GET /api/v1/events
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": 1,
      "object": "event",
      "type": "payment_intent.succeeded",
      "data": {
        "id": "pi_1234567890abcdef1234567890",
        "amount": 99.99,
        "status": "succeeded"
      },
      "created": 1642781234,
      "livemode": false
    }
  ],
  "has_more": false,
  "url": "/api/v1/events"
}
```

### System Endpoints

#### Health Check
```bash
GET /api/v1/health
```

#### API Information
```bash
GET /api/v1
```

## Webhook Events

bpay sends webhooks to notify your application about payment events in real-time.

### Event Types

- `payment_intent.created` - Payment intent was created
- `payment_intent.processing` - Payment is being processed
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.failed` - Payment failed
- `payment_intent.canceled` - Payment was canceled

### Webhook Payload Example
```json
{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded", 
  "data": {
    "id": "pi_1234567890abcdef1234567890",
    "object": "payment_intent",
    "amount": 99.99,
    "currency": "USD",
    "status": "succeeded",
    "metadata": {
      "order_id": "order_123"
    },
    "created": 1642781234
  },
  "created": 1642781234,
  "livemode": false
}
```

### Webhook Security
Verify webhook signatures using your webhook secret:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
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

## Error Handling

### Error Response Format
```json
{
  "error": "invalid_request",
  "message": "The amount parameter is required",
  "details": {
    "field": "amount",
    "code": "missing_required_parameter"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `unauthorized` | Invalid API key or inactive merchant |
| `invalid_request` | Malformed request or missing parameters |
| `rate_limit_exceeded` | Too many requests |
| `insufficient_funds` | Customer funding sources insufficient |
| `resource_missing` | Payment intent not found |
| `internal_error` | Server error, contact support |

## Platform-Specific Integration Guides

### WordPress/WooCommerce Integration

#### Step 1: Install bpay Plugin
```bash
# Download from WordPress Plugin Directory
# Or upload plugin files to wp-content/plugins/bpay
```

#### Step 2: Configure API Keys
```php
// In wp-config.php or plugin settings
define('BPAY_SECRET_KEY', 'sk_test_your_key_here');
define('BPAY_PUBLIC_KEY', 'pk_test_your_key_here');
```

#### Step 3: Add Payment Method
```php
// functions.php
add_filter('woocommerce_payment_gateways', 'add_bpay_gateway');

function add_bpay_gateway($gateways) {
    $gateways[] = 'WC_Gateway_bpay';
    return $gateways;
}
```

### Shopify Integration

#### Step 1: Create Private App
```bash
# In Shopify Admin > Apps > Private Apps
# Enable Payment Gateway API access
```

#### Step 2: Install bpay App
```javascript
// Use Shopify CLI
shopify app generate webhook
```

#### Step 3: Configure Checkout
```liquid
<!-- In checkout.liquid -->
<script src="https://js.bpay.com/v1/"></script>
<script>
const bpay = bpay('pk_test_your_public_key');
const elements = bpay.elements();
</script>
```

### Custom E-commerce Integration

#### Frontend Integration
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://js.bpay.com/v1/"></script>
</head>
<body>
    <div id="bpay-payment-element"></div>
    
    <script>
        const bpay = bpay('pk_test_your_public_key');
        
        // Create payment intent
        fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 99.99,
                currency: 'USD'
            })
        })
        .then(res => res.json())
        .then(data => {
            // Mount bpay elements
            const elements = bpay.elements({
                clientSecret: data.client_secret
            });
            
            const paymentElement = elements.create('payment');
            paymentElement.mount('#bpay-payment-element');
        });
    </script>
</body>
</html>
```

#### Backend Integration (Node.js)
```javascript
const express = require('express');
const axios = require('axios');

const app = express();

app.post('/create-payment-intent', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api-sandbox.bpay.com/api/v1/payment_intents',
            {
                amount: req.body.amount,
                currency: req.body.currency,
                metadata: {
                    order_id: req.body.order_id
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.BPAY_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({
            client_secret: response.data.client_secret
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/webhooks/bpay', (req, res) => {
    const signature = req.headers['bpay-signature'];
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature
    if (verifyWebhook(payload, signature, process.env.BPAY_WEBHOOK_SECRET)) {
        const event = req.body;
        
        switch (event.type) {
            case 'payment_intent.succeeded':
                // Update order status
                console.log('Payment succeeded:', event.data.id);
                break;
            case 'payment_intent.failed':
                // Handle payment failure
                console.log('Payment failed:', event.data.id);
                break;
        }
        
        res.json({ received: true });
    } else {
        res.status(400).send('Invalid signature');
    }
});
```

### Mobile App Integration (React Native)

```javascript
import { bpay } from '@bpay/react-native';

const PaymentScreen = () => {
    const [clientSecret, setClientSecret] = useState('');
    
    const handlePayment = async () => {
        // Initialize bpay
        await bpay.initialize('pk_test_your_public_key');
        
        // Confirm payment
        const { paymentIntent, error } = await bpay.confirmPayment(
            clientSecret,
            {
                paymentMethodType: 'bcard',
                fundingSources: [
                    { id: 1, percentage: 60 },
                    { id: 2, percentage: 40 }
                ]
            }
        );
        
        if (error) {
            console.error('Payment failed:', error);
        } else {
            console.log('Payment succeeded:', paymentIntent);
        }
    };
    
    return (
        <View>
            <Button title="Pay with bpay" onPress={handlePayment} />
        </View>
    );
};
```

## Testing & Development

### Test API Keys
Use these test API keys in sandbox mode:
- **Secret**: `sk_test_4eC39HqLyjWDarjtT1zdp7dc`
- **Public**: `pk_test_TYooMQauvdEDq54NiTphI7jx`

### Test Scenarios

#### Successful Payment
```json
{
  "amount": 100.00,
  "payment_method": {
    "type": "bcard",
    "bcard": {
      "funding_sources": [
        { "id": 1, "percentage": 100 }
      ]
    }
  }
}
```

#### Insufficient Funds
```json
{
  "amount": 1000.00,
  "payment_method": {
    "type": "bcard", 
    "bcard": {
      "funding_sources": [
        { "id": 1, "percentage": 100 }
      ]
    }
  }
}
```

## SDKs & Libraries

### Official SDKs
- **Node.js**: `npm install @bpay/node`
- **Python**: `pip install bpay`
- **PHP**: `composer require bpay/bpay-php`
- **Ruby**: `gem install bpay`
- **Java**: Maven dependency available

### Community SDKs
- **Go**: `go get github.com/bpay/bpay-go`
- **C#**: NuGet package available
- **Swift**: CocoaPods integration

## Best Practices

### Security
1. **Never expose secret keys** in frontend code
2. **Validate webhooks** using signature verification
3. **Use HTTPS** for all API communications
4. **Implement idempotency** for payment operations

### Performance
1. **Cache API responses** where appropriate
2. **Implement retry logic** with exponential backoff
3. **Use batch operations** for bulk transactions
4. **Monitor rate limits** and implement queuing

### User Experience
1. **Show split preview** before payment confirmation
2. **Provide real-time status** updates
3. **Handle errors gracefully** with clear messaging
4. **Optimize mobile** checkout experience

## Support & Resources

- **API Reference**: https://docs.bpay.com/api
- **Developer Portal**: https://developers.bpay.com
- **Status Page**: https://status.bpay.com
- **Support**: support@bpay.com
- **Community**: https://community.bpay.com

## Changelog

### v1.0.0 (2024-01-15)
- Initial release of Merchant API
- Payment Intent creation and confirmation
- Webhook event system
- Platform-specific integration guides
- Comprehensive error handling
- Rate limiting implementation