/**
 * TRAC360 Tractor Info Page - Step 1 of 10
 * Collect tractor details: brand, model, drive type, protection type
 * Enhanced to allow custom brand/model entries
 * FIXED: Mobile dropdown positioning
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Trac360Layout from '../../../components/Trac360/Layout/Trac360Layout';
import SelectionCard from '../../../components/Trac360/SelectionCard';
import ContinueButton from '../../../components/Trac360/Shared/ContinueButton';
import BackButton from '../../../components/Trac360/Shared/BackButton';
import { useTrac360 } from '../../../context/Trac360Context';
import tractorData from '../../../data/trac360/tractors.json';
import { COLORS, fadeIn } from '../../../components/Trac360/styles';

export default function TractorInfo() {
    const router = useRouter();
    const { config, updateTractorInfo } = useTrac360();
  
    // Local state for form fields
    const [brandInput, setBrandInput] = useState<string>(config.tractorInfo.brand || '');
    const [modelInput, setModelInput] = useState<string>(config.tractorInfo.model || '');
    const [driveType, setDriveType] = useState<'2WD' | '4WD' | null>(config.tractorInfo.driveType);
    const [protectionType, setProtectionType] = useState<'cab' | 'rops' | null>(config.tractorInfo.protectionType);
  
    // Dropdown states
    const [showBrandDropdown, setShowBrandDropdown] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
  
    // Filtered brand suggestions
    const filteredBrands = useMemo(() => {
      if (!brandInput) return tractorData.brands;
      return tractorData.brands.filter(brand =>
        brand.toLowerCase().includes(brandInput.toLowerCase())
      );
    }, [brandInput]);
  
    // Available models based on selected brand
    const availableModels = useMemo(() => {
      const exactBrandMatch = tractorData.brands.find(
        brand => brand.toLowerCase() === brandInput.toLowerCase()
      );
      if (exactBrandMatch && tractorData.models[exactBrandMatch as keyof typeof tractorData.models]) {
        return tractorData.models[exactBrandMatch as keyof typeof tractorData.models];
      }
      return [];
    }, [brandInput]);
  
    // Filtered model suggestions
    const filteredModels = useMemo(() => {
      if (!modelInput) return availableModels;
      return availableModels.filter(model =>
        model.toLowerCase().includes(modelInput.toLowerCase())
      );
    }, [modelInput, availableModels]);
  
    // Check if brand exists in predefined list (exact match)
    const isExistingBrand = tractorData.brands.some(
      brand => brand.toLowerCase() === brandInput.toLowerCase()
    );
  
    // Check if model exists in predefined list (exact match)
    const isExistingModel = availableModels.some(
      model => model.toLowerCase() === modelInput.toLowerCase()
    );
  
    // Brand is valid if user has typed something (custom entry allowed)
    const isValidBrand = Boolean(brandInput.trim());
  
    // Model is valid if user has typed something (custom entry allowed)
    const isValidModel = Boolean(modelInput.trim());
  
    // Validation - all fields must be filled
    const isValid = Boolean(isValidBrand && isValidModel && driveType && protectionType);
  
    // Handle brand selection
    const handleBrandSelect = (brand: string) => {
      setBrandInput(brand);
      setModelInput(''); // Clear model when brand changes
      setShowBrandDropdown(false);
    };
  
    // Handle model selection
    const handleModelSelect = (model: string) => {
      setModelInput(model);
      setShowModelDropdown(false);
    };
  
    // Handle continue
    const handleContinue = () => {
      if (!isValid) return;
  
      // Trim inputs to remove extra whitespace
      const finalBrand = brandInput.trim();
      const finalModel = modelInput.trim();
  
      // Update context with either existing or custom values
      updateTractorInfo({
        brand: finalBrand,
        model: finalModel,
        driveType,
        protectionType,
      });
  
      // Navigate to next step
      router.push('/suite360/trac360/valve-setup');
    };
  
    // Handle back
    const handleBack = () => {
      router.push('/suite360/trac360/start');
    };
  
    // Close dropdowns when clicking outside
    useEffect(() => {
      const handleClickOutside = () => {
        setShowBrandDropdown(false);
        setShowModelDropdown(false);
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }, []);
  
    // Show "Add custom" option in brand dropdown
    const showAddCustomBrand = brandInput && !isExistingBrand && filteredBrands.length === 0;
  
    // Show "Add custom" option in model dropdown
    const showAddCustomModel = modelInput && !isExistingModel && filteredModels.length === 0;
  
    return (
      <Trac360Layout currentStep={1} totalSteps={10}>
        {/* Back Button */}
        <BackButton onClick={handleBack} />
  
        <div className="max-w-2xl mx-auto px-4">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative w-60 h-60">
              <Image
                src="/fluidpower_logo_transparent.gif"
                alt="Fluid Power Group"
                width={240}
                height={240}
                className="object-contain"
                unoptimized
              />
            </div>
          </motion.div>
  
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div
              className="inline-block px-8 py-3 rounded-full text-white text-lg font-semibold"
              style={{
                background: COLORS.grey.dark,
              }}
            >
              TRACTOR INFORMATION
            </div>
          </motion.div>
  
          {/* Form Fields */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Brand Autocomplete Input */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div
                className="w-full px-4 py-4 text-center rounded-full cursor-text"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `2px solid ${isValidBrand ? COLORS.yellow.primary : 'rgba(255, 255, 255, 0.8)'}`,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: COLORS.grey.medium }}>
                  TRACTOR BRAND *
                </div>
                <input
                  type="text"
                  value={brandInput}
                  onChange={(e) => {
                    setBrandInput(e.target.value);
                    setShowBrandDropdown(true);
                  }}
                  onFocus={() => setShowBrandDropdown(true)}
                  placeholder="Enter Brand i.e. John Deere"
                  className="w-full text-center text-base font-medium bg-transparent border-none outline-none"
                  style={{ color: COLORS.grey.dark }}
                />
              </div>
              
              {/* Brand Dropdown - FIXED POSITIONING FOR MOBILE */}
              {showBrandDropdown && (filteredBrands.length > 0 || showAddCustomBrand) && (
                <div
                  className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                    maxHeight: '240px',
                    overflowY: 'auto',
                  }}
                >
                  {/* Existing brands */}
                  {filteredBrands.map((brand) => (
                    <div
                      key={brand}
                      onClick={() => handleBrandSelect(brand)}
                      className="px-4 py-3 cursor-pointer transition-colors"
                      style={{
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(250, 204, 21, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="font-medium" style={{ color: COLORS.grey.dark }}>
                        {brand}
                      </span>
                    </div>
                  ))}
                  
                  {/* Add custom brand option */}
                  {showAddCustomBrand && (
                    <div
                      onClick={() => {
                        setShowBrandDropdown(false);
                      }}
                      className="px-4 py-3 cursor-pointer transition-colors"
                      style={{
                        borderTop: filteredBrands.length > 0 ? '2px solid rgba(250, 204, 21, 0.3)' : 'none',
                        background: 'rgba(250, 204, 21, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(250, 204, 21, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(250, 204, 21, 0.05)';
                      }}
                    >
                      <span className="font-semibold" style={{ color: COLORS.yellow.primary }}>
                      ✓ Add &quot;{brandInput}&quot;
                      </span>
                      <span className="text-xs block mt-1" style={{ color: COLORS.grey.medium }}>
                        (Custom brand)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
  
            {/* Model Autocomplete Input */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div
                className="w-full px-4 py-4 text-center rounded-full cursor-text"
                style={{
                  background: isValidBrand ? 'rgba(255, 255, 255, 0.7)' : 'rgba(245, 245, 245, 0.5)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `2px solid ${isValidModel ? COLORS.yellow.primary : 'rgba(255, 255, 255, 0.8)'}`,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                  opacity: isValidBrand ? 1 : 0.6,
                }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: COLORS.grey.medium }}>
                  TRACTOR MODEL *
                </div>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => {
                    setModelInput(e.target.value);
                    setShowModelDropdown(true);
                  }}
                  onFocus={() => isValidBrand && setShowModelDropdown(true)}
                  disabled={!isValidBrand}
                  placeholder={isValidBrand ? 'Enter Model i.e. 5055E' : 'Select a brand first'}
                  className="w-full text-center text-base font-medium bg-transparent border-none outline-none disabled:cursor-not-allowed"
                  style={{ color: COLORS.grey.dark }}
                />
              </div>
              
              {/* Model Dropdown - FIXED POSITIONING FOR MOBILE */}
              {showModelDropdown && isValidBrand && (filteredModels.length > 0 || showAddCustomModel) && (
                <div
                  className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)',
                    maxHeight: '240px',
                    overflowY: 'auto',
                  }}
                >
                  {/* Existing models */}
                  {filteredModels.map((model) => (
                    <div
                      key={model}
                      onClick={() => handleModelSelect(model)}
                      className="px-4 py-3 cursor-pointer transition-colors"
                      style={{
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(250, 204, 21, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span className="font-medium" style={{ color: COLORS.grey.dark }}>
                        {model}
                      </span>
                    </div>
                  ))}
                  
                  {/* Add custom model option */}
                  {showAddCustomModel && (
                    <div
                      onClick={() => {
                        setShowModelDropdown(false);
                      }}
                      className="px-4 py-3 cursor-pointer transition-colors"
                      style={{
                        borderTop: filteredModels.length > 0 ? '2px solid rgba(250, 204, 21, 0.3)' : 'none',
                        background: 'rgba(250, 204, 21, 0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(250, 204, 21, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(250, 204, 21, 0.05)';
                      }}
                    >
                      <span className="font-semibold" style={{ color: COLORS.yellow.primary }}>
                      ✓ Add &quot;{modelInput}&quot;
                      </span>
                      <span className="text-xs block mt-1" style={{ color: COLORS.grey.medium }}>
                        (Custom model)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
  
            {/* Drive Type Dropdown */}
            <div className="relative">
              <div
                className="w-full px-4 py-4 text-center rounded-full cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `2px solid ${driveType ? COLORS.yellow.primary : 'rgba(255, 255, 255, 0.8)'}`,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: COLORS.grey.medium }}>
                  DRIVE TYPE *
                </div>
                <select
                  value={driveType || ''}
                  onChange={(e) => setDriveType(e.target.value as '2WD' | '4WD')}
                  className="w-full text-center text-base font-medium bg-transparent border-none outline-none cursor-pointer appearance-none"
                  style={{ color: COLORS.grey.dark }}
                >
                  <option value="" disabled>2WD or 4WD</option>
                  {tractorData.driveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
  
            {/* Protection Type Dropdown */}
            <div className="relative">
              <div
                className="w-full px-4 py-4 text-center rounded-full cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `2px solid ${protectionType ? COLORS.yellow.primary : 'rgba(255, 255, 255, 0.8)'}`,
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: COLORS.grey.medium }}>
                  PROTECTION TYPE *
                </div>
                <select
                  value={protectionType || ''}
                  onChange={(e) => setProtectionType(e.target.value as 'cab' | 'rops')}
                  className="w-full text-center text-base font-medium bg-transparent border-none outline-none cursor-pointer appearance-none"
                  style={{ color: COLORS.grey.dark }}
                >
                  <option value="" disabled>CABIN or ROPS</option>
                  {tractorData.protectionTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
  
          {/* Continue Button - Centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mt-12"
          >
            <ContinueButton
              onClick={handleContinue}
              disabled={!isValid}
            />
          </motion.div>
  
          {/* Required Fields Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-4 text-sm"
            style={{ color: COLORS.grey.medium }}
          >
            Fields marked with <span style={{ color: COLORS.yellow.primary }}>*</span> need to be completed to continue
          </motion.div>
        </div>
      </Trac360Layout>
    );
  }