import { useState } from 'react';
import Navbar from './components/Navbar';
import FlowBanner from './components/FlowBanner';
import Footer from './components/Footer';
import LandingView from './views/LandingView';
import ScanView from './views/ScanView';
import ProcessingView from './views/ProcessingView';
import CropHealthReport from './views/CropHealthReport';
import ArchitectureView from './views/ArchitectureView';
import ResearchView from './views/ResearchView';
import PlaceholderView from './views/PlaceholderView';
import { API_BASE_URL } from './config/api';
import { getWeatherByLocation } from './services/weatherService';
import './App.css';

const INITIAL_STAGES_STATE = {
  image_validation: { status: 'waiting', details: null },
  leaf_validation: { status: 'waiting', details: null },
  disease_analysis: { status: 'waiting', details: null },
  severity_assessment: { status: 'waiting', details: null },
  yield_prediction: { status: 'waiting', details: null },
  risk_fusion: { status: 'waiting', details: null },
  environmental_context: { status: 'waiting', details: null },
  analysis_complete: { status: 'waiting', details: null },
};

function App() {
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return ['landing', 'scan', 'processing', 'report', 'assistant', 'pipeline', 'research', 'about'].includes(hash)
      ? hash
      : 'landing';
  });

  const [reportData, setReportData] = useState(null);
  const [stagesState, setStagesState] = useState(INITIAL_STAGES_STATE);
  const [processingError, setProcessingError] = useState(null);
  const [mismatchData, setMismatchData] = useState(null);
  const [rejectionData, setRejectionData] = useState(null);
  const [currentImagePreview, setCurrentImagePreview] = useState(null);
  const [currentImageMeta, setCurrentImageMeta] = useState(null);
  const [timingsData, setTimingsData] = useState(null);

  const [lastFormDataPayload, setLastFormDataPayload] = useState(null);
  const [lastLocationQuery, setLastLocationQuery] = useState('');
  const [lastExtraContext, setLastExtraContext] = useState(null);

  const [weatherState, setWeatherState] = useState({
    status: 'idle',
    data: null,
    reason: null,
  });

  const handleNavigate = (view) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartAnalysis = async (formDataPayload, locationQuery, extraContext = {}) => {
    setLastFormDataPayload(formDataPayload);
    setLastLocationQuery(locationQuery);
    setLastExtraContext(extraContext);

    setProcessingError(null);
    setMismatchData(null);
    setRejectionData(null);
    setReportData(null);
    setTimingsData(null);

    setCurrentImagePreview(extraContext.imagePreview || null);
    setCurrentImageMeta(extraContext.imageMeta || null);

    setStagesState({
      image_validation: { status: 'running', details: null },
      leaf_validation: { status: 'waiting', details: null },
      disease_analysis: { status: 'waiting', details: null },
      severity_assessment: { status: 'waiting', details: null },
      yield_prediction: { status: 'waiting', details: null },
      risk_fusion: { status: 'waiting', details: null },
      environmental_context: { status: 'running', details: null },
      analysis_complete: { status: 'waiting', details: null },
    });

    handleNavigate('processing');

    // Trigger weather fetch in parallel
    const weatherPromise = (locationQuery && locationQuery.trim())
      ? getWeatherByLocation(locationQuery)
      : Promise.resolve({ status: 'unavailable', reason: 'No location specified', data: null });

    weatherPromise.then((wRes) => {
      setWeatherState(wRes);
      setStagesState((prev) => ({
        ...prev,
        environmental_context: {
          status: wRes.status === 'success' ? 'complete' : 'unavailable',
          details: wRes.data || null,
        },
      }));
    }).catch((err) => {
      setWeatherState({ status: 'error', reason: err.message, data: null });
      setStagesState((prev) => ({
        ...prev,
        environmental_context: { status: 'unavailable', details: null },
      }));
    });

    // Execute Real ML Pipeline via Streaming endpoint
    try {
      const streamUrl = `${API_BASE_URL}/predict/crop-health/stream`;
      const response = await fetch(streamUrl, {
        method: 'POST',
        body: formDataPayload,
      });

      if (!response.ok) {
        // Fallback to standard endpoint if streaming fails
        const standardRes = await fetch(`${API_BASE_URL}/predict/crop-health`, {
          method: 'POST',
          body: formDataPayload,
        });

        if (!standardRes.ok) {
          let errDetail = `Server returned status code ${standardRes.status}.`;
          try {
            const errJson = await standardRes.json();
            if (errJson.detail) errDetail = errJson.detail;
          } catch (_) {}
          throw new Error(errDetail);
        }

        const fallbackData = await standardRes.json();
        if (fallbackData.image_valid === false || fallbackData.leaf_detected === false) {
          setRejectionData(fallbackData);
          setStagesState((prev) => ({
            ...prev,
            leaf_validation: { status: 'rejected', details: fallbackData },
          }));
          return;
        }

        if (fallbackData.crop_mismatch) {
          setMismatchData(fallbackData);
          return;
        }

        const finalWeather = await weatherPromise;
        setReportData(fallbackData);
        setTimingsData(fallbackData.timings_ms || {});
        // ProcessingView will display sequential 3-stage animation and navigate when user is ready or sequence finishes
        return;
      }

      // Stream SSE parser
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let receivedFinalReport = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const event = JSON.parse(trimmed.slice(6));
              const stage = event.stage;
              const status = event.status;
              const details = event.details;

              if ((stage === 'image_validation' || stage === 'leaf_validation') && status === 'rejected') {
                setRejectionData(details);
                setStagesState((prev) => ({
                  ...prev,
                  [stage]: { status, details },
                }));
                return;
              }

              if (stage === 'crop_mismatch') {
                setMismatchData(details);
                return;
              }

              setStagesState((prev) => ({
                ...prev,
                [stage]: { status, details },
              }));

              if (stage === 'analysis_complete') {
                receivedFinalReport = details;
                setTimingsData(details.timings_ms || {});
              }
            } catch (jsonErr) {
              console.warn('SSE JSON parse warning:', jsonErr);
            }
          }
        }
      }

      if (receivedFinalReport) {
        const finalWeather = await weatherPromise;
        setReportData(receivedFinalReport);
        // ProcessingView handles the 3-stage sequence animation and final report reveal
      } else {
        throw new Error('Pipeline completed without generating a final analysis report.');
      }

    } catch (err) {
      console.error('Real Pipeline Analysis Error:', err);
      setProcessingError(
        err.message || 'Unable to connect to ML service backend. Please verify FastAPI is running at http://localhost:8000.'
      );
    }
  };

  const handleRetry = () => {
    if (lastFormDataPayload) {
      handleStartAnalysis(lastFormDataPayload, lastLocationQuery, lastExtraContext);
    } else {
      handleNavigate('scan');
    }
  };

  const handleAutoDetectCrop = (predictedCrop) => {
    if (!lastFormDataPayload) return;
    const newPayload = new FormData();
    for (const [key, value] of lastFormDataPayload.entries()) {
      if (key === 'crop') {
        newPayload.append('crop', predictedCrop || 'Auto-detect');
      } else {
        newPayload.append(key, value);
      }
    }
    handleStartAnalysis(newPayload, lastLocationQuery, lastExtraContext);
  };

  return (
    <>
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      <FlowBanner currentView={currentView} onNavigate={handleNavigate} />

      <main className="main-content">
        {currentView === 'landing' ? (
          <LandingView onNavigate={handleNavigate} />
        ) : currentView === 'scan' ? (
          <ScanView onStartAnalysis={handleStartAnalysis} isSubmitting={currentView === 'processing'} />
        ) : currentView === 'processing' ? (
          <ProcessingView
            stagesState={stagesState}
            reportData={reportData}
            imagePreview={currentImagePreview}
            imageMeta={currentImageMeta}
            weatherState={weatherState}
            locationName={lastLocationQuery}
            error={processingError}
            mismatchData={mismatchData}
            rejectionData={rejectionData}
            timings={timingsData}
            onRetry={handleRetry}
            onAutoDetectCrop={handleAutoDetectCrop}
            onNavigate={handleNavigate}
          />
        ) : currentView === 'report' ? (
          <CropHealthReport
            reportData={reportData}
            weatherState={weatherState}
            onNavigate={handleNavigate}
          />
        ) : currentView === 'pipeline' ? (
          <ArchitectureView onNavigate={handleNavigate} />
        ) : currentView === 'research' ? (
          <ResearchView onNavigate={handleNavigate} />
        ) : (
          <PlaceholderView viewName={currentView} onNavigate={handleNavigate} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
    </>
  );
}

export default App;
