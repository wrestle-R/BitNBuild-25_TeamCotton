import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  Alert,
  RefreshControl,
  Linking,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Colors, lightColors, darkColors, shadows, borderRadius } from '../../constants/Colors';
import { getVendorById, getVendorPlans, getPlanMenus, createOrder, verifyPayment } from '../../api/customerApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VendorPlansScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  
  const [vendor, setVendor] = useState(null);
  const [plans, setPlans] = useState([]);
  const [planMenus, setPlanMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderData, setPaymentOrderData] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [paymentDebug, setPaymentDebug] = useState({ phase: 'idle', events: [] });
  const pushDebug = (msg, extra={}) => {
    setPaymentDebug(prev => ({
      ...prev,
      phase: extra.phase || prev.phase,
      events: [
        { t: Date.now(), msg, ...extra },
        ...prev.events.slice(0,49) // keep last 50
      ]
    }));
    console.log('[PAYMENT]', msg, extra);
  };

  // Helper function to safely convert MongoDB Decimal128 to number
  const safePrice = (plan) => {
    if (!plan || !plan.price) return 0;
    if (typeof plan.price === 'object' && plan.price.$numberDecimal) {
      return parseFloat(plan.price.$numberDecimal);
    }
    return typeof plan.price === 'string' ? parseFloat(plan.price) : plan.price;
  };

  const getDurationText = (days, planName) => {
    if (!days) return 'Plan';
    if (days === 1) return 'Daily Plan';
    if (days === 7) return 'Weekly Plan';
    if (days === 30) return 'Monthly Plan';
    return `${days} Days Plan`;
  };

  const fetchVendorAndPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch vendor and plans only
      const [vendorData, plansData] = await Promise.all([
        getVendorById(id),
        getVendorPlans(id)
      ]);
      
      setVendor(vendorData);
      setPlans(Array.isArray(plansData) ? plansData : []);
      
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      setError('Failed to load vendor plans. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to fetch menus for a specific plan
  const fetchPlanMenus = async (planId) => {
    try {
      setLoadingMenus(true);
      const menusData = await getPlanMenus(planId, id);
      setPlanMenus(Array.isArray(menusData) ? menusData : []);
    } catch (menuError) {
      console.error('Error fetching plan menus:', menuError);
      setPlanMenus([]); // Set empty array if menu fetch fails
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    fetchVendorAndPlans();
  }, [id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVendorAndPlans();
  };

  // Function to handle showing plan details
  const handleViewPlanDetails = (plan) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
    // Fetch menus for this specific plan
    if (plan._id) {
      fetchPlanMenus(plan._id);
    }
  };

  // Function to close plan details modal
  const handleCloseModal = () => {
    setShowPlanModal(false);
    setSelectedPlan(null);
    setPlanMenus([]); // Clear plan-specific menus
  };

  // Function to handle subscription payment
  const handleSubscribeNow = async (plan) => {
    try {
      // Check if user is logged in
      const idToken = await AsyncStorage.getItem('idToken');
      if (!idToken) {
        Alert.alert(
          'Login Required',
          'You need to login to subscribe to a meal plan',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => router.push('/login') }
          ]
        );
        return;
      }

      // Create Razorpay order - exactly like your frontend
      const orderData = await createOrder({
        plan_id: plan._id,
        vendor_id: id
      });
      pushDebug('Order created', { orderData });
      if(!orderData || !orderData.order_id || !orderData.amount) {
        pushDebug('Invalid orderData received', { orderData });
        Alert.alert('Payment Error', 'Invalid order details received from server');
        return;
      }

      // Set payment data and show WebView modal
      setPaymentOrderData(orderData);
      setPaymentPlan(plan);
      setShowPaymentModal(true);
      setPaymentDebug(d => ({...d, phase: 'modal-open'}));

    } catch (error) {
      console.error('Payment error:', error);
      pushDebug('Payment initiation failed', { error: error.message });
      Alert.alert('Payment Error', error.message || 'Failed to initiate payment');
    }
  };

  // Handle payment success/failure from WebView
  const handlePaymentMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      pushDebug('RN received message', data);
      
      if (data.type === 'PAYMENT_SUCCESS') {
        // Close payment modal
        setShowPaymentModal(false);
        pushDebug('Payment success message received');
        
        // Verify payment - exactly like your frontend
        const idToken = await AsyncStorage.getItem('idToken');
        const verifyResponse = await verifyPayment({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          payment_id: paymentOrderData.payment_id
        });

        Alert.alert(
          '🎉 Payment Successful!',
          'Your subscription has been activated successfully.',
          [
            { 
              text: 'View Subscriptions', 
              onPress: () => router.push('/subscriptions') 
            },
            { text: 'Continue Browsing' }
          ]
        );
      } else if (data.type === 'PAYMENT_FAILED') {
        setShowPaymentModal(false);
        pushDebug('Payment failed message received', { error: data.error });
        Alert.alert('Payment Failed', data.error?.description || 'Payment was not successful');
      } else if (data.type === 'PAYMENT_DISMISSED') {
        setShowPaymentModal(false);
        pushDebug('Payment dismissed message received');
        Alert.alert('Payment Cancelled', 'You cancelled the payment process');
      } else if (data.type === 'PAYMENT_HTML_READY') {
        pushDebug('Payment HTML ready inside WebView');
      } else if (data.type === 'RAZORPAY_SCRIPT_LOADED') {
        pushDebug('Razorpay script loaded');
      } else if (data.type === 'RAZORPAY_OPEN_ATTEMPT') {
        pushDebug('Attempting to open Razorpay checkout');
      } else if (data.type === 'RAZORPAY_OPEN_ERROR') {
        pushDebug('Failed to open Razorpay', { error: data.error });
        // Fallback: open hosted page in external browser
        if(paymentOrderData?.order_id){
          setShowPaymentModal(false);
          Alert.alert('Opening External Payment', 'In-app payment failed, opening secure browser.', [
            { text: 'Cancel', style:'cancel' },
            { text: 'Continue', onPress: () => Linking.openURL(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.40:5000'}/api/payment/hosted-checkout/${paymentOrderData.order_id}?pid=${paymentOrderData.payment_id}`) }
          ]);
        }
      } else if (data.type === 'DEBUG_LOG') {
        pushDebug(data.message || 'Debug log', data.payload || {});
        // Detect recurring script loading failure and fallback fast
        if ((data.message || '').toLowerCase().includes('script error') && paymentOrderData?.order_id) {
          pushDebug('Script error detected – triggering external fallback');
          setShowPaymentModal(false);
          const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.40:5000';
          Alert.alert(
            'Opening External Payment',
            'In-app payment gateway failed to load. We\'ll open a secure browser instead.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Continue', onPress: () => Linking.openURL(`${backendUrl}/api/payment/hosted-checkout/${paymentOrderData.order_id}?pid=${paymentOrderData.payment_id}`) }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Payment message error:', error);
      setShowPaymentModal(false);
      Alert.alert('Payment Error', 'Something went wrong with payment processing');
    }
  };

  // Generate Razorpay HTML - exactly like your frontend
  const generateRazorpayHTML = () => {
    if (!paymentOrderData || !paymentPlan) return '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment</title>
        <script>
          // Relay console logs to React Native for debugging
          (function(){
            const origLog = console.log;
            console.log = function(){
              try { if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify({type:'DEBUG_LOG', message: Array.from(arguments).join(' ')})); } } catch(e){}
              origLog.apply(console, arguments);
            };
            window.addEventListener('error', function(e){
              try { if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify({type:'DEBUG_LOG', message: 'Window error: '+ e.message})); } } catch(_e){}
            });
          })();
          try { if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_HTML_READY'})); } } catch(e){}
        </script>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                max-width: 400px;
                width: 100%;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #3B82F6;
                margin-bottom: 20px;
            }
            .plan-info {
                margin-bottom: 20px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .plan-name {
                font-size: 18px;
                font-weight: 600;
                color: #333;
                margin-bottom: 5px;
            }
            .plan-price {
                font-size: 24px;
                font-weight: bold;
                color: #3B82F6;
            }
            .loading {
                margin: 20px 0;
            }
            .spinner {
                border: 2px solid #f3f3f3;
                border-top: 2px solid #3B82F6;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .pay-button {
                background: #3B82F6;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                margin-top: 20px;
            }
            .pay-button:hover {
                background: #2563EB;
            }
            .error-message {
                color: #dc2626;
                margin-top: 15px;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🍽️ NourishNet</div>
            <div class="plan-info">
                <div class="plan-name">${paymentPlan.name}</div>
                <div class="plan-price">₹${safePrice(paymentPlan)}</div>
            </div>
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Loading payment gateway...</p>
            </div>
            <button class="pay-button" id="payButton" style="display: none;" onclick="initiatePayment()">
                Pay Now with Razorpay
            </button>
            <div class="error-message" id="errorMessage" style="display: none;"></div>
        </div>

        <script>
            let razorpayLoaded = false;
            let loadAttempts = 0;
            const maxAttempts = 5;
      function post(data){ try{ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(data)); }catch(e){} }

            // Function to load Razorpay script
      function loadRazorpayScript() {
        return new Promise((resolve, reject) => {
        if(window.Razorpay){ post({type:'RAZORPAY_SCRIPT_LOADED', cached:true}); resolve(); return; }
        const s = document.createElement('script');
        s.src='https://checkout.razorpay.com/v1/checkout.js';
        s.onload=()=>{ razorpayLoaded = true; post({type:'RAZORPAY_SCRIPT_LOADED'}); resolve(); };
                s.onerror=()=>{ 
                  post({type:'DEBUG_LOG', message:'Script tag load error - will attempt inline fetch'});
                  // Fallback: fetch the script and eval
                  fetch('https://checkout.razorpay.com/v1/checkout.js')
                    .then(r=>r.text())
                    .then(txt=>{ try { eval(txt); if(window.Razorpay){ razorpayLoaded=true; post({type:'RAZORPAY_SCRIPT_LOADED', fallback:true}); resolve(); } else { throw new Error('Razorpay undefined after eval'); } } catch(e){ post({type:'DEBUG_LOG', message:'Eval fallback failed '+ e.message}); reject(e);} })
                    .catch(err=>{ post({type:'DEBUG_LOG', message:'Fetch fallback failed '+ err.message}); reject(new Error('Script load error + fetch fallback failed')); });
                };
        document.head.appendChild(s);
        });
      }

            // Function to initiate payment
            function initiatePayment() {
                try {
                    if (!window.Razorpay) {
                        throw new Error('Razorpay not loaded');
                    }

                    const options = {
                        key: '${paymentOrderData.key}',
                        amount: '${paymentOrderData.amount}',
                        currency: 'INR',
                        name: 'NourishNet',
                        description: '${paymentPlan.name} Plan Subscription - ${vendor?.name || 'Vendor'}',
                        order_id: '${paymentOrderData.order_id}',
                        handler: function (response) {
                            // Payment successful
                            if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'PAYMENT_SUCCESS',
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature
                                }));
                            }
                        },
                        prefill: {
                            name: 'Customer',
                            email: 'customer@example.com',
                            contact: '9999999999'
                        },
                        theme: {
                            color: '#3B82F6'
                        },
                        modal: {
                            ondismiss: function() {
                                if (window.ReactNativeWebView) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'PAYMENT_DISMISSED'
                                    }));
                                }
                            }
                        }
                    };

                    try {
                      const rzp = new window.Razorpay(options);
                      rzp.on('payment.failed', function (response) {
                        post({ type: 'PAYMENT_FAILED', error: response.error });
                      });
                      post({ type:'RAZORPAY_OPEN_ATTEMPT'});
                      rzp.open();
                    } catch(openErr){
                      post({ type:'RAZORPAY_OPEN_ERROR', error: openErr.message });
                      throw openErr;
                    }
                } catch (error) {
                    console.error('Payment initiation error:', error);
                    document.getElementById('errorMessage').textContent = 'Failed to initialize payment: ' + error.message;
                    document.getElementById('errorMessage').style.display = 'block';
                }
            }

            // Initialize payment flow
            function initializePayment() {
                loadAttempts++;
                
                loadRazorpayScript()
                    .then(() => {
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('payButton').style.display = 'block';
                        
                        // Auto-click the pay button after 1 second
                        setTimeout(() => {
                            document.getElementById('payButton').click();
                        }, 1000);
                    })
                    .catch((error) => {
                        console.error('Script loading error:', error);
                        document.getElementById('loading').style.display = 'none';
                        
                        if (loadAttempts < maxAttempts) {
                            document.getElementById('loading').style.display = 'block';
                            document.getElementById('loading').innerHTML = '<div class="spinner"></div><p>Retrying... (Attempt ' + (loadAttempts + 1) + ')</p>';
                            setTimeout(initializePayment, 2000);
                        } else {
                            document.getElementById('errorMessage').textContent = 'Failed to load payment gateway. Please check your internet connection.';
                            document.getElementById('errorMessage').style.display = 'block';
                            document.getElementById('payButton').style.display = 'block';
                            document.getElementById('payButton').textContent = 'Retry Payment';
                            document.getElementById('payButton').onclick = () => {
                                loadAttempts = 0;
                                document.getElementById('errorMessage').style.display = 'none';
                                document.getElementById('payButton').style.display = 'none';
                                document.getElementById('loading').style.display = 'block';
                                document.getElementById('loading').innerHTML = '<div class="spinner"></div><p>Loading payment gateway...</p>';
                                initializePayment();
                            };
                        }
                    });
            }

            // Start initialization when page loads
            // Start immediately with small delay to allow RN to mount
            setTimeout(initializePayment, 100);
            // Fallback if not opened after 8s
            setTimeout(() => {
              if(!window.__rzp_opened){
                document.getElementById('payButton').style.display = 'block';
                document.getElementById('loading').style.display = 'none';
                document.getElementById('payButton').textContent = 'Open Payment';
                post({type:'DEBUG_LOG', message:'Fallback showing manual pay button'});
                post({type:'RAZORPAY_OPEN_ERROR', error:'Timeout waiting for Razorpay script'});
              }
            }, 8000);
        </script>
    </body>
    </html>`;
  };



  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading Plans...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          {vendor && (
            <View style={styles.vendorTitleContainer}>
              <ThemedText style={styles.vendorName}>{vendor.name}</ThemedText>
              <ThemedText style={styles.sectionSubtitle}>Choose a meal plan that suits your needs</ThemedText>
            </View>
          )}
        </View>

        {error && (
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        )}

        {/* Plans Section */}
        <ThemedText style={styles.sectionTitle}>Available Meal Plans</ThemedText>
        
        {plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={colors.muted} />
            <ThemedText style={styles.emptyTitle}>No plans available</ThemedText>
            <ThemedText style={styles.emptyDescription}>
              This vendor hasn't created any meal plans yet.
            </ThemedText>
            <TouchableOpacity
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/market')}
            >
              <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Browse Other Vendors</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plansGrid}>
            {plans.map((plan) => (
              <TouchableOpacity 
                key={plan._id} 
                style={[styles.planCard, { backgroundColor: colors.card }]}
                onPress={() => handleViewPlanDetails(plan)}
                activeOpacity={0.9}
              >
                {/* Plan Header */}
                <View style={styles.planHeader}>
                  <View>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <View style={[styles.mealIconContainer, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="calendar-outline" size={24} color={colors.primary} />
                      </View>
                      <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                    </View>
                    <ThemedText style={styles.planDuration}>
                      {getDurationText(plan.duration_days || plan.duration)}
                    </ThemedText>
                  </View>
                  
                  {/* Price */}
                  <View style={[styles.priceContainer, { backgroundColor: colors.primary + '15', borderRadius: 8, padding: 8 }]}>
                    <ThemedText style={[styles.price, { color: colors.primary }]}>
                      ₹{safePrice(plan)}
                    </ThemedText>
                    <ThemedText style={styles.perMeal}>
                      Total for {plan.duration_days || plan.duration || 30} days
                    </ThemedText>
                    <ThemedText style={[styles.perDay, { color: colors.primary }]}>
                      ₹{Math.round(safePrice(plan) / (plan.duration_days || plan.duration || 30))} per day
                    </ThemedText>
                  </View>
                </View>
                
                {/* Plan Details */}
                <View style={styles.planDetails}>
                  {/* Duration */}
                  <View style={styles.planDetailRow}>
                    <View style={styles.planDetailIconContainer}>
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    </View>
                    <ThemedText style={styles.planDetailLabel}>Duration</ThemedText>
                    <ThemedText style={styles.planDetailValue}>
                      {(plan.duration_days || plan.duration)} days
                    </ThemedText>
                  </View>

                  {/* Meals Per Day */}
                  <View style={styles.planDetailRow}>
                    <View style={styles.planDetailIconContainer}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                    </View>
                    <ThemedText style={styles.planDetailLabel}>Per Day</ThemedText>
                    <ThemedText style={styles.planDetailValue}>
                      {plan.meals_per_day || plan.mealsPerDay || 2} meals
                    </ThemedText>
                  </View>

                  {/* Meal Types */}
                  {plan.selected_meals && plan.selected_meals.length > 0 && (
                    <View style={styles.planDetailRow}>
                      <View style={styles.planDetailIconContainer}>
                        <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
                      </View>
                      <ThemedText style={styles.planDetailLabel}>Meals</ThemedText>
                      <ThemedText style={styles.planDetailValue}>
                        {plan.selected_meals.map(meal => 
                          meal.charAt(0).toUpperCase() + meal.slice(1)
                        ).join(', ')}
                      </ThemedText>
                    </View>
                  )}

                  {/* Food Type */}
                  {vendor && vendor.specialty && (
                    <View style={styles.planDetailRow}>
                      <View style={styles.planDetailIconContainer}>
                        <Ionicons 
                          name={vendor.specialty === 'veg' ? 'leaf' : 'fast-food'} 
                          size={18} 
                          color={vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800'} 
                        />
                      </View>
                      <ThemedText style={styles.planDetailLabel}>Type</ThemedText>
                      <ThemedText style={[
                        styles.planDetailValue,
                        { color: vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800' }
                      ]}>
                        {vendor.specialty === 'veg' ? 'Vegetarian' : 'Non-veg options'}
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.viewDetailsButton, { borderColor: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleViewPlanDetails(plan);
                    }}
                  >
                    <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{marginRight: 6}} />
                    <ThemedText style={[styles.viewDetailsText, { color: colors.primary }]}>Details</ThemedText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSubscribeNow(plan);
                    }}
                  >
                    <Ionicons name="cart-outline" size={16} color="white" style={{marginRight: 6}} />
                    <ThemedText style={styles.subscribeButtonText}>Subscribe</ThemedText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Plan Details Modal */}
      {selectedPlan && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPlanModal}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <ScrollView 
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>{selectedPlan.name}</ThemedText>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.foreground} />
                  </TouchableOpacity>
                </View>

                {/* Plan Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total Price:</ThemedText>
                    <ThemedText style={[styles.summaryValue, { color: colors.primary }]}>
                      ₹{safePrice(selectedPlan)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Duration:</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {selectedPlan.duration_days || selectedPlan.duration} days
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Price per day:</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      ₹{Math.round(safePrice(selectedPlan) / (selectedPlan.duration_days || selectedPlan.duration || 30))}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Meals per day:</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {selectedPlan.meals_per_day || selectedPlan.mealsPerDay || 2}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Total meals:</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      {(selectedPlan.duration_days || selectedPlan.duration || 30) * (selectedPlan.meals_per_day || selectedPlan.mealsPerDay || 2)}
                    </ThemedText>
                  </View>
                  <View style={styles.summaryRow}>
                    <ThemedText style={styles.summaryLabel}>Price per meal:</ThemedText>
                    <ThemedText style={styles.summaryValue}>
                      ₹{(safePrice(selectedPlan) / ((selectedPlan.duration_days || selectedPlan.duration || 30) * (selectedPlan.meals_per_day || selectedPlan.mealsPerDay || 2))).toFixed(2)}
                    </ThemedText>
                  </View>
                </View>

                {/* Meal Types */}
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Included Meal Types</ThemedText>
                  <View style={styles.mealsContainer}>
                    {selectedPlan.selected_meals && selectedPlan.selected_meals.length > 0 ? (
                      selectedPlan.selected_meals.map((meal, index) => (
                        <View key={index} style={[styles.mealType, { backgroundColor: colors.card }]}>
                          <Ionicons 
                            name={
                              meal.toLowerCase().includes('breakfast') ? "cafe-outline" : 
                              meal.toLowerCase().includes('lunch') ? "restaurant-outline" :
                              meal.toLowerCase().includes('dinner') ? "moon-outline" : "nutrition-outline"
                            } 
                            size={18} 
                            color={colors.primary} 
                          />
                          <ThemedText style={styles.mealTypeName}>
                            {meal.charAt(0).toUpperCase() + meal.slice(1)}
                          </ThemedText>
                        </View>
                      ))
                    ) : (
                      <ThemedText style={styles.noDataText}>Standard meal types included</ThemedText>
                    )}
                  </View>
                </View>

                {/* Menu Items */}
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Available Food Items</ThemedText>
                  <View style={styles.menuContainer}>
                    {loadingMenus ? (
                      <View style={[styles.noMenuCard, { backgroundColor: colors.card }]}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <ThemedText style={styles.noDataText}>Loading menu items...</ThemedText>
                      </View>
                    ) : planMenus && planMenus.length > 0 ? (
                      <View style={styles.mealGroupContainer}>
                        {planMenus.map((menu) => (
                          <View key={menu._id} style={[styles.mealTypeBox, { backgroundColor: colors.card }]}>
                            {/* Meal Type Header */}
                            <View style={[styles.mealTypeHeader, { backgroundColor: colors.primary + '15' }]}>
                              <Ionicons 
                                name={
                                  menu.meal_type === 'breakfast' ? 'sunny-outline' :
                                  menu.meal_type === 'lunch' ? 'restaurant-outline' :
                                  menu.meal_type === 'dinner' ? 'moon-outline' : 'time-outline'
                                } 
                                size={20} 
                                color={colors.primary} 
                              />
                              <ThemedText style={[styles.mealTypeTitle, { color: colors.primary }]}>
                                {menu.meal_type.charAt(0).toUpperCase() + menu.meal_type.slice(1)}
                              </ThemedText>
                              <View style={[styles.vegIndicator, { 
                                backgroundColor: menu.non_veg ? '#FF9800' : '#4CAF50' 
                              }]}>
                                <Ionicons 
                                  name={menu.non_veg ? "restaurant" : "leaf"} 
                                  size={12} 
                                  color="white" 
                                />
                              </View>
                            </View>
                            
                            {/* Food Items List */}
                            <View style={styles.foodItemsList}>
                              {menu.items && Array.isArray(menu.items) && menu.items.length > 0 ? (
                                menu.items.map((item, itemIndex) => (
                                  <View key={itemIndex} style={styles.foodItemRow}>
                                    <View style={styles.bulletPoint} />
                                    <View style={styles.foodItemContent}>
                                      <ThemedText style={styles.foodItemName}>
                                        {item.name || item.dish_name || item.itemName || 'Food Item'}
                                      </ThemedText>
                                      {item.description && (
                                        <ThemedText style={styles.foodItemDescription} numberOfLines={1}>
                                          {item.description}
                                        </ThemedText>
                                      )}
                                    </View>
                                  </View>
                                ))
                              ) : (
                                <ThemedText style={styles.noItemsText}>No items available</ThemedText>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={[styles.noMenuCard, { backgroundColor: colors.card }]}>
                        <Ionicons name="restaurant-outline" size={32} color={colors.primary + '60'} />
                        <ThemedText style={styles.noDataText}>
                          Menu items will be provided by the vendor
                        </ThemedText>
                        <ThemedText style={[styles.noDataSubtext, { color: colors.text + '60' }]}>
                          Contact the vendor for specific meal details
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Food Type */}
                {vendor && vendor.specialty && (
                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Food Type</ThemedText>
                    <View style={[styles.foodTypeCard, { backgroundColor: colors.card }]}>
                      <Ionicons 
                        name={vendor.specialty === 'veg' ? "leaf-outline" : "restaurant-outline"} 
                        size={22} 
                        color={vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800'} 
                      />
                      <ThemedText style={[
                        styles.foodTypeText,
                        { color: vendor.specialty === 'veg' ? '#4CAF50' : '#FF9800' }
                      ]}>
                        {vendor.specialty === 'veg' ? 'Pure Vegetarian' : 'Mixed (Veg & Non-veg options)'}
                      </ThemedText>
                    </View>
                  </View>
                )}
                
                {/* Additional Information */}
                <View style={styles.section}>
                  <ThemedText style={styles.sectionTitle}>Additional Information</ThemedText>
                  <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
                    <View style={styles.infoRow}>
                      <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                      <ThemedText style={styles.infoText}>
                        Meal timing depends on the vendor's schedule.
                      </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="time-outline" size={18} color={colors.primary} />
                      <ThemedText style={styles.infoText}>
                        Subscription starts immediately after payment.
                      </ThemedText>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                      <ThemedText style={styles.infoText}>
                        Plan validity: {selectedPlan.duration_days || selectedPlan.duration || 30} days from activation.
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Subscribe button */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalSubscribeButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    handleCloseModal();
                    handleSubscribeNow(selectedPlan);
                  }}
                >
                  <Ionicons name="cart-outline" size={20} color="white" />
                  <ThemedText style={styles.modalSubscribeButtonText}>Subscribe Now</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Payment WebView Modal */}
      {showPaymentModal && paymentOrderData && paymentPlan && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showPaymentModal}
          onRequestClose={() => setShowPaymentModal(false)}
        >
          <View style={styles.paymentModalContainer}>
            <View style={styles.paymentHeader}>
              <TouchableOpacity 
                onPress={() => setShowPaymentModal(false)}
                style={styles.paymentCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <ThemedText style={styles.paymentTitle}>Complete Payment</ThemedText>
            </View>
            <WebView
              source={{ html: generateRazorpayHTML() }}
              onMessage={handlePaymentMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={["*"]}
              allowFileAccess={false}
              allowUniversalAccessFromFileURLs={false}
              onLoadStart={() => pushDebug('WebView load start', { phase:'webview-loading'})}
              onLoadEnd={() => pushDebug('WebView load end', { phase:'webview-loaded'})}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                pushDebug('WebView error', { description: nativeEvent.description });
                Alert.alert('WebView Error', nativeEvent.description || 'Failed to load payment UI');
              }}
              startInLoadingState={true}
              scalesPageToFit={true}
              style={styles.webView}
            />
            {/* Debug overlay (temporary) */}
            {paymentDebug.events.length > 0 && (
              <View style={{position:'absolute', bottom:0, left:0, right:0, maxHeight:180, backgroundColor:'rgba(0,0,0,0.7)', padding:8}}>
                <ScrollView style={{flex:1}}>
                  {paymentDebug.events.slice(0,8).map((e,i)=>(
                    <ThemedText key={i} style={{fontSize:10,color:'#fff'}}>{new Date(e.t).toLocaleTimeString()} - {e.msg}</ThemedText>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    color: '#E57373',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  vendorTitleContainer: {
    flex: 1,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    opacity: 0.7,
  },
  browseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  plansGrid: {
    marginBottom: 20,
  },
  planCard: {
    borderRadius: borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDuration: {
    opacity: 0.7,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  perMeal: {
    fontSize: 12,
    opacity: 0.7,
  },
  perDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  planDetails: {
    marginBottom: 16,
  },
  planDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  planDetailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  planDetailLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  planDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  viewDetailsText: {
    fontWeight: '600',
    fontSize: 14,
  },
  subscribeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.9,
    minHeight: Dimensions.get('window').height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  mealsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mealType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    ...shadows.sm,
  },
  mealTypeName: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  noDataText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  foodTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    ...shadows.sm,
  },
  foodTypeText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    ...shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalSubscribeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    ...shadows.md,
  },
  modalSubscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },

  // Menu styles
  menuContainer: {
    marginTop: 8,
  },
  mealGroupContainer: {
    gap: 12,
  },
  mealTypeBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...shadows.sm,
  },
  mealTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  vegIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemsList: {
    padding: 12,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: 6,
    marginRight: 8,
  },
  foodItemContent: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  foodItemDescription: {
    fontSize: 12,
    opacity: 0.7,
  },
  noItemsText: {
    fontSize: 12,
    opacity: 0.5,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noMenuCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  foodTypeIndicator: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  foodTypeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Payment modal styles
  paymentModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 24, // Compensate for close button
  },
  paymentCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  webView: {
    flex: 1,
  },
});