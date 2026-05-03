/**
 * TRAC360 Order Confirmation Page - Step 10 (FINAL PERFECT VERSION)
 * - Logo included in PDF
 * - Single page layout
 * - Delete buttons hidden in PDF
 * - 114KB file size
 */

import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { usePDF } from 'react-to-pdf';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useTrac360 } from '../../../context/Trac360Context';
import { CartContext } from '../../../context/CartWrapper';
import { COLORS } from '../../../components/Trac360/styles';
import type { Trac360Config, Addon, SubOption } from '../../../types/trac360';
import type { ITrac360Config } from '../../../types/cart';

const getStepNumbers = (hasCircuits: boolean) => {
  return {
    tractorInfo: 1,
    valveSetup: 2,
    operationType: 3,
    circuits: 4,  // Only shown if hasCircuits is true
    addons: hasCircuits ? 5 : 4,  // Shifts to 4 if no circuits
    additionalInfo: hasCircuits ? 10 : 9,  // Shifts down
  };
};

export default function OrderConfirmation() {
  const router = useRouter();
  const { config, resetConfig, removeAddon } = useTrac360();
  const { addItem } = useContext(CartContext);

  // PDF Generation using react-to-pdf
  const { toPDF, targetRef } = usePDF({
    filename: `TRAC360-Order-${Date.now()}.pdf`,
    page: {
      margin: 10,
      format: 'a4',
      orientation: 'portrait',
    },
  });

  // Action states
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for context to hydrate from localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle back
  const handleBack = () => {
    router.push('/suite360/trac360/additional-info');
  };

  // ============================================================================
  // ACTION HANDLER - Add to Cart with PDF Generation
  // ============================================================================

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      console.log('🛒 Starting Add to Cart process...');
      console.log('📊 Current config:', config);
      
      console.log('📄 Generating PDF using hidden clone...');
      
      const originalElement = targetRef.current;
      
      if (!originalElement) {
        throw new Error('PDF content element not found');
      }

      // Import libraries dynamically
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // CREATE HIDDEN CLONE FOR PDF CAPTURE
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      // Style the clone for desktop PDF capture (off-screen, desktop width)
      clone.style.position = 'fixed';
      clone.style.left = '-9999px'; // Position off-screen
      clone.style.top = '0';
      clone.style.minWidth = '800px'; // Force desktop width
      clone.style.width = '800px';
      clone.style.background = '#ffffff';
      clone.style.padding = '30px 20px';
      clone.style.zIndex = '-1000';
      
      // Hide delete buttons in the clone
      const deleteButtonsInClone = clone.querySelectorAll('.pdf-hide-button');
      deleteButtonsInClone.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });
      
      // Add clone to DOM temporarily
      document.body.appendChild(clone);
      
      // Wait for clone to render
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('📸 Capturing clone as canvas...');
      
      // Capture the CLONE (not the original visible element)
      const canvas = await html2canvas(clone, {
        scale: 1.3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: clone.scrollHeight,
        windowWidth: 800,
      });

      console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);

      // Remove the clone immediately after capture
      document.body.removeChild(clone);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Calculate dimensions to fit on ONE page
      const pdfWidth = 210; // A4 width
      const pdfHeight = 297; // A4 height
      const margin = 5; // Small margins
      
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Scale down if too tall for single page
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      if (imgHeight > (pdfHeight - margin * 2)) {
        const scale = (pdfHeight - margin * 2) / imgHeight;
        finalHeight = pdfHeight - (margin * 2);
        finalWidth = imgWidth * scale;
      }

      // Convert canvas to JPEG with compression
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      
      console.log('📄 Adding image to PDF as single page...');

      // Center the image on the page
      const xOffset = (pdfWidth - finalWidth) / 2;
      
      // Add to PDF - SINGLE PAGE ONLY
      pdf.addImage(imgData, 'JPEG', xOffset, margin, finalWidth, finalHeight, undefined, 'FAST');

      // Convert to base64 data URL
      const pdfDataUrl = pdf.output('dataurlstring');
      
      console.log('✅ PDF generated successfully (single page)');
      console.log(`📦 PDF size: ${Math.round(pdfDataUrl.length / 1024)}KB`);

      // Step 2: Create cart item
      const cartItem = {
        id: 'trac-360',
        type: 'trac360_order' as const,
        name: 'TRAC360 Custom Order',
        totalPrice: config.totalPrice,
        quantity: 1,
        stock: 999,
        image: 'https://cdn.swell.store/fluidpowergroup/6954d8e3e8ab550012cbca57/8b530e036be3f21dcda1add5c7e592db/Trac360_Cart.png',
        pdfDataUrl: pdfDataUrl,
        tractorConfig: convertConfigForCart(config),
        cartId: Date.now(),
      };
      
      console.log('📦 Cart item created:', {
        id: cartItem.id,
        type: cartItem.type,
        name: cartItem.name,
        totalPrice: cartItem.totalPrice,
        hasPDF: !!cartItem.pdfDataUrl,
        pdfSize: `${Math.round(cartItem.pdfDataUrl.length / 1024)}KB`
      });
      
      // Step 3: Add to cart
      addItem(cartItem);
      
      console.log('✅ Item added to cart successfully');
      
      // Step 4: Show success state
      setAddedToCart(true);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Clean up any clones that might still exist
      const clones = document.querySelectorAll('[style*="-9999px"]');
      clones.forEach(clone => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
      });
      
      alert(`Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle "Place New Order"
  const handlePlaceNewOrder = () => {
    console.log('🔄 Resetting TRAC360 configuration...');
    
    // Clear setup reminder position
    sessionStorage.removeItem('trac360-setup-reminder-position');
    
    // Reset context (clears localStorage)
    resetConfig();
    
    router.push('/suite360');
  };

  // Handle "Browse Products"
  const handleBrowseProducts = () => {
    console.log('🛍️ Navigating to catalogue...');
    router.push('/catalogue');
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatPrice = (price: number) => {
    return `A$${price.toFixed(2)}`;
  };

  const convertConfigForCart = (config: Trac360Config): ITrac360Config => {
    const optionsPrice = config.addons.reduce((total: number, addon: Addon) => {
      let addonPrice = addon.basePrice || 0;
      if (addon.selectedSubOption && addon.subOptions) {
        const subOption = addon.subOptions.find((opt: SubOption) => opt.id === addon.selectedSubOption);
        if (subOption) {
          addonPrice += subOption.additionalPrice || 0;
        }
      }
      return total + addonPrice;
    }, 0);

    return {
      tractorType: config.tractorInfo.brand || '',
      modelNumber: config.tractorInfo.model || '',
      driveType: config.tractorInfo.driveType || '',
      cabinType: config.tractorInfo.protectionType || '',
      valveLocation: config.valveSetup ? `Setup ${config.valveSetup.code} - ${config.valveSetup.name}` : '',
      selectedOptions: [
        ...(config.operationType ? [`Operation: ${config.operationType.name}`] : []),
        ...(config.circuits ? [`Circuits: ${config.circuits.circuits}-Circuit`] : []),
        ...config.addons.map((addon: Addon) => addon.name),
      ],
      basePrice: config.circuits?.price || 0,
      optionsPrice: optionsPrice,
      totalPrice: config.totalPrice,
      productIds: config.productIds,
    };
  };

  const hasCircuits = Boolean(config.circuits);
  const stepNumbers = getStepNumbers(hasCircuits);

  const addonsTotal = config.addons.reduce((total, addon) => {
    let addonPrice = addon.basePrice || 0;
    if (addon.selectedSubOption && addon.subOptions) {
      const subOption = addon.subOptions.find(opt => opt.id === addon.selectedSubOption);
      if (subOption) {
        addonPrice += subOption.additionalPrice || 0;
      }
    }
    return total + addonPrice;
  }, 0);

  const circuitsPrice = config.circuits?.price || (config.totalPrice - addonsTotal);

  // Redirect if configuration incomplete - BUT allow custom brands/models
  useEffect(() => {
    if (isHydrated) {
      // Check if essential config exists using optional chaining
      const hasValveSetup = Boolean(config.valveSetup?.code);
      const hasOperationType = Boolean(config.operationType?.name);
      const hasTractorInfo = Boolean(config.tractorInfo?.brand && config.tractorInfo?.model);
      
      // Only redirect if missing essential config
      // Don't check brand/model validity - allow custom entries
      // Don't check circuits - it's optional based on the flow
      if (!hasValveSetup || !hasOperationType || !hasTractorInfo) {
        console.log('[TRAC360] Config incomplete, redirecting...', {
          hasValveSetup,
          hasOperationType,
          hasTractorInfo,
          tractorBrand: config.tractorInfo?.brand,
          tractorModel: config.tractorInfo?.model,
        });
        router.push('/suite360/trac360/tractor-info');
      }
    }
  }, [config, router, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p style={{ color: COLORS.grey.medium }}>Loading configuration...</p>
        </div>
      </div>
    );
  }

  // Don't render if essential config is missing (allows custom brand/model)
  const hasEssentialConfig = 
    config.valveSetup?.code && 
    config.operationType?.name && 
    config.tractorInfo?.brand &&
    config.tractorInfo?.model;
    
  if (!hasEssentialConfig) {
    return null;
  }

  // Type guards - we know these exist now because of hasEssentialConfig check
  if (!config.valveSetup || !config.operationType) {
    return null;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen pb-12">
    
      {/* Back Button */}
      <BackButton onClick={handleBack} />

      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* PDF CAPTURE STARTS HERE - Including Logo! */}
        <div ref={targetRef} style={{ background: '#ffffff', padding: '30px 20px' }}>
          
          {/* Logo - NOW INSIDE PDF */}
          <div className="flex justify-center mb-6">
            <div className="relative" style={{ width: '240px', height: '120px' }}>
              <Image
                src="/fluidpower_logo_transparent.gif"
                alt="Fluid Power Group"
                width={240}
                height={120}
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Page Title - NOW INSIDE PDF */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center px-8 py-3 rounded-full text-white text-lg font-semibold"
              style={{
                background: COLORS.grey.dark,
              }}
            >
              ORDER CONFIRMATION
            </div>
          </div>

          {/* Main Content Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(200, 200, 200, 0.3)',
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* ========== STEP 1: TRACTOR INFORMATION ========== */}
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                Step 1: Tractor Information
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: COLORS.grey.medium }}>Brand:</span>
                  <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                    {config.tractorInfo.brand}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.grey.medium }}>Model:</span>
                  <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                    {config.tractorInfo.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.grey.medium }}>Drive Type:</span>
                  <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                    {config.tractorInfo.driveType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.grey.medium }}>Protection:</span>
                  <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                    {config.tractorInfo.protectionType === 'cab' ? 'Cabin' : 'ROPS'}
                  </span>
                </div>
              </div>
            </div>

            {/* ========== STEP 2: VALVE SETUP ========== */}
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                Step 2: Valve Setup
              </h3>
              <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                  <Image
                    src={`/trac360/${config.tractorInfo.protectionType?.toUpperCase()}_(${config.valveSetup.code}).jpg`}
                    alt={`Setup ${config.valveSetup.code}`}
                    width={120}
                    height={90}
                    className="rounded"
                    unoptimized
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: COLORS.grey.dark }}>
                    Setup {config.valveSetup.code}
                  </p>
                  <p className="text-xs" style={{ color: COLORS.grey.medium }}>
                    {config.valveSetup.name}
                  </p>
                </div>
              </div>
            </div>

            {/* ========== STEP 3: OPERATION TYPE ========== */}
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                Step {stepNumbers.operationType}: Operation Type
              </h3>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0" style={{ width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Image
                    src={config.operationType.image}
                    alt={config.operationType.name}
                    width={120}
                    height={90}
                    className="rounded"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-2" style={{ color: COLORS.grey.dark }}>
                        {config.operationType.name}
                      </p>
                      <div className="space-y-0.5">
                        {config.operationType.components.map((component, index) => (
                          <div key={index} className="text-xs flex items-start gap-1.5" style={{ color: COLORS.grey.medium }}>
                            <span style={{ color: COLORS.yellow.primary }}>•</span>
                            <span>{component}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* ✅ Always show base price */}
                    {circuitsPrice > 0 && (
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-bold text-sm" style={{ color: COLORS.yellow.primary }}>
                          {formatPrice(circuitsPrice)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: COLORS.grey.medium }}>
                          Base Price
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ========== STEP 4: CIRCUITS (Conditional - only if selected) ========== */}
            {config.circuits && (
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                  Step {stepNumbers.circuits}: Circuits
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: COLORS.grey.dark }}>
                      {config.circuits.circuits}-Circuit
                    </p>
                    <p className="text-xs" style={{ color: COLORS.grey.medium }}>
                      {config.circuits.description}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-bold text-sm" style={{ color: COLORS.yellow.primary }}>
                      {formatPrice(circuitsPrice)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========== STEPS 5-9: ADD-ONS ========== */}
            {config.addons.length > 0 && (
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                  Steps {stepNumbers.addons}-{stepNumbers.addons + 4}: Add-ons
                </h3>
                <div className="space-y-2.5">
                  {config.addons.map((addon) => {
                    let addonPrice = addon.basePrice || 0;
                    let subOptionName = '';
                    
                    if (addon.selectedSubOption && addon.subOptions) {
                      const subOption = addon.subOptions.find(opt => opt.id === addon.selectedSubOption);
                      if (subOption) {
                        addonPrice += subOption.additionalPrice || 0;
                        subOptionName = subOption.name;
                      }
                    }

                    return (
                      <div key={addon.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                        {/* Addon Image - Only show if image property exists */}
                        {(addon as any).image && (
                          <div className="flex-shrink-0">
                            <Image
                              src={(addon as any).image}
                              alt={addon.name}
                              width={60}
                              height={60}
                              className="rounded"
                              unoptimized
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-0.5" style={{ color: COLORS.grey.dark }}>
                            {addon.name}
                          </p>
                          {subOptionName && subOptionName !== addon.description && (
                            <p className="text-xs" style={{ color: COLORS.grey.medium }}>
                              {subOptionName}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right" style={{ minWidth: "70px" }}>
                            <p className="font-bold text-sm" style={{ color: COLORS.yellow.primary }}>
                              {formatPrice(addonPrice)}
                            </p>
                          </div>
                          {/* DELETE BUTTON - Hidden in PDF with pdf-hide-button class */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove ${addon.name} from your configuration?`)) {
                                removeAddon(addon.id);
                              }
                            }}
                            className="pdf-hide-button p-1 rounded-lg border transition-colors flex-shrink-0"
                            style={{
                              border: '1px solid rgba(220, 38, 38, 0.3)',
                              background: 'rgba(254, 226, 226, 0.8)',
                              color: '#dc2626',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(254, 226, 226, 0.8)';
                              e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                            }}
                            aria-label={`Remove ${addon.name}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========== ADDITIONAL INFORMATION ========== */}
            {config.additionalInfo && config.additionalInfo.trim() && (
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
                  Additional Information
                </h3>
                <div
                  className="p-3 rounded-lg text-xs whitespace-pre-wrap"
                  style={{
                    background: 'rgba(250, 204, 21, 0.05)',
                    border: '1px solid rgba(250, 204, 21, 0.2)',
                    color: COLORS.grey.dark,
                  }}
                >
                  {config.additionalInfo}
                </div>
              </div>
            )}

            {/* ========== PRICE BREAKDOWN ========== */}
            <div className="p-5 bg-gray-50">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.grey.dark }}>
                Price Breakdown
              </h3>
              <div className="space-y-1.5 text-xs mb-3">
                {config.circuits && (
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.grey.medium }}>
                      Circuits ({config.circuits.circuits}-Circuit):
                    </span>
                    <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                      {formatPrice(circuitsPrice)}
                    </span>
                  </div>
                )}
                {config.addons.length > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.grey.medium }}>
                      Add-ons ({config.addons.length} items):
                    </span>
                    <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                      {formatPrice(addonsTotal)}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-3 border-t-2" style={{ borderColor: COLORS.yellow.primary }}>
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold" style={{ color: COLORS.grey.dark }}>
                    TOTAL:
                  </span>
                  <span className="text-xl font-bold" style={{ color: COLORS.yellow.primary }}>
                    {formatPrice(config.totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* PDF CAPTURE ENDS HERE */}

        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 mb-6"
          >
            <div
              className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl"
              style={{
                background: 'rgba(34, 197, 94, 0.9)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(22, 163, 74, 0.9)',
                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17L4 12"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-lg font-bold text-white">
                Item added to cart successfully!
              </span>
            </div>
          </motion.div>
        )}

        {/* ========== ACTION BUTTONS ========== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 mb-12"
        >
          {!addedToCart ? (
            <div className="flex justify-center">
              <motion.button
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="relative overflow-hidden transition-all duration-300 ease-out"
                style={{
                  cursor: isAddingToCart ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 40px',
                  borderRadius: '40px',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: isAddingToCart ? COLORS.grey.medium : '#000',
                  textDecoration: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  minWidth: '200px',
                  background: isAddingToCart
                    ? 'rgba(200, 200, 200, 0.5)'
                    : `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                  backdropFilter: 'blur(15px)',
                  border: isAddingToCart
                    ? '1px solid rgba(200, 200, 200, 0.3)'
                    : '1px solid rgba(255, 215, 0, 0.9)',
                  boxShadow: isAddingToCart
                    ? 'none'
                    : `0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8)`,
                  opacity: isAddingToCart ? 0.6 : 1,
                }}
                whileHover={!isAddingToCart ? { scale: 1.02 } : {}}
                whileTap={!isAddingToCart ? { scale: 0.98 } : {}}
              >
                {isAddingToCart ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding to Cart...
                  </span>
                ) : (
                  'Add to Cart'
                )}
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                onClick={handlePlaceNewOrder}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden transition-all duration-300 ease-out"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 32px',
                  borderRadius: '40px',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#000',
                  textDecoration: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  minWidth: '180px',
                  background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 215, 0, 0.9)',
                  boxShadow: `
                    0 6px 20px rgba(250, 204, 21, 0.4),
                    inset 0 2px 0 rgba(255, 255, 255, 0.8),
                    inset 0 3px 8px rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                  `,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 215, 0, 1) 20%, rgba(250, 204, 21, 0.9) 60%, rgba(255, 235, 59, 0.9) 100%), rgba(255, 215, 0, 0.8)`;
                  e.currentTarget.style.boxShadow = `
                    0 10px 30px rgba(250, 204, 21, 0.6),
                    inset 0 2px 0 rgba(255, 255, 255, 0.9),
                    inset 0 4px 12px rgba(255, 255, 255, 0.5),
                    inset 0 -1px 0 rgba(255, 215, 0, 0.6)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                  e.currentTarget.style.boxShadow = `
                    0 6px 20px rgba(250, 204, 21, 0.4),
                    inset 0 2px 0 rgba(255, 255, 255, 0.8),
                    inset 0 3px 8px rgba(255, 255, 255, 0.4),
                    inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                  `;
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Glass shine effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1px',
                    left: '8px',
                    right: '8px',
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 215, 0, 0.2) 100%)',
                    borderRadius: '40px 40px 20px 20px',
                    pointerEvents: 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
                Place New Order
              </motion.button>

              <motion.button
                onClick={() => {
                  window.location.href = '/suite360';
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden transition-all duration-300 ease-out"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px 32px',
                  borderRadius: '40px',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#fff',
                  textDecoration: 'none',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  minWidth: '180px',
                  background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    0 4px 15px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 2px 8px rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                  `,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0.9) 70%, rgba(245, 245, 245, 0.95) 100%), rgba(255, 255, 255, 0.9)`;
                  e.currentTarget.style.border = '1px solid rgba(200, 200, 200, 0.8)';
                  e.currentTarget.style.color = '#000';
                  e.currentTarget.style.boxShadow = `
                    0 10px 30px rgba(0, 0, 0, 0.2),
                    inset 0 2px 0 rgba(255, 255, 255, 1),
                    inset 0 3px 10px rgba(255, 255, 255, 0.8),
                    inset 0 -1px 0 rgba(200, 200, 200, 0.4)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                  e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`;
                  e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = `
                    0 4px 15px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.3),
                    inset 0 2px 8px rgba(255, 255, 255, 0.1),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                  `;
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Glass shine effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: '1px',
                    left: '8px',
                    right: '8px',
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
                    borderRadius: '40px 40px 20px 20px',
                    pointerEvents: 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
                Browse Products
              </motion.button>
            </div>
          )}
        </motion.div>

        {!addedToCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm mb-8"
            style={{ color: COLORS.grey.medium }}
          >
            Review your configuration above and choose an action to proceed.
          </motion.div>
        )}
      </div>
    </div>
  );
}