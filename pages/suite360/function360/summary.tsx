/**
 * FUNCTION360 Order Confirmation Page - Step 9 (Final)
 * Based on TRAC360 design with uniform styling
 * - Logo included in PDF
 * - Single page layout
 * - Delete buttons hidden in PDF
 * - Component removal capability
 */

import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { usePDF } from 'react-to-pdf';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useFunction360 } from '../../../context/Function360Context';
import { CartContext } from '../../../context/CartWrapper';
import { COLORS } from '../../../components/Trac360/styles';
import type { Function360Config, SelectedComponents } from '../../../types/function360';
import Function360OptionsGate from '../../../components/Function360/Layout/Function360OptionsGate';

function Function360OrderConfirmationInner({ options }: { options: any }) {
  const diverterValveData = options.components.diverterValve;
  const quickCouplingsData = options.components.quickCouplings;
  const adaptorsData = options.components.adaptors;
  const hydraulicHosesData = options.components.hydraulicHoses;
  const electricalData = options.components.electrical;
  const mountingBracketsData = options.components.mountingBrackets;
  const router = useRouter();
  const { config, resetConfig, toggleComponent } = useFunction360();
  const { addItem } = useContext(CartContext);

  // PDF Generation
  const { toPDF, targetRef } = usePDF({
    filename: `FUNCTION360-Order-${Date.now()}.pdf`,
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

  // Wait for context to hydrate
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle back
  const handleBack = () => {
    router.push('/suite360/function360/additional-notes');
  };

  // Helper functions to get variant keys (same as component pages)
const getDiverterValveVariant = (horsepower: string | null, functionType: string | null): string => {
  if (!horsepower || !functionType) return 'electric_3rd_below_50hp';
  const hpSuffix = horsepower === 'below_50hp' ? 'below_50hp' : 'above_50hp';
  if (functionType === 'live_3rd') return `live_3rd_${hpSuffix}`;
  if (functionType === 'electric_3rd_4th') return `electric_3rd_4th_${hpSuffix}`;
  return `electric_3rd_${hpSuffix}`;
};

const getQuickCouplingsVariant = (horsepower: string | null, functionType: string | null): string => {
  if (!horsepower || !functionType) return 'default_below_50hp';
  const hpSuffix = horsepower === 'below_50hp' ? 'below_50hp' : 'above_50hp';
  if (functionType === 'electric_3rd_4th') return `electric_3rd_4th_${hpSuffix}`;
  return `default_${hpSuffix}`;
};

const getAdaptorsVariant = (horsepower: string | null): string => {
  if (!horsepower) return 'below_50hp';
  return horsepower === 'above_50hp' ? 'above_50hp' : 'below_50hp';
};

const getHydraulicHosesVariant = (horsepower: string | null): string => {
  if (!horsepower) return 'below_50hp';
  return horsepower === 'above_50hp' ? 'above_50hp' : 'below_50hp';
};

const getElectricalVariant = (functionType: string | null): string => {
  if (!functionType) return 'electric_3rd';
  return functionType === 'electric_3rd_4th' ? 'electric_3rd_4th' : 'electric_3rd';
};

const getMountingBracketsVariant = (functionType: string | null): string => {
  if (!functionType) return 'default';
  return functionType === 'electric_3rd_4th' ? 'electric_3rd_4th' : 'default';
};

  // Component data for display with images
  // Get dynamic component details based on equipment selection
  const getComponentDetails = (): Record<keyof SelectedComponents, { name: string; price: number; image: string }> => {
    const { horsepower, functionType } = config.equipment;
    
    return {
      diverterValve: {
        name: 'Solenoid Diverter Valve',
        price: config.componentPrices.diverterValve || 0,  // ✅ Dynamic from context
        image: (diverterValveData.variants as any)[getDiverterValveVariant(horsepower, functionType)]?.image || '/function360/diverter-valve.png'
      },
      quickCouplings: {
        name: 'Quick Couplings',
        price: config.componentPrices.quickCouplings || 0,  // ✅ Dynamic from context
        image: (quickCouplingsData.variants as any)[getQuickCouplingsVariant(horsepower, functionType)]?.image || '/function360/quick-couplings.png'
      },
      adaptors: {
        name: 'Adaptors',
        price: config.componentPrices.adaptors || 0,  // ✅ Dynamic from context
        image: (adaptorsData.variants as any)[getAdaptorsVariant(horsepower)]?.image || '/function360/adaptors.png'
      },
      hydraulicHoses: {
        name: 'Hydraulic Hoses',
        price: config.componentPrices.hydraulicHoses || 0,  // ✅ Dynamic from context
        image: (hydraulicHosesData.variants as any)[getHydraulicHosesVariant(horsepower)]?.image || '/function360/hydraulic-hoses.png'
      },
      electrical: {
        name: 'Electrical Wiring & Joystick',
        price: config.componentPrices.electrical || 0,  // ✅ Dynamic from context
        image: (electricalData.variants as any)[getElectricalVariant(functionType)]?.image || '/function360/electrical.png'
      },
      mountingBrackets: {
        name: 'Mounting Brackets',
        price: config.componentPrices.mountingBrackets || 0,
        image: (mountingBracketsData.variants as any)[getMountingBracketsVariant(functionType)]?.image || '/function360/mounting-bracket.png'
      },
    };
  };

  const componentDetails = getComponentDetails();

  // Get selected components list
  const selectedComponents = Object.entries(config.selectedComponents)
    .filter(([_, isSelected]) => isSelected)
    .map(([key]) => ({
      key: key as keyof SelectedComponents,
      ...componentDetails[key as keyof SelectedComponents],
    }));

  // ============================================================================
  // ACTION HANDLER - Add to Cart with PDF Generation
  // ============================================================================

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    try {
      console.log('🛒 Starting Add to Cart process...');
      console.log('📊 Current config:', config);
      
      const originalElement = targetRef.current;
      
      if (!originalElement) {
        throw new Error('PDF content element not found');
      }

      // Import libraries dynamically
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // CREATE HIDDEN CLONE FOR PDF CAPTURE
      const clone = originalElement.cloneNode(true) as HTMLElement;
      
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.minWidth = '800px';
      clone.style.width = '800px';
      clone.style.background = '#ffffff';
      clone.style.padding = '30px 20px';
      clone.style.zIndex = '-1000';
      
      // Hide delete buttons in clone
      const deleteButtonsInClone = clone.querySelectorAll('.pdf-hide-button');
      deleteButtonsInClone.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });
      
      document.body.appendChild(clone);
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('📸 Capturing clone as canvas...');
      
      const canvas = await html2canvas(clone, {
        scale: 1.3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowHeight: clone.scrollHeight,
        windowWidth: 800,
      });

      console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);

      document.body.removeChild(clone);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 5;
      
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;
      
      if (imgHeight > (pdfHeight - margin * 2)) {
        const scale = (pdfHeight - margin * 2) / imgHeight;
        finalHeight = pdfHeight - (margin * 2);
        finalWidth = imgWidth * scale;
      }

      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      
      console.log('📄 Adding image to PDF as single page...');

      const xOffset = (pdfWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, margin, finalWidth, finalHeight, undefined, 'FAST');

      const pdfDataUrl = pdf.output('dataurlstring');
      
      console.log('✅ PDF generated successfully');
      console.log(`📦 PDF size: ${Math.round(pdfDataUrl.length / 1024)}KB`);

      // Create cart item
      const cartItem = {
        id: 'function-360',
        type: 'function360_order' as const,
        name: 'FUNCTION360 Custom Order',
        totalPrice: config.totalPrice,
        quantity: 1,
        stock: 999,
        image: 'https://cdn.swell.store/fluidpowergroup/6957bb3c051b2b001230beb7/64c31c423d0e72f488e9f09c3bd687a2/Function360.png',
        pdfDataUrl: pdfDataUrl,
        configuration: config,
        cartId: Date.now(),
      };
      
      console.log('📦 Cart item created:', {
        id: cartItem.id,
        type: cartItem.type,
        name: cartItem.name,
        totalPrice: cartItem.totalPrice,
        hasPDF: !!cartItem.pdfDataUrl,
      });
      
      addItem(cartItem);
      
      console.log('✅ Item added to cart successfully');
      
      setAddedToCart(true);
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      
      const clones = document.querySelectorAll('[style*="-9999px"]');
      clones.forEach(clone => {
        if (clone.parentNode) {
          clone.parentNode.removeChild(clone);
        }
      });
      
      alert(`Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle "Browse Products"
  const handleBrowseProducts = () => {
    console.log('🛍️ Navigating to catalogue...');
    router.push('/catalogue');
  };

  // Format price
  const formatPrice = (price: number) => `A$${price.toFixed(2)}`;

  // Redirect if configuration incomplete
  useEffect(() => {
    if (isHydrated) {
      const hasEquipment = Boolean(config.equipment.horsepower && config.equipment.functionType);
      
      if (!hasEquipment) {
        console.log('[FUNCTION360] Config incomplete, redirecting...');
        router.push('/suite360/function360/equipment');
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

  const hasEssentialConfig = config.equipment.horsepower && config.equipment.functionType;
  
  if (!hasEssentialConfig) {
    return null;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen pb-12">
      <BackButton onClick={handleBack} />

      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* PDF CAPTURE STARTS HERE */}
        <div ref={targetRef} style={{ background: '#ffffff', padding: '30px 20px' }}>
          
          {/* Logo */}
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

          {/* Page Title */}
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
            {/* ========== STEP 1: EQUIPMENT SELECTION ========== */}
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                Step 1: Equipment Selection
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: COLORS.grey.medium }}>Horsepower:</span>
                  <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                    {config.equipment.horsepower === 'above_50hp' ? 'Above 50HP' : 'Below 50HP'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: COLORS.grey.medium }}>Function Type:</span>
                  <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                    {config.equipment.functionType === 'electric_3rd' ? 'Electric 3rd Function' :
                     config.equipment.functionType === 'live_3rd' ? 'Live 3rd Function' :
                     'Electric 3rd & 4th Function'}
                  </span>
                </div>
              </div>
            </div>

            {/* ========== STEPS 2-7: SELECTED COMPONENTS ========== */}
            {selectedComponents.length > 0 && (
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.yellow.primary }}>
                  Steps 2-7: Selected Components
                </h3>
                <div className="space-y-2.5">
                {selectedComponents.map((component) => (
                  <div key={component.key} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    {/* Component Thumbnail */}
                    <div className="flex-shrink-0">
                      <Image
                        src={component.image}
                        alt={component.name}
                        width={60}
                        height={60}
                        className="rounded"
                        unoptimized
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: COLORS.grey.dark }}>
                        {component.name}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right" style={{ minWidth: "70px" }}>
                        <p className="font-bold text-sm" style={{ color: COLORS.yellow.primary }}>
                          {formatPrice(component.price)}
                        </p>
                      </div>
                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${component.name} from your configuration?`)) {
                              toggleComponent(component.key);
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
                          aria-label={`Remove ${component.name}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========== STEP 8: ADDITIONAL NOTES ========== */}
            {config.additionalNotes && config.additionalNotes.trim() && (
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: COLORS.yellow.primary }}>
                  Step 8: Additional Notes
                </h3>
                <div
                  className="p-3 rounded-lg text-xs whitespace-pre-wrap"
                  style={{
                    background: 'rgba(250, 204, 21, 0.05)',
                    border: '1px solid rgba(250, 204, 21, 0.2)',
                    color: COLORS.grey.dark,
                  }}
                >
                  {config.additionalNotes}
                </div>
              </div>
            )}

            {/* ========== PRICE BREAKDOWN ========== */}
            <div className="p-5 bg-gray-50">
              <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: COLORS.grey.dark }}>
                Price Breakdown
              </h3>
              <div className="space-y-1.5 text-xs mb-3">
                {selectedComponents.length > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: COLORS.grey.medium }}>
                      Components ({selectedComponents.length} items):
                    </span>
                    <span className="font-semibold" style={{ color: COLORS.grey.dark }}>
                      {formatPrice(config.totalPrice)}
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
                  minWidth: '200px',
                  background: isAddingToCart
                    ? 'rgba(200, 200, 200, 0.5)'
                    : `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                  backdropFilter: 'blur(15px)',
                  border: isAddingToCart ? '1px solid rgba(200, 200, 200, 0.3)' : '1px solid rgba(255, 215, 0, 0.9)',
                  boxShadow: isAddingToCart ? 'none' : `0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8)`,
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
                onClick={() => {
                  window.location.href = '/suite360';
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden transition-all duration-300 ease-out"
                style={{
                  cursor: 'pointer',
                  padding: '14px 32px',
                  borderRadius: '40px',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#000',
                  minWidth: '180px',
                  background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 215, 0, 0.9)',
                  boxShadow: `0 6px 20px rgba(250, 204, 21, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.8)`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Place New Order
              </motion.button>

              <motion.button
                onClick={handleBrowseProducts}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden transition-all duration-300 ease-out"
                style={{
                  cursor: 'pointer',
                  padding: '14px 32px',
                  borderRadius: '40px',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#fff',
                  minWidth: '180px',
                  background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)`,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
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

export default function Function360OrderConfirmation() {
  return (
    <Function360OptionsGate>
      {(options) => <Function360OrderConfirmationInner options={options} />}
    </Function360OptionsGate>
  );
}