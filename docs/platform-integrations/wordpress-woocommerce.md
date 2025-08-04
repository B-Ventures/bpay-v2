# bpay WordPress/WooCommerce Integration Guide

## Overview
This guide helps you integrate bpay split payments into your WordPress/WooCommerce store, allowing customers to pay using multiple funding sources and bcards.

## Prerequisites
- WordPress 5.8 or higher
- WooCommerce 6.0 or higher  
- PHP 7.4 or higher
- SSL certificate (required for payment processing)

## Installation Methods

### Method 1: WordPress Plugin (Recommended)

1. **Download the Plugin**
   ```bash
   # Download from WordPress.org or bpay developer portal
   wget https://downloads.bpay.com/wordpress/bpay-woocommerce.zip
   ```

2. **Install via WordPress Admin**
   - Go to `Plugins > Add New > Upload Plugin`
   - Select `bpay-woocommerce.zip`
   - Click `Install Now` and `Activate`

3. **Configure API Keys**
   - Navigate to `WooCommerce > Settings > Payments > bpay`
   - Enter your API keys:
     - **Test Secret Key**: `sk_test_...`
     - **Test Public Key**: `pk_test_...`
     - **Live Secret Key**: `sk_live_...` (for production)
     - **Live Public Key**: `pk_live_...` (for production)

### Method 2: Manual Installation

1. **Add to functions.php**
   ```php
   <?php
   // Add bpay payment gateway
   add_action('plugins_loaded', 'init_bpay_gateway');
   
   function init_bpay_gateway() {
       if (!class_exists('WC_Payment_Gateway')) return;
       
       class WC_Gateway_bpay extends WC_Payment_Gateway {
           public function __construct() {
               $this->id = 'bpay';
               $this->icon = 'https://assets.bpay.com/logos/bpay-icon.svg';
               $this->has_fields = true;
               $this->method_title = 'bpay Split Payments';
               $this->method_description = 'Accept split payments using bcards and multiple funding sources';
               
               $this->init_form_fields();
               $this->init_settings();
               
               $this->title = $this->get_option('title');
               $this->description = $this->get_option('description');
               $this->secret_key = $this->get_option('secret_key');
               $this->public_key = $this->get_option('public_key');
               $this->testmode = 'yes' === $this->get_option('testmode');
               
               add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
               add_action('wp_enqueue_scripts', array($this, 'payment_scripts'));
           }
           
           public function init_form_fields() {
               $this->form_fields = array(
                   'enabled' => array(
                       'title' => 'Enable/Disable',
                       'type' => 'checkbox',
                       'label' => 'Enable bpay Payment Gateway',
                       'default' => 'yes'
                   ),
                   'title' => array(
                       'title' => 'Title',
                       'type' => 'text',
                       'description' => 'Payment method title customers see during checkout',
                       'default' => 'Split Payment with bpay',
                       'desc_tip' => true
                   ),
                   'description' => array(
                       'title' => 'Description',
                       'type' => 'textarea',
                       'description' => 'Payment method description customers see during checkout',
                       'default' => 'Pay using multiple cards and funding sources with smart splitting',
                   ),
                   'testmode' => array(
                       'title' => 'Test Mode',
                       'type' => 'checkbox',
                       'label' => 'Enable Test Mode',
                       'default' => 'yes',
                       'description' => 'Use test API keys for development'
                   ),
                   'secret_key' => array(
                       'title' => 'Secret Key',
                       'type' => 'text',
                       'description' => 'Your bpay secret API key (sk_test_... or sk_live_...)'
                   ),
                   'public_key' => array(
                       'title' => 'Public Key', 
                       'type' => 'text',
                       'description' => 'Your bpay public API key (pk_test_... or pk_live_...)'
                   )
               );
           }
           
           public function payment_scripts() {
               if (!is_cart() && !is_checkout() && !isset($_GET['pay_for_order'])) {
                   return;
               }
               
               if ('no' === $this->enabled) {
                   return;
               }
               
               if (empty($this->public_key) || empty($this->secret_key)) {
                   return;
               }
               
               wp_enqueue_script('bpay-js', 'https://js.bpay.com/v1/', array(), '1.0.0', true);
               wp_enqueue_script('bpay-woocommerce', plugin_dir_url(__FILE__) . 'assets/bpay-checkout.js', array('bpay-js'), '1.0.0', true);
               
               wp_localize_script('bpay-woocommerce', 'bpay_params', array(
                   'public_key' => $this->public_key,
                   'ajax_url' => admin_url('admin-ajax.php'),
                   'nonce' => wp_create_nonce('bpay_nonce')
               ));
           }
           
           public function payment_fields() {
               if ($this->description) {
                   echo wpautop(wp_kses_post($this->description));
               }
               ?>
               <div id="bpay-payment-element">
                   <!-- bpay Elements will create form elements here -->
               </div>
               <input type="hidden" id="bpay-payment-intent" name="bpay_payment_intent" />
               <input type="hidden" id="bpay-payment-method" name="bpay_payment_method" />
               <?php
           }
           
           public function process_payment($order_id) {
               global $woocommerce;
               
               $order = wc_get_order($order_id);
               $payment_intent = sanitize_text_field($_POST['bpay_payment_intent']);
               $payment_method = sanitize_text_field($_POST['bpay_payment_method']);
               
               if (empty($payment_intent) || empty($payment_method)) {
                   wc_add_notice('Payment method required', 'error');
                   return;
               }
               
               // Confirm payment intent with bpay API
               $response = $this->confirm_payment_intent($payment_intent, $payment_method, $order);
               
               if ($response && $response['status'] === 'succeeded') {
                   // Payment successful
                   $order->payment_complete($response['id']);
                   $order->reduce_order_stock();
                   $order->add_order_note('bpay payment completed. Payment ID: ' . $response['id']);
                   
                   // Clear cart
                   $woocommerce->cart->empty_cart();
                   
                   return array(
                       'result' => 'success',
                       'redirect' => $this->get_return_url($order)
                   );
               } else {
                   wc_add_notice('Payment failed. Please try again.', 'error');
                   return;
               }
           }
           
           private function confirm_payment_intent($intent_id, $payment_method, $order) {
               $url = $this->testmode ? 
                   'https://api-sandbox.bpay.com/api/v1/payment_intents/' . $intent_id . '/confirm' :
                   'https://api.bpay.com/api/v1/payment_intents/' . $intent_id . '/confirm';
               
               $args = array(
                   'method' => 'POST',
                   'headers' => array(
                       'Authorization' => 'Bearer ' . $this->secret_key,
                       'Content-Type' => 'application/json'
                   ),
                   'body' => json_encode(array(
                       'payment_method' => json_decode($payment_method, true),
                       'metadata' => array(
                           'woocommerce_order_id' => $order->get_id(),
                           'customer_email' => $order->get_billing_email(),
                           'customer_name' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name()
                       )
                   ))
               );
               
               $response = wp_remote_request($url, $args);
               
               if (is_wp_error($response)) {
                   return false;
               }
               
               return json_decode(wp_remote_retrieve_body($response), true);
           }
       }
   }
   
   // Register the gateway
   add_filter('woocommerce_payment_gateways', 'add_bpay_gateway');
   function add_bpay_gateway($gateways) {
       $gateways[] = 'WC_Gateway_bpay';
       return $gateways;
   }
   
   // AJAX handler for creating payment intents
   add_action('wp_ajax_create_bpay_payment_intent', 'create_bpay_payment_intent');
   add_action('wp_ajax_nopriv_create_bpay_payment_intent', 'create_bpay_payment_intent');
   
   function create_bpay_payment_intent() {
       check_ajax_referer('bpay_nonce', 'nonce');
       
       $order_id = intval($_POST['order_id']);
       $order = wc_get_order($order_id);
       
       if (!$order) {
           wp_die('Invalid order');
       }
       
       $gateway = new WC_Gateway_bpay();
       $url = $gateway->testmode ? 
           'https://api-sandbox.bpay.com/api/v1/payment_intents' :
           'https://api.bpay.com/api/v1/payment_intents';
       
       $args = array(
           'method' => 'POST',
           'headers' => array(
               'Authorization' => 'Bearer ' . $gateway->secret_key,
               'Content-Type' => 'application/json'
           ),
           'body' => json_encode(array(
               'amount' => floatval($order->get_total()),
               'currency' => $order->get_currency(),
               'metadata' => array(
                   'woocommerce_order_id' => $order_id,
                   'customer_email' => $order->get_billing_email()
               )
           ))
       );
       
       $response = wp_remote_request($url, $args);
       
       if (!is_wp_error($response)) {
           $body = json_decode(wp_remote_retrieve_body($response), true);
           wp_send_json_success($body);
       } else {
           wp_send_json_error('Failed to create payment intent');
       }
   }
   ?>
   ```

2. **Create JavaScript File** (`assets/bpay-checkout.js`)
   ```javascript
   jQuery(document).ready(function($) {
       let bpayInstance;
       let paymentElement;
       
       // Initialize bpay when payment method is selected
       $('body').on('change', 'input[name="payment_method"]', function() {
           if ($(this).val() === 'bpay') {
               initializebpay();
           }
       });
       
       async function initializebpay() {
           if (typeof bpay === 'undefined') {
               console.error('bpay.js not loaded');
               return;
           }
           
           bpayInstance = bpay(bpay_params.public_key);
           
           // Create payment intent
           const orderTotal = parseFloat($('.order-total .woocommerce-Price-amount').text().replace(/[^0-9.]/g, ''));
           const orderData = {
               action: 'create_bpay_payment_intent',
               order_id: getOrderId(),
               nonce: bpay_params.nonce
           };
           
           try {
               const response = await $.post(bpay_params.ajax_url, orderData);
               
               if (response.success) {
                   const { client_secret } = response.data;
                   
                   // Create elements
                   const elements = bpayInstance.elements({
                       clientSecret: client_secret
                   });
                   
                   // Create and mount payment element
                   paymentElement = elements.create('payment', {
                       layout: {
                           type: 'accordion',
                           defaultCollapsed: false,
                           radios: true,
                           spacedAccordionItems: true
                       }
                   });
                   
                   paymentElement.mount('#bpay-payment-element');
                   
                   // Store payment intent ID
                   $('#bpay-payment-intent').val(response.data.id);
               }
           } catch (error) {
               console.error('Failed to initialize bpay:', error);
           }
       }
       
       // Handle form submission
       $('body').on('submit', 'form.checkout', function(e) {
           if ($('input[name="payment_method"]:checked').val() === 'bpay') {
               e.preventDefault();
               processbpayPayment();
           }
       });
       
       async function processbpayPayment() {
           if (!bpayInstance || !paymentElement) {
               console.error('bpay not initialized');
               return;
           }
           
           // Confirm payment
           const { error, paymentIntent } = await bpayInstance.confirmPayment({
               elements: paymentElement,
               confirmParams: {
                   return_url: window.location.href
               }
           });
           
           if (error) {
               console.error('Payment failed:', error);
               $('.woocommerce-error').remove();
               $('.woocommerce-notices-wrapper').append(
                   '<div class="woocommerce-error">' + error.message + '</div>'
               );
           } else {
               // Store payment method details and submit form
               $('#bpay-payment-method').val(JSON.stringify(paymentIntent.payment_method));
               $('form.checkout').off('submit').submit();
           }
       }
       
       function getOrderId() {
           // Extract order ID from URL or form data
           const urlParams = new URLSearchParams(window.location.search);
           return urlParams.get('order_id') || $('input[name="order_id"]').val() || 0;
       }
   });
   ```

## Configuration Options

### Payment Gateway Settings
- **Title**: Display name for customers
- **Description**: Explanation of split payment benefits
- **Test Mode**: Enable for development/testing
- **API Keys**: Your bpay credentials
- **Webhook URL**: `https://yoursite.com/wp-json/bpay/v1/webhook`

### Advanced Options
```php
// Add to functions.php for customization
add_filter('bpay_payment_intent_args', 'customize_payment_intent');
function customize_payment_intent($args) {
    // Add custom metadata
    $args['metadata']['store_name'] = get_bloginfo('name');
    $args['metadata']['wordpress_version'] = get_bloginfo('version');
    
    // Set return URL
    $args['return_url'] = wc_get_checkout_url();
    
    return $args;
}

// Customize checkout appearance
add_filter('bpay_elements_options', 'customize_elements');
function customize_elements($options) {
    $options['appearance'] = array(
        'theme' => 'flat',
        'variables' => array(
            'colorPrimary' => get_theme_mod('primary_color', '#0073aa'),
            'fontFamily' => get_theme_mod('body_font', 'sans-serif')
        )
    );
    
    return $options;
}
```

## Webhook Setup

1. **Create Webhook Endpoint**
   ```php
   // Add to functions.php
   add_action('rest_api_init', 'register_bpay_webhook');
   
   function register_bpay_webhook() {
       register_rest_route('bpay/v1', '/webhook', array(
           'methods' => 'POST',
           'callback' => 'handle_bpay_webhook',
           'permission_callback' => '__return_true'
       ));
   }
   
   function handle_bpay_webhook($request) {
       $payload = $request->get_body();
       $signature = $request->get_header('bpay-signature');
       
       // Verify webhook signature
       $gateway = new WC_Gateway_bpay();
       $webhook_secret = $gateway->get_option('webhook_secret');
       
       if (!verify_webhook_signature($payload, $signature, $webhook_secret)) {
           return new WP_Error('invalid_signature', 'Invalid webhook signature', array('status' => 400));
       }
       
       $event = json_decode($payload, true);
       
       switch ($event['type']) {
           case 'payment_intent.succeeded':
               handle_payment_success($event['data']);
               break;
           case 'payment_intent.failed':
               handle_payment_failure($event['data']);
               break;
       }
       
       return new WP_REST_Response(array('received' => true), 200);
   }
   
   function handle_payment_success($payment_intent) {
       $order_id = $payment_intent['metadata']['woocommerce_order_id'];
       $order = wc_get_order($order_id);
       
       if ($order && $order->get_status() === 'pending') {
           $order->payment_complete($payment_intent['id']);
           $order->add_order_note('bpay webhook: Payment completed');
       }
   }
   
   function verify_webhook_signature($payload, $signature, $secret) {
       $expected_signature = hash_hmac('sha256', $payload, $secret);
       return hash_equals($signature, $expected_signature);
   }
   ```

## Testing

### Test Mode Setup
1. Use test API keys
2. Enable test mode in gateway settings
3. Use test card numbers from bpay documentation

### Test Scenarios
```php
// Test order creation
$order = wc_create_order();
$order->add_product(wc_get_product(1), 1);
$order->set_address(array(
    'first_name' => 'Test',
    'last_name' => 'Customer',
    'email' => 'test@example.com'
), 'billing');
$order->calculate_totals();
$order->save();
```

## Troubleshooting

### Common Issues

1. **Payment buttons not showing**
   - Check API keys are correctly entered
   - Verify bpay.js is loading properly
   - Check browser console for JavaScript errors

2. **Webhook not receiving events**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Test webhook endpoint manually

3. **Orders stuck in pending**
   - Check webhook configuration
   - Verify payment confirmation flow
   - Review error logs

### Debug Mode
```php
// Add to wp-config.php
define('BPAY_DEBUG', true);

// Add logging to functions.php
if (defined('BPAY_DEBUG') && BPAY_DEBUG) {
    add_action('bpay_debug', 'log_bpay_debug');
    
    function log_bpay_debug($message) {
        error_log('[bpay] ' . $message);
    }
}
```

## Support

- **Documentation**: https://docs.bpay.com/wordpress
- **Support**: wordpress-support@bpay.com
- **Community**: https://wordpress.org/support/plugin/bpay