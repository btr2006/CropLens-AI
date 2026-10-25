import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Database,
  ExternalLink,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Layers,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  GitBranch,
  Network,
  X,
  Target,
  FlaskConical,
} from 'lucide-react';
import {
  RESEARCH_DATASETS,
  BENCHMARK_METRICS_TABLE,
  CORE_ARCHITECTURE_REFERENCE,
  VERIFIED_ACADEMIC_PAPERS,
  SYSTEM_LIMITATIONS,
  FUTURE_RESEARCH_DIRECTIONS,
} from '../data/researchData';
import ResearchMap from '../components/ResearchMap';
import { InteractiveHoverButton } from '../components/ui/interactive-hover-button';
import { TextEffect } from '../components/ui/text-effect';

const NAV_LINKS = [
  { id: 'overview', label: 'Overview' },
  { id: 'research-map', label: 'Research Map' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'models', label: 'Models' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'papers', label: 'Papers' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'future-work', label: 'Future Work' },
];

export default function ResearchView({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);
  const [expandedLimitationId, setExpandedLimitationId] = useState(null);

  // Smooth scroll helper
  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Scroll spy to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (let i = NAV_LINKS.length - 1; i >= 0; i--) {
        const section = document.getElementById(NAV_LINKS[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(NAV_LINKS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyCitation = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="view-panel active animate-panel-in research-view-root" id="view-research">
      {/* ========================================================
          1. HERO SECTION
         ======================================================== */}
      <section className="research-hero-section">
        <div className="section-container">
          <div className="research-hero-content">
            <div className="research-hero-pill">
              <FlaskConical size={14} className="pill-icon" />
              <span>RESEARCH-BACKED AI PIPELINE</span>
            </div>

            <h1 className="research-hero-title">
              <TextEffect per="word" preset="fade">
                Research & Model Benchmarks
              </TextEffect>
            </h1>

            <div className="research-hero-subheading">
              <TextEffect per="word" delay={0.2} preset="fade">
                Dive into the datasets, model foundations, experiments, and research references behind CropLens AI.
              </TextEffect>
            </div>

            <div className="research-hero-badges">
              <span className="research-badge-tag">
                <span className="dot neural" /> PlantVillage (38 Classes)
              </span>
              <span className="research-badge-tag">
                <span className="dot severity" /> AI Challenger 2018 (Severity)
              </span>
              <span className="research-badge-tag">
                <span className="dot tabular" /> Random Forest Yield Model
              </span>
              <span className="research-badge-tag">
                <span className="dot rule" /> Deterministic Risk Matrix
              </span>
              <span className="research-badge-tag">
                <span className="dot llm" /> Grounded Gemini 3.8 Flash
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. LOCAL RESEARCH SUB-NAVIGATION BAR (Sticky)
         ======================================================== */}
      <div className="res-subnav-sticky">
        <div className="section-container">
          <div className="res-subnav-bar">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`res-subnav-btn font-mono ${activeSection === link.id ? 'active' : ''}`}
                onClick={() => scrollToSection(link.id)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================
          3. OVERVIEW SECTION
         ======================================================== */}
      <section id="overview" className="research-overview-section">
        <div className="section-container">
          <div className="research-overview-card">
            <div className="overview-header">
              <span className="overview-tag font-mono">ACADEMIC RESEARCH SYSTEM</span>
              <h2 className="overview-title">How CropLens AI Connects Science & Engineering</h2>
            </div>
            <p className="overview-body">
              CropLens AI is built upon established computer vision literature and agronomic soil datasets.
              Rather than treating AI as a black box or bibliography, this page presents our end-to-end evidence network:
              mapping <strong>our models</strong> directly to their <strong>underlying datasets</strong>, their
              <strong> peer-reviewed research foundations</strong>, and our <strong>empirical held-out benchmark results</strong>.
            </p>

            <div className="overview-pillars-summary">
              <div className="summary-pillar-box">
                <span className="pill-num font-mono">01</span>
                <h4>Disease Vision</h4>
                <p>PlantVillage (87,867 imgs) + Mohanty et al. (2016) → <strong>97.09%</strong> validation</p>
              </div>
              <div className="summary-pillar-box">
                <span className="pill-num font-mono">02</span>
                <h4>Severity Staging</h4>
                <p>AI Challenger (37,721 imgs) + ScienceDirect (2024) → <strong>95.57%</strong> Macro-F1</p>
              </div>
              <div className="summary-pillar-box">
                <span className="pill-num font-mono">03</span>
                <h4>Yield Regression</h4>
                <p>Soil & Weather (2,596 rows) + Breiman (2001) → <strong>0.9908</strong> R² score</p>
              </div>
            </div>

            <div className="overview-disclaimer">
              <AlertTriangle size={16} className="disclaimer-icon" />
              <span>
                <strong>Research Prototype Disclosure:</strong> CropLens AI is an academic IDP engineering research prototype.
                Its results represent controlled dataset splits and empirical evaluations. It is designed to assist farmers and agronomists, not replace certified agricultural extension authorities.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. INTERACTIVE RESEARCH EVIDENCE MAP
         ======================================================== */}
      <section id="research-map" className="research-map-section">
        <div className="section-container">
          <div className="section-heading-clean">
            <span className="section-sub-badge font-mono">INTERACTIVE EVIDENCE GRAPH</span>
            <h2 className="section-title-clean">Research Evidence Map</h2>
            <p className="section-desc-clean">
              Explore the relationship between our trained models, their training datasets, and supporting peer-reviewed literature.
              Click any node to inspect evidence, or use the walkthrough player for an automated tour.
            </p>
          </div>

          <ResearchMap />
        </div>
      </section>

      {/* ========================================================
          5. DATASETS WE USED
         ======================================================== */}
      <section id="datasets" className="research-datasets-section">
        <div className="section-container">
          <div className="section-heading-clean">
            <span className="section-sub-badge font-mono">TRAINING & VALIDATION CORPUS</span>
            <h2 className="section-title-clean">Datasets Used in CropLens AI</h2>
            <p className="section-desc-clean">
              Full transparency on dataset provenance, class distributions, split methodologies, and domain limitations.
            </p>
          </div>

          <div className="datasets-grid">
            {RESEARCH_DATASETS.map((ds) => (
              <div key={ds.id} className="dataset-card">
                <div className="dataset-card-top">
                  <div className="dataset-card-meta">
                    <span className="dataset-type-pill font-mono">{ds.typeBadge}</span>
                    <span className={`dataset-status-badge ${ds.status.includes('Active') ? 'active' : 'exploratory'}`}>
                      {ds.status}
                    </span>
                  </div>
                  <h3 className="dataset-name">
                    {ds.title}
                    {ds.links && ds.links[0] && (
                      <a
                        href={ds.links[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dataset-title-ext"
                        title={`Open ${ds.title} in new tab`}
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </h3>
                  <p className="dataset-purpose">{ds.purpose}</p>
                </div>

                {/* Implementation Details */}
                <div className="dataset-details-box">
                  <span className="details-box-label font-mono">OUR IMPLEMENTATION SPECIFICATION</span>
                  <div className="details-specs-list">
                    {Object.entries(ds.implementation).map(([key, val]) => (
                      <div key={key} className="detail-spec-row">
                        <span className="spec-label font-mono">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</span>
                        <span className="spec-val font-mono">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Our Controlled Results (Badge: OUR EXPERIMENT) */}
                <div className="dataset-results-box">
                  <div className="results-header-strip">
                    <span className="results-box-label font-mono">OUR EXPERIMENTAL EVALUATION</span>
                    <span className="experiment-badge font-mono">OUR EXPERIMENT</span>
                  </div>
                  <div className="results-metric-strip">
                    <div className="metric-primary">
                      <span className="metric-score font-mono">{ds.ourResults.metricValue}</span>
                      <span className="metric-title">{ds.ourResults.metricName}</span>
                    </div>
                    {ds.ourResults.mildF1 && (
                      <div className="metric-breakdown font-mono">
                        Mild F1: <strong>{ds.ourResults.mildF1}</strong> • Severe F1: <strong>{ds.ourResults.severeF1}</strong>
                      </div>
                    )}
                    {ds.ourResults.mae && (
                      <div className="metric-breakdown font-mono">
                        MAE: <strong>{ds.ourResults.mae}</strong> • RMSE: <strong>{ds.ourResults.rmse}</strong>
                      </div>
                    )}
                  </div>
                  <span className="evaluation-protocol-tag font-mono">
                    {ds.ourResults.evaluationType}
                  </span>
                </div>

                {/* Critical Limitation Callout */}
                <div className="dataset-limitation-box">
                  <AlertTriangle size={15} className="limitation-mini-icon" />
                  <p className="limitation-text">
                    <strong>Limitation:</strong> {ds.limitation}
                  </p>
                </div>

                {/* External Direct Links */}
                <div className="dataset-card-links">
                  {ds.links.map((link, lIdx) => (
                    <a
                      key={lIdx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`dataset-action-btn ${link.type}`}
                    >
                      <span>{link.label}</span>
                      <ExternalLink size={13} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          6. MODELS & METHODOLOGICAL FOUNDATIONS
         ======================================================== */}
      <section id="models" className="research-spotlight-section">
        <div className="section-container">
          <div className="section-heading-clean">
            <span className="section-sub-badge font-mono">MODEL ARCHITECTURES</span>
            <h2 className="section-title-clean">Algorithmic & Architecture Foundations</h2>
            <p className="section-desc-clean">
              Clickable references to the peer-reviewed foundational architectures powering CropLens AI.
            </p>
          </div>

          <div className="models-foundation-grid">
            {/* MobileNetV2 Card */}
            <div className="spotlight-card">
              <div className="spotlight-header">
                <span className="spotlight-tag font-mono">COMPUTER VISION BACKBONE</span>
                <h3 className="spotlight-title">
                  <a
                    href="https://doi.org/10.1109/CVPR.2018.00474"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paper-title-clickable"
                    title="Read CVPR Paper in new tab"
                  >
                    <span>MobileNetV2: Inverted Residuals and Linear Bottlenecks</span>
                    <ExternalLink size={16} />
                  </a>
                </h3>
                <p className="spotlight-authors font-mono">
                  Sandler, M., Howard, A., Zhu, M., Zhmoginov, A., & Chen, L.-C. • CVPR 2018 • DOI: 10.1109/CVPR.2018.00474
                </p>
              </div>
              <p className="spotlight-body">
                Selected as the lightweight visual backbone for both disease identification (38 classes) and disease-conditioned severity estimation.
                Its depthwise separable convolutions and linear inverted bottlenecks achieve 97.09% validation accuracy with only 3.4M parameters,
                enabling sub-60ms edge/CPU inference without expensive GPU clusters.
              </p>
              <div className="spotlight-footer">
                <a
                  href="https://doi.org/10.1109/CVPR.2018.00474"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-read-paper"
                >
                  <span>Open CVPR Paper (DOI: 10.1109/CVPR.2018.00474) ↗</span>
                </a>
              </div>
            </div>

            {/* Random Forest Card */}
            <div className="spotlight-card">
              <div className="spotlight-header">
                <span className="spotlight-tag font-mono">TABULAR REGRESSION METHOD</span>
                <h3 className="spotlight-title">
                  <a
                    href="https://doi.org/10.1023/A:1010933404324"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="paper-title-clickable"
                    title="Read Leo Breiman's Random Forests in new tab"
                  >
                    <span>Random Forests</span>
                    <ExternalLink size={16} />
                  </a>
                </h3>
                <p className="spotlight-authors font-mono">
                  Leo Breiman • Machine Learning, 45(1), 5–32 (2001) • DOI: 10.1023/A:1010933404324
                </p>
              </div>
              <p className="spotlight-body">
                Selected for tabular soil yield regression because 100-tree bootstrap bagging ensembles model non-linear interactions
                between soil chemical nutrients (N, P, K), applied fertilizers, and field temperatures without overfitting.
                Achieved an empirical R² of 0.9908 with MAE of 0.1229 t/ha on held-out test splits.
              </p>
              <div className="spotlight-footer">
                <a
                  href="https://doi.org/10.1023/A:1010933404324"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-read-paper"
                >
                  <span>Open Original Paper (DOI: 10.1023/A:1010933404324) ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. OUR BENCHMARKS SECTION (Interactive Metric Cards)
         ======================================================== */}
      <section id="benchmarks" className="research-benchmarks-section">
        <div className="section-container">
          <div className="section-heading-clean">
            <span className="section-sub-badge font-mono">EMPIRICAL BENCHMARKS</span>
            <h2 className="section-title-clean">Our Project Benchmark Results</h2>
            <p className="section-desc-clean">
              Click any benchmark card below to inspect its exact evaluation protocol, train/validation/test split sizes, and leakage safeguards.
            </p>
          </div>

          {/* 3 Large Interactive Metric Cards */}
          <div className="res-benchmark-cards-grid">
            {/* Card 1: Disease */}
            <div
              className={`res-benchmark-card ${selectedBenchmark === 'disease' ? 'active-benchmark' : ''}`}
              onClick={() => setSelectedBenchmark(selectedBenchmark === 'disease' ? null : 'disease')}
              role="button"
              tabIndex={0}
            >
              <div className="benchmark-card-top">
                <span className="benchmark-sub font-mono">DISEASE CLASSIFICATION</span>
                <span className="benchmark-pill controlled font-mono">Controlled validation</span>
              </div>
              <div className="benchmark-value font-mono">97.09%</div>
              <div className="benchmark-metric-label">Validation Accuracy</div>
              <p className="benchmark-card-hint font-mono">
                {selectedBenchmark === 'disease' ? '▲ Click to collapse protocol' : '▼ Click to view protocol details'}
              </p>

              {selectedBenchmark === 'disease' && (
                <div className="benchmark-protocol-reveal">
                  <div className="protocol-row">
                    <span className="p-key font-mono">Architecture:</span>
                    <span className="p-val font-mono">MobileNetV2 (38 Classes)</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Training Set:</span>
                    <span className="p-val font-mono">70,295 images (80%)</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Validation Set:</span>
                    <span className="p-val font-mono">17,572 images (20%)</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Total Images:</span>
                    <span className="p-val font-mono">87,867 images</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Cross-Entropy Loss:</span>
                    <span className="p-val font-mono">0.114</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Image Resolution:</span>
                    <span className="p-val font-mono">224 × 224 RGB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Severity */}
            <div
              className={`res-benchmark-card ${selectedBenchmark === 'severity' ? 'active-benchmark' : ''}`}
              onClick={() => setSelectedBenchmark(selectedBenchmark === 'severity' ? null : 'severity')}
              role="button"
              tabIndex={0}
            >
              <div className="benchmark-card-top">
                <span className="benchmark-sub font-mono">SEVERITY ASSESSMENT</span>
                <span className="benchmark-pill leakage font-mono">Leakage-controlled test</span>
              </div>
              <div className="benchmark-value font-mono">95.57%</div>
              <div className="benchmark-metric-label">Held-Out Macro-F1</div>
              <p className="benchmark-card-hint font-mono">
                {selectedBenchmark === 'severity' ? '▲ Click to collapse protocol' : '▼ Click to view protocol details'}
              </p>

              {selectedBenchmark === 'severity' && (
                <div className="benchmark-protocol-reveal">
                  <div className="protocol-row">
                    <span className="p-key font-mono">Architecture:</span>
                    <span className="p-val font-mono">Disease-Conditioned MobileNetV2</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Held-Out Test:</span>
                    <span className="p-val font-mono">5,647 images</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Train / Val Split:</span>
                    <span className="p-val font-mono">26,407 train • 5,667 validation</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Duplicate Leakage:</span>
                    <span className="p-val font-mono text-leaf">0 cross-split duplicates</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Mild Class F1:</span>
                    <span className="p-val font-mono">95.44%</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Severe Class F1:</span>
                    <span className="p-val font-mono">95.70%</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Supported Pairs:</span>
                    <span className="p-val font-mono">14 explicit crop-disease pairs</span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Yield */}
            <div
              className={`res-benchmark-card ${selectedBenchmark === 'yield' ? 'active-benchmark' : ''}`}
              onClick={() => setSelectedBenchmark(selectedBenchmark === 'yield' ? null : 'yield')}
              role="button"
              tabIndex={0}
            >
              <div className="benchmark-card-top">
                <span className="benchmark-sub font-mono">YIELD REGRESSION</span>
                <span className="benchmark-pill heldout font-mono">Held-out test</span>
              </div>
              <div className="benchmark-value font-mono">0.9908</div>
              <div className="benchmark-metric-label">Coefficient of Determination (R²)</div>
              <p className="benchmark-card-hint font-mono">
                {selectedBenchmark === 'yield' ? '▲ Click to collapse protocol' : '▼ Click to view protocol details'}
              </p>

              {selectedBenchmark === 'yield' && (
                <div className="benchmark-protocol-reveal">
                  <div className="protocol-row">
                    <span className="p-key font-mono">Algorithm:</span>
                    <span className="p-val font-mono">Random Forest Regressor (100 Trees)</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Total Observations:</span>
                    <span className="p-val font-mono">2,596 field rows</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Mean Absolute Error:</span>
                    <span className="p-val font-mono">0.1229 t/ha</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Root Mean Square Error:</span>
                    <span className="p-val font-mono">0.1863 t/ha</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Input Features:</span>
                    <span className="p-val font-mono">Temperature, N, P, K, Fertilizer</span>
                  </div>
                  <div className="protocol-row">
                    <span className="p-key font-mono">Limitation Notice:</span>
                    <span className="p-val font-mono text-amber">No crop identity feature in dataset</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Benchmark Table */}
          <div className="benchmark-table-wrapper">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Model Architecture</th>
                  <th>Primary Metric</th>
                  <th>Our Result</th>
                  <th>Secondary Metrics</th>
                  <th>Evaluation Protocol</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARK_METRICS_TABLE.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{row.component}</strong>
                    </td>
                    <td>
                      <span className="font-mono table-badge">{row.model}</span>
                    </td>
                    <td>{row.evaluationMetric}</td>
                    <td>
                      <span className="result-highlight font-mono">{row.ourScore}</span>
                    </td>
                    <td className="font-mono text-muted">{row.additionalMetrics}</td>
                    <td className="font-mono table-protocol">{row.evaluationProtocol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="benchmark-footnote font-mono">
            * Note: These are our project's empirical validation and test results. They represent controlled dataset splits and are not directly comparable to external published works with differing evaluation setups.
          </p>
        </div>
      </section>

      {/* ========================================================
          8. VERIFIED SCIENTIFIC PAPERS (Directly Clickable Titles)
         ======================================================== */}
      <section id="papers" className="research-citations-section">
        <div className="section-container">
          <div className="section-heading-clean">
            <span className="section-sub-badge font-mono">SCIENTIFIC LITERATURE</span>
            <h2 className="section-title-clean">Verified Academic References</h2>
            <p className="section-desc-clean">
              Click any paper title to open its official DOI publication directly in a new tab.
            </p>
          </div>

          <div className="citations-list">
            {VERIFIED_ACADEMIC_PAPERS.map((paper, idx) => (
              <div key={paper.index} className="citation-item">
                <div className="citation-index font-mono">0{paper.index}</div>
                <div className="citation-content">
                  <h4 className="citation-paper-title">
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="paper-direct-link"
                      title="Open verified paper in new tab"
                    >
                      <span>"{paper.title}"</span>
                      <ExternalLink size={14} className="paper-ext-icon" />
                    </a>
                  </h4>
                  <p className="citation-meta-line font-mono">
                    <strong>{paper.authors}</strong> ({paper.year}) • <em>{paper.journal}</em> • DOI:{' '}
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="citation-doi-link font-mono"
                    >
                      {paper.doi}
                    </a>
                  </p>
                  <span className="citation-role font-mono">{paper.role}</span>
                </div>
                <div className="citation-actions">
                  <button
                    type="button"
                    className="btn-copy-citation"
                    onClick={() =>
                      handleCopyCitation(
                        `${paper.authors} (${paper.year}). "${paper.title}." ${paper.journal}. DOI: ${paper.doi}`,
                        idx
                      )
                    }
                    title="Copy Citation"
                  >
                    {copiedIndex === idx ? <Check size={14} className="text-leaf" /> : <Copy size={14} />}
                  </button>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-paper"
                    title="Open Source DOI"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          9. SYSTEM LIMITATIONS (Interactive Disclosure)
         ======================================================== */}
      <section id="limitations" className="research-limitations-section">
        <div className="section-container">
          <div className="section-heading-clean">
            <span className="section-sub-badge font-mono" style={{ color: '#d97706' }}>
              ACADEMIC RIGOR & HONESTY
            </span>
            <h2 className="section-title-clean">Known System Limitations</h2>
            <p className="section-desc-clean">
              Explicit disclosure of current model constraints, domain boundaries, and data gaps. Click any card to expand full details.
            </p>
          </div>

          <div className="limitations-grid">
            {SYSTEM_LIMITATIONS.map((lim) => {
              const isExpanded = expandedLimitationId === lim.id;
              return (
                <div
                  key={lim.id}
                  className={`limitation-item-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedLimitationId(isExpanded ? null : lim.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="limitation-item-top">
                    <AlertTriangle size={18} className="lim-badge-icon" />
                    <h4 className="limitation-item-title">{lim.title}</h4>
                    <span className="lim-expand-icon">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                  <span className="limitation-item-summary font-mono">{lim.summary}</span>
                  <p className="limitation-item-detail">{lim.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          10. FUTURE RESEARCH DIRECTIONS
         ======================================================== */}
      <section id="future-work" className="research-future-section">
        <div className="section-container">
          <div className="section-heading-clean">
            <span className="section-sub-badge font-mono">ROADMAP</span>
            <h2 className="section-title-clean">Future Research Directions</h2>
            <p className="section-desc-clean">
              Planned scientific advancements for expanding agronomic coverage and in-field robustness.
            </p>
          </div>

          <div className="future-grid">
            {FUTURE_RESEARCH_DIRECTIONS.map((dir, idx) => (
              <div key={idx} className="future-card">
                <div className="future-card-top">
                  <span className="future-num font-mono">0{idx + 1}</span>
                  <span className="future-badge font-mono">FUTURE WORK</span>
                </div>
                <h4 className="future-title">{dir.title}</h4>
                <p className="future-desc">{dir.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          11. BOTTOM ACTION CTA
         ======================================================== */}
      <section className="research-cta-section">
        <div className="section-container">
          <div className="research-cta-card">
            <div className="research-cta-content">
              <span className="research-cta-badge font-mono">CROPLENS RESEARCH PLATFORM</span>
              <h2 className="research-cta-title">Test the Researched Architecture Live</h2>
              <p className="research-cta-desc">
                Upload a suspect leaf image and input farm parameters to see our MobileNetV2, severity routing, and Random Forest yield model infer live in real-time.
              </p>
              <div className="research-cta-buttons">
                <InteractiveHoverButton
                  text="Start Real Crop Scan"
                  onClick={() => onNavigate('scan')}
                />
                <button
                  type="button"
                  className="research-cta-secondary-btn"
                  onClick={() => onNavigate('pipeline')}
                >
                  Explore System Architecture
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
