import React, { useState, useRef } from 'react';
import leafPresetImg from '../assets/leaf_sample.png';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button';

export default function ScanView({ onStartAnalysis, isSubmitting }) {

  const [formData, setFormData] = useState({
    image: null,
    imagePreview: null,
    imageMeta: { name: '', size: '' },
    // Core ML Yield Inputs
    fertilizer: '120.5',
    temperature: '24.5',
    n: '40.0',
    p: '30.0',
    k: '20.0',
    // UI Metadata & Farm Profile
    crop: 'Auto-detect',
    soilType: 'Loamy',
    soilPH: '6.4',
    farmArea: '3.5',
    rainfall: '65',
    location: 'Guntur, Andhra Pradesh',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const hasValidExtension = /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!validMimeTypes.includes(file.type) && !hasValidExtension) {
      setFieldErrors((prev) => ({
        ...prev,
        image: 'Unsupported format. Please upload JPG, PNG, or WEBP.',
      }));
      return;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    const formattedSize = formatBytes(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: e.target.result,
        imageMeta: { name: file.name, size: formattedSize },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
      imageMeta: { name: '', size: '' },
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleUsePreset = async () => {
    setFieldErrors({});
    try {
      let blob = null;
      try {
        const res = await fetch(leafPresetImg);
        blob = await res.blob();
      } catch (_) {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#2e9e5b';
        ctx.fillRect(0, 0, 400, 300);
        blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      }

      const presetFile = new File([blob], 'tomato_early_blight_sample.png', {
        type: 'image/png',
      });

      setFormData((prev) => ({
        ...prev,
        image: presetFile,
        imagePreview: leafPresetImg,
        imageMeta: { name: 'tomato_early_blight_sample.png', size: formatBytes(blob.size) },
        crop: 'Tomato',
        temperature: '26.5',
        fertilizer: '120.0',
        n: '50.0',
        p: '35.0',
        k: '25.0',
        location: 'Guntur, Andhra Pradesh',
      }));
    } catch (err) {
      console.warn('Preset loader notice:', err);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.image) {
      errors.image = 'Please upload or select a crop leaf image to analyze.';
    }
    const fertNum = parseFloat(formData.fertilizer);
    if (isNaN(fertNum) || fertNum < 0 || fertNum > 500) {
      errors.fertilizer = 'Fertilizer must be between 0 and 500 kg/ha';
    }
    const tempNum = parseFloat(formData.temperature);
    if (isNaN(tempNum) || tempNum < -10 || tempNum > 60) {
      errors.temperature = 'Temperature must be between -10°C and 60°C';
    }
    const nNum = parseFloat(formData.n);
    if (isNaN(nNum) || nNum < 0 || nNum > 300) {
      errors.n = 'Nitrogen (N) must be between 0 and 300';
    }
    const pNum = parseFloat(formData.p);
    if (isNaN(pNum) || pNum < 0 || pNum > 300) {
      errors.p = 'Phosphorus (P) must be between 0 and 300';
    }
    const kNum = parseFloat(formData.k);
    if (isNaN(kNum) || kNum < 0 || kNum > 300) {
      errors.k = 'Potassium (K) must be between 0 and 300';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append('image', formData.image);
    payload.append('Fertilizer', parseFloat(formData.fertilizer) || 0);
    payload.append('temp', parseFloat(formData.temperature) || 0);
    payload.append('N', parseFloat(formData.n) || 0);
    payload.append('P', parseFloat(formData.p) || 0);
    payload.append('K', parseFloat(formData.k) || 0);

    if (formData.crop && formData.crop !== 'Auto-detect') {
      payload.append('crop', formData.crop);
    }

    const extraContext = {
      imagePreview: formData.imagePreview,
      imageMeta: formData.imageMeta,
      soilType: formData.soilType,
      soilPH: formData.soilPH,
      farmArea: formData.farmArea,
      rainfall: formData.rainfall,
      selectedCropOption: formData.crop,
    };

    onStartAnalysis(payload, formData.location, extraContext);
  };

  return (
    <div className="view-panel active animate-panel-in" id="view-scan">
      <div className="section-container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        
        {/* Page Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <span className="saas-section-kicker">Multi-Signal Scan</span>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--forest-950)', letterSpacing: '-0.02em', margin: '0.25rem 0 0.5rem 0' }}>
            Crop Health Analysis
          </h1>
          <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', margin: 0 }}>
            Upload a leaf image and provide soil-climate parameters to generate a synthesized report.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="saas-scan-grid">
          
          {/* ================= LEFT COLUMN: DOMINANT UPLOAD AREA ================= */}
          <div>
            <div
              className={`saas-upload-box ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                if (!formData.imagePreview && fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileInputChange}
              />
              <input
                type="file"
                ref={cameraInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
              />

              {formData.imagePreview ? (
                <div>
                  <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', maxHeight: '360px', backgroundColor: '#000', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={formData.imagePreview}
                      alt="Uploaded leaf"
                      style={{ maxHeight: '360px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(5, 26, 15, 0.85)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: '700', color: 'var(--forest-950)' }}>{formData.imageMeta.name}</span>
                    <span>•</span>
                    <span>{formData.imageMeta.size}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="saas-btn-secondary btn-tap"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cameraInputRef.current) cameraInputRef.current.click();
                      }}
                    >
                      📷 Retake Photo
                    </button>
                    <button
                      type="button"
                      className="saas-btn-secondary btn-tap"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.775rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                    >
                      📁 Change File
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '2rem 1rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--leaf-100)',
                    color: 'var(--leaf-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--forest-950)', marginBottom: '0.35rem' }}>
                    Click to upload leaf image or drag &amp; drop
                  </h3>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Supports clear single-leaf images in JPG, PNG, or WEBP (Max 10MB)
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="saas-btn-primary btn-tap"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.825rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        backgroundColor: 'var(--leaf-600)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (cameraInputRef.current) cameraInputRef.current.click();
                      }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Take Photo
                    </button>

                    <button
                      type="button"
                      className="saas-btn-secondary btn-tap"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.825rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                    >
                      <svg style={{ width: '15px', height: '15px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Browse Files
                    </button>
                    
                    <button
                      type="button"
                      className="saas-btn-secondary btn-tap"
                      style={{ padding: '0.45rem 1rem', fontSize: '0.825rem', backgroundColor: 'var(--surface-bg)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUsePreset();
                      }}
                    >
                      🌱 Try Sample Leaf
                    </button>
                  </div>
                </div>
              )}
            </div>

            {fieldErrors.image && (
              <div style={{ color: '#dc2626', fontSize: '0.8125rem', marginTop: '0.5rem', fontWeight: '600' }}>
                ⚠️ {fieldErrors.image}
              </div>
            )}
          </div>

          {/* ================= RIGHT COLUMN: COMPACT ANALYSIS INPUTS ================= */}
          <div className="saas-form-card">
            
            {/* Section 1: Crop & Regional Context */}
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--forest-950)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.85rem' }}>
                1. Target Crop &amp; Location
              </h3>

              <div className="saas-form-group">
                <label className="saas-form-label">Crop Type</label>
                <select
                  className="saas-input"
                  value={formData.crop}
                  onChange={(e) => handleInputChange('crop', e.target.value)}
                >
                  <option value="Auto-detect">Auto-detect Crop (Recommended)</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Corn">Corn (Maize)</option>
                  <option value="Pepper">Pepper (Bell)</option>
                  <option value="Peach">Peach</option>
                  <option value="Apple">Apple</option>
                  <option value="Grape">Grape</option>
                  <option value="Strawberry">Strawberry</option>
                  <option value="Cherry">Cherry</option>
                  <option value="Soybean">Soybean</option>
                </select>
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-form-label">Farm Location (for Live Weather)</label>
                <input
                  type="text"
                  className="saas-input"
                  placeholder="e.g. Guntur, Andhra Pradesh"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>
            </div>

            {/* Section 2: Soil & Weather ML Yield Parameters */}
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <h3 style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--forest-950)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
                  2. Yield Model Features
                </h3>
                <span className="card-badge font-mono" style={{ backgroundColor: 'var(--leaf-100)', color: 'var(--forest-800)', fontSize: '0.675rem' }}>
                  Random Forest
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-form-label">Avg Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="saas-input"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                  />
                  {fieldErrors.temperature && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{fieldErrors.temperature}</span>}
                </div>

                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-form-label">Fertilizer (kg/ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="saas-input"
                    value={formData.fertilizer}
                    onChange={(e) => handleInputChange('fertilizer', e.target.value)}
                  />
                  {fieldErrors.fertilizer && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{fieldErrors.fertilizer}</span>}
                </div>
              </div>

              {/* N-P-K Nutrients */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-form-label">Nitrogen (N)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="saas-input"
                    value={formData.n}
                    onChange={(e) => handleInputChange('n', e.target.value)}
                  />
                </div>
                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-form-label">Phosphorus (P)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="saas-input"
                    value={formData.p}
                    onChange={(e) => handleInputChange('p', e.target.value)}
                  />
                </div>
                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-form-label">Potassium (K)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="saas-input"
                    value={formData.k}
                    onChange={(e) => handleInputChange('k', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Button */}
            {isSubmitting ? (
              <button
                type="submit"
                disabled={true}
                className="saas-btn-primary btn-tap"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  backgroundColor: 'var(--text-muted)',
                }}
              >
                <span className="status-dot green pulse"></span>
                <span>Executing Pipeline...</span>
              </button>
            ) : (
              <div style={{ width: '100%' }}>
                <InteractiveHoverButton
                  type="submit"
                  text="Analyze Crop Health"
                  variant="primary"
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
