import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Zap, Shield, Globe, Award, Sparkles, Terminal, Cpu } from "lucide-react";
import "./App.css";

const SwarmIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-white"
  >
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <path
      d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

interface SandboxTab {
  id: string;
  label: string;
  prompt: string;
  color: string;
}

const SANDBOX_TABS: SandboxTab[] = [
  {
    id: "flashloan",
    label: "Flashloan Attack",
    prompt: "Simulate mempool flashloan attack: 12.5M WETH borrow without collateral targeting Vault contract.",
    color: "from-red-500 to-orange-400"
  },
  {
    id: "oracle",
    label: "Oracle Manipulation",
    prompt: "Simulate price deviation: price manipulation pushing token price from $1.00 to $4.50 within a single block.",
    color: "from-amber-500 to-yellow-400"
  },
  {
    id: "liquidity",
    label: "Liquidity Drain",
    prompt: "Simulate sudden pool TVL drain: 80% pool TVL reduction in 2 blocks.",
    color: "from-rose-600 to-red-500"
  }
];

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";

  // Sandbox simulation states
  const [activeTab, setActiveTab] = useState<string>("flashloan");
  const [progress, setProgress] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<string>("Active monitoring. Vault secure.");
  const [activePreviewTab, setActivePreviewTab] = useState<string>("verdict");

  // HLS Video initialization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
    }
  }, []);

  // Sandbox simulated generator
  const triggerSandboxGeneration = (tabId: string) => {
    setActiveTab(tabId);
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep("Injecting mock attack vectors into mempool stream...");
  };

  useEffect(() => {
    if (!isGenerating) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 5;
        if (next >= 100) {
          clearInterval(timer);
          setIsGenerating(false);
          setCurrentStep("Defensive action triggered: targetVault.pause() executed successfully.");
          return 100;
        }

        // Simulated steps based on progress percentage
        if (next < 25) {
          setCurrentStep("Ingesting mempool payload... Threat detected.");
        } else if (next < 50) {
          if (activeTab === "flashloan") {
            setCurrentStep("FlashloanDetector flags suspicious same-block borrow (Confidence: 95%)...");
          } else if (activeTab === "oracle") {
            setCurrentStep("OracleWatcher flags abnormal price deviation (Confidence: 92%)...");
          } else {
            setCurrentStep("VelocityTracker flags sudden pool TVL drain (Confidence: 98%)...");
          }
        } else if (next < 70) {
          setCurrentStep("Escalating to secondary validation nodes... Threat confirmed.");
        } else if (next < 90) {
          setCurrentStep("Signing verdict transactions. Submitting votes to SwarmCoordinator contract...");
        } else {
          setCurrentStep("Consensus reached on-chain (3/3 votes matching threshold). Calling pause()...");
        }

        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isGenerating, activeTab]);

  return (
    <div className="relative w-full min-h-screen bg-[#000000] text-white font-instrument-sans overflow-x-hidden selection:bg-white/10">
      {/* Floating Capsule Glassmorphism Navbar */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-50">
        <nav
          id="navbar"
          className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl px-6 py-3 flex items-center justify-between transition-all duration-300"
        >
          {/* Left Brand */}
          <div id="nav-brand" className="flex items-center gap-2 cursor-pointer">
            <SwarmIcon />
            <span className="font-instrument-sans font-semibold tracking-tight text-white hidden sm:block">
              SwarmGuard
            </span>
          </div>

          {/* Center Links */}
          <div id="nav-menu" className="hidden md:flex items-center gap-8 font-instrument-sans text-sm font-medium text-white/80">
            <a href="#hero" id="nav-link-home" className="hover:text-white transition-colors duration-200 cursor-pointer">
              Home
            </a>
            <a href="#sandbox" id="nav-link-sandbox" className="hover:text-white transition-colors duration-200 cursor-pointer">
              Simulation
            </a>
            <a href="#interactive-features" id="nav-link-specs" className="hover:text-white transition-colors duration-200 cursor-pointer">
              Specs
            </a>
            <a href="#pricing" id="nav-link-pricing" className="hover:text-white transition-colors duration-200 cursor-pointer">
              Pricing
            </a>
            <a href="http://localhost:8001" target="_blank" rel="noopener noreferrer" id="nav-link-live-dashboard" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200 cursor-pointer">
              Live Monitor ⚡
            </a>
          </div>

          {/* Right Actions */}
          <div id="nav-actions" className="flex items-center gap-4">
            <a id="nav-link-demo" className="hidden sm:block font-instrument-sans text-sm font-medium text-white/80 hover:text-white transition-colors duration-200 cursor-pointer">
              Book A Demo
            </a>
            <button
              id="nav-btn-start"
              onClick={() => {
                const element = document.getElementById("sandbox");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-white text-black hover:bg-white/95 text-xs sm:text-sm font-semibold rounded-full px-5 py-2 sm:py-2.5 transition-all duration-200 shadow-md shadow-white/5 cursor-pointer"
            >
              Simulate Attack
            </button>
          </div>
        </nav>
      </div>

      {/* Hero Section Component */}
      <section
        id="hero"
        className="relative w-full min-h-screen flex flex-col justify-center items-center px-6 z-10 pt-20"
      >
        {/* Background Video Layer */}
        <video
          ref={videoRef}
          id="hero-video"
          className="absolute top-0 left-0 w-full h-full object-cover opacity-50 pointer-events-none z-0"
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
        />

        {/* Video Overlay */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/70 backdrop-blur-[1px] z-10 pointer-events-none" />

        {/* Decorative Gradients */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none z-20" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none z-20" />

        {/* Content Container */}
        <div className="relative z-30 max-w-5xl mx-auto flex flex-col items-center text-center mt-12 space-y-10">
          {/* Pre-headline */}
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            id="hero-pre-headline"
            className="font-instrument-serif text-3xl sm:text-5xl lg:text-[48px] leading-[1.1] text-white font-normal"
          >
            Decentralized On-Chain AI Immunity Swarm
          </motion.h3>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            id="hero-main-headline"
            className="font-instrument-sans font-semibold text-6xl sm:text-8xl lg:text-[136px] leading-[0.9] tracking-tighter bg-gradient-to-b from-white via-white to-[#b4c0ff] bg-clip-text text-transparent"
          >
            SwarmGuard
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            id="hero-subheadline"
            className="font-instrument-sans text-lg sm:text-[20px] leading-[1.65] text-white max-w-2xl mx-auto"
          >
            Protect your DeFi protocols on Monad with a decentralized swarm of AI agents. Real-time mempool audits, on-chain consensus, and sub-second auto-pausing.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            id="hero-cta-container"
            className="flex flex-col sm:flex-row gap-6 items-center justify-center pt-4"
          >
            {/* Primary Button */}
            <div
              id="hero-btn-primary"
              onClick={() => {
                window.open("http://localhost:8001", "_blank");
              }}
              className="group flex items-center gap-4 pl-6 pr-2 py-2 bg-white rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 cursor-pointer"
            >
              <span className="font-instrument-sans font-medium text-lg text-[#0a0400]">
                Launch Swarm Dashboard
              </span>
              <div className="w-10 h-10 rounded-full bg-[#3054ff] group-hover:bg-[#2040e0] flex items-center justify-center transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Secondary Button */}
            <a
              href="#sandbox"
              id="hero-btn-secondary"
              className="group flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white bg-transparent backdrop-blur-sm hover:bg-white/5 rounded-lg transition-all duration-200 cursor-pointer"
            >
              <span className="font-instrument-sans font-medium">
                Simulate Defense
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section id="sandbox" className="relative w-full py-24 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium font-instrument-sans uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Simulation Playground
            </div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              DeFi Attack & Swarm Defense Simulator
            </h2>
            <p className="text-white/60 text-lg">
              Trigger a simulated exploit scenario to see how independent agents coordinate, sign verdicts, and execute protective pausing.
            </p>
          </div>

          {/* Interactive UI Sandbox */}
          <div className="border border-white/10 bg-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-900/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Tab Selector */}
            <div className="flex flex-wrap gap-3 justify-center border-b border-white/10 pb-6 mb-8">
              {SANDBOX_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => triggerSandboxGeneration(tab.id)}
                  disabled={isGenerating}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-black shadow-lg shadow-white/5"
                      : "text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Simulated Live Console and Output Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Console Box (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between bg-black/60 rounded-2xl p-5 border border-white/10 font-mono text-xs text-white/80 min-h-[300px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="flex items-center gap-2 font-semibold tracking-tight text-white">
                      <Terminal className="w-4 h-4 text-cyan-400" /> SWARM_COORDINATOR_LOGGER
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
                      {isGenerating ? 'EXPLOIT_DETECTED' : 'MONITORING'}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-white/40">&gt; Target exploit payload:</div>
                    <div className="text-cyan-300 font-medium pl-3 italic border-l border-white/10">
                      "{SANDBOX_TABS.find(t => t.id === activeTab)?.prompt}"
                    </div>
                  </div>

                  {/* Generation Steps log */}
                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between items-center text-white/50">
                      <span>Defense Progress:</span>
                      <span className="font-semibold text-white">{progress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full bg-gradient-to-r ${SANDBOX_TABS.find(t => t.id === activeTab)?.color}`}
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-6 text-white/60">
                  <div className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Protection State</div>
                  <div className="font-sans text-sm font-semibold text-white animate-pulse">
                    {currentStep}
                  </div>
                </div>
              </div>

              {/* Output Preview Box (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0c0c14]/80 backdrop-blur-md flex flex-col min-h-[350px] overflow-hidden relative">
                {/* Custom Explorer Header */}
                <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="font-mono text-xs font-semibold tracking-tight text-white/90">MONAD_SHIELD_EXPLORER</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                    {["verdict", "signatures", "gas"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActivePreviewTab(tab)}
                        className={`px-3 py-1 rounded-md text-[10px] font-medium font-mono uppercase transition-all duration-200 cursor-pointer ${
                          activePreviewTab === tab
                            ? "bg-white/10 text-white border border-white/10"
                            : "text-white/40 hover:text-white/70"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div
                        key="generating"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex flex-col items-center justify-center gap-4 text-center py-8"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-4 border-red-500/10 border-t-red-500 animate-spin" />
                          <Shield className="w-5 h-5 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">Evaluating threat payload...</div>
                          <div className="text-white/40 text-xs mt-1">Autonomous agent swarm is tallying on-chain votes</div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={activePreviewTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex-grow flex flex-col justify-between"
                      >
                        {activePreviewTab === "verdict" && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                              <div>
                                <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold font-mono">
                                  SHIELD STATE: ACTIVE
                                </div>
                                <h4 className="text-lg font-semibold tracking-tight text-white mt-0.5">
                                  {SANDBOX_TABS.find(t => t.id === activeTab)?.label} Mitigated
                                </h4>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-mono text-[10px] font-medium">
                                consensus_reached
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Incident Verification Log</div>
                              <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-2.5 font-mono text-[11px] text-left">
                                <div className="flex justify-between">
                                  <span className="text-white/50">Tx Hash:</span>
                                  <span className="text-blue-400 hover:underline cursor-pointer">0xb410182e35fbdecaf98caf2db78cc656a64d94b876d...</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/50">Action Executed:</span>
                                  <span className="text-red-400 font-semibold">targetVault.pause()</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/50">Consensus Achieved:</span>
                                  <span className="text-white">3 / 3 agent votes matching</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/50">Block Height:</span>
                                  <span className="text-white">#849204</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activePreviewTab === "signatures" && (
                          <div className="space-y-4">
                            <div className="border-b border-white/5 pb-3">
                              <div className="text-[10px] text-blue-400 uppercase tracking-widest font-semibold font-mono">
                                SECURITY SWARM SIGNATURES
                              </div>
                              <h4 className="text-sm text-white/60 mt-0.5">
                                Cryptographic proof submitted by consensus agents
                              </h4>
                            </div>

                            <div className="space-y-2 font-mono text-[10px] text-left">
                              {/* Agent 1 */}
                              <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5 border border-white/5">
                                <div>
                                  <div className="font-semibold text-white">FlashloanDetector</div>
                                  <div className="text-white/40 mt-0.5">0x19E7E376E7C213B7E7e7e46cc70A5...</div>
                                </div>
                                <div className="text-right">
                                  <span className="text-emerald-400 font-semibold">SIGNED</span>
                                  <div className="text-white/30 mt-0.5">rsv: 0x5d71a80...</div>
                                </div>
                              </div>

                              {/* Agent 2 */}
                              <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5 border border-white/5">
                                <div>
                                  <div className="font-semibold text-white">OracleWatcher</div>
                                  <div className="text-white/40 mt-0.5">0x1563915e194D8CfBA1943570603...</div>
                                </div>
                                <div className="text-right">
                                  <span className="text-emerald-400 font-semibold">SIGNED</span>
                                  <div className="text-white/30 mt-0.5">rsv: 0xa48201d...</div>
                                </div>
                              </div>

                              {/* Agent 3 */}
                              <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5 border border-white/5">
                                <div>
                                  <div className="font-semibold text-white">VelocityTracker</div>
                                  <div className="text-white/40 mt-0.5">0x5CbDd86a2FA8Dc4bDdd8a8f69dB...</div>
                                </div>
                                <div className="text-right">
                                  <span className="text-emerald-400 font-semibold">SIGNED</span>
                                  <div className="text-white/30 mt-0.5">rsv: 0x8bcdef3...</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {activePreviewTab === "gas" && (
                          <div className="space-y-4">
                            <div className="border-b border-white/5 pb-3">
                              <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold font-mono">
                                GAS COST COMPARISON
                              </div>
                              <h4 className="text-sm text-white/60 mt-0.5 font-sans">
                                Cost to write continuous on-chain verdicts
                              </h4>
                            </div>

                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-white/70">Ethereum Mainnet (Avg. $45.50/tx)</span>
                                  <span className="text-red-400 font-semibold">$3,931,200 / yr</span>
                                </div>
                                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full" style={{ width: "100%" }} />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-xs font-mono">
                                  <span className="text-white/70">Monad Network (Avg. $0.0001/tx)</span>
                                  <span className="text-emerald-400 font-semibold">$8.64 / yr</span>
                                </div>
                                <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: "0.1%" }} />
                                </div>
                              </div>

                              <p className="text-[10px] text-white/40 leading-relaxed font-sans pt-1 text-left">
                                *Calculated based on 3 security agents posting verdicts every 10 seconds. Monad's custom Merkle database (MonadDB) makes decentralized real-time security financially viable.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                          <span className="text-[10px] text-white/40 font-mono">
                            State root: 0x93ab23efd61...
                          </span>
                          <a
                            href="#interactive-features"
                            className="px-4 py-1.5 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/90 transition-all duration-200 cursor-pointer"
                          >
                            Explore Architecture
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2x2 Similar Design Feature Cards Grid (Custom content matching SwarmGuard concepts) */}
      <section id="interactive-features" className="relative w-full py-24 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium font-instrument-sans uppercase tracking-widest">
              <Cpu className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Swarm Architecture
            </div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Defend Your DeFi Protocols On-Chain
            </h2>
            <p className="text-white/60 text-lg">
              Explore the detailed features of our decentralized agents and coordinator infrastructure.
            </p>
          </div>

          {/* 2x2 Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1: AI Prompting (Voice & Text) */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group border border-white/10 bg-white/5 rounded-3xl p-8 hover:border-white/20 transition-all duration-300 backdrop-blur-md flex flex-col justify-between shadow-2xl relative"
            >
              <div className="space-y-6">
                {/* Visual Mockup inside Card */}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] text-white/40 font-mono tracking-wider">swarm_security_stream</span>
                    <span className="flex items-center gap-1 text-[10px] text-red-400 font-semibold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Exploit Watch
                    </span>
                  </div>
                  {/* Mock Conversation */}
                  <div className="space-y-3 font-instrument-sans text-xs">
                    <div className="flex justify-end">
                      <div className="bg-red-500/10 border border-red-500/30 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-[85%]">
                        "[Mempool Alert] Exploit transaction triggered. Checking TVL drop..."
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 text-white/80 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-[85%] flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 animate-pulse" />
                        <span>FlashloanDetector, OracleWatcher confirming consensus target...</span>
                      </div>
                    </div>
                  </div>
                  {/* Waveform Visualization */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-end gap-1 h-6">
                      <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-1 h-5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                      <span className="w-1 h-4 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                      <span className="w-1 h-6 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }} />
                      <span className="w-1 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.6s" }} />
                    </div>
                    <span className="text-white/40 text-xs font-mono">Consensus: 98%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#3054ff] uppercase tracking-wider">Independent Agents</div>
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    Four specialized agents watch your system
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Flashloan, Oracle, Velocity, and Wallet agents independently inspect mempool events, CEX prices, and TVL metrics, submitting signed verdicts.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2: SEO & ATS-style Scorecard */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group border border-white/10 bg-white/5 rounded-3xl p-8 hover:border-white/20 transition-all duration-300 backdrop-blur-md flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-6">
                {/* Visual Mockup inside Card */}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/10 flex items-center justify-between gap-6">
                  {/* Left stats */}
                  <div className="space-y-3 w-full">
                    <span className="text-[10px] text-white/40 font-mono tracking-wider">consensus_coordinator</span>
                    <div className="space-y-2">
                      {/* Bar 1 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-white/70">
                          <span>Threshold required</span>
                          <span className="font-mono">60%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: "60%" }} />
                        </div>
                      </div>
                      {/* Bar 2 */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-white/70">
                          <span>Current Swarm Vote</span>
                          <span className="font-mono">75%</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: "75%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Right Circle Progress */}
                  <div className="relative shrink-0 flex items-center justify-center w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-500"
                        strokeDasharray="75, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-base font-bold text-white font-mono">75%</span>
                      <span className="text-[8px] text-white/40 uppercase tracking-widest font-semibold">VOTE</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#3054ff] uppercase tracking-wider">Consensus Engine</div>
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    On-chain consensus engine calculates verdicts
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    No single agent holds power. Verdicts are Tallied entirely on-chain on Monad, requiring consensus thresholds before executing emergency hooks.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Floating Language/Framework Badges */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group border border-white/10 bg-white/5 rounded-3xl p-8 hover:border-white/20 transition-all duration-300 backdrop-blur-md flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-6">
                {/* Visual Mockup inside Card */}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/10 min-h-[120px] flex flex-wrap gap-2.5 items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-900/5 to-transparent pointer-events-none" />
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:scale-105 transition-all duration-200">Pause()</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:scale-105 transition-all duration-200">Freeze()</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:scale-105 transition-all duration-200">Emergency Hook</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:scale-105 transition-all duration-200">Circuit Breaker</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:scale-105 transition-all duration-200">Monad RPC</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:scale-105 transition-all duration-200">Signature Verify</span>
                  <span className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium hover:scale-105 transition-all duration-200">Safe Multi-Sig</span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#3054ff] uppercase tracking-wider">Sub-Second Execution</div>
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    Instant defensive actions block drain attempts
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Stop exploits mid-transaction. Once consensus is reached, the Coordinator triggers the target protocol's freeze function in under a second.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Scorecards after session */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group border border-white/10 bg-white/5 rounded-3xl p-8 hover:border-white/20 transition-all duration-300 backdrop-blur-md flex flex-col justify-between shadow-2xl"
            >
              <div className="space-y-6">
                {/* Visual Mockup inside Card */}
                <div className="bg-black/40 rounded-2xl p-5 border border-white/10 space-y-3 font-mono text-[10px] text-white/80">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-white font-semibold">performance_card</span>
                    <span className="text-white/40">block: #849204</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Item 1 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/50">
                        <span>Mempool Latency</span>
                        <span className="text-white">98ms</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "98%" }} />
                      </div>
                    </div>
                    {/* Item 2 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/50">
                        <span>Consensus Speed</span>
                        <span className="text-white">800ms</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }} />
                      </div>
                    </div>
                    {/* Item 3 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/50">
                        <span>Signature Audit</span>
                        <span className="text-white">100%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                    {/* Item 4 */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-white/50">
                        <span>Execution Gas</span>
                        <span className="text-white">0.0001 MON</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: "95%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#3054ff] uppercase tracking-wider">On-Chain Explorer Logs</div>
                  <h3 className="text-2xl font-semibold text-white tracking-tight">
                    Detailed scorecards and auditable threat logs
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    SwarmGuard logs agent reasoning justifications, transaction signatures, and block headers directly on-chain for complete public verification.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Features Grid Section (Original 3-column features section) */}
      <section id="features" className="relative w-full py-24 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium font-instrument-sans uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Core Capabilities
            </div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Design, Optimized, Deployed
            </h2>
            <p className="text-white/60 text-lg">
              Three specialized AI subagents handle the critical pillars of modern website publishing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Card 1: Prompting */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group border border-white/10 bg-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300 shadow-xl"
            >
              <div className="p-8 space-y-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">Specialized Security Swarm</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Independent agents analyze transactions, prices, TVL drops, and wallet profiles, preventing false positives and central points of failure.
                </p>
              </div>
              {/* Replace image with interactive agent widget */}
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 h-48 flex flex-col justify-between font-mono text-[10px] text-white/80">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-semibold text-white/95 text-left">swarm_node_monitor</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 my-2 text-left">
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded border border-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-white/80">⚡ FlashloanDetector</span>
                      <span className="text-emerald-400 font-semibold font-sans">Active</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded border border-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-white/80">👁️ OracleWatcher</span>
                      <span className="text-emerald-400 font-semibold font-sans">Active</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded border border-white/5 hover:bg-white/10 transition-colors">
                      <span className="text-white/80">📈 VelocityTracker</span>
                      <span className="text-emerald-400 font-semibold font-sans">Active</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-white/40 flex justify-between">
                    <span>Block sync: #849204</span>
                    <span>Status: Syncing (80ms lat)</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: SEO */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group border border-white/10 bg-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300 shadow-xl"
            >
              <div className="p-8 space-y-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">On-Chain Consensus Engine</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Votes are validated, counted, and executed directly on Monad. Verdicts are fully immutable and verifiable by anyone.
                </p>
              </div>
              {/* Replace image with Interactive Consensus Weight Calculator */}
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 h-48 flex flex-col justify-between font-mono text-[10px] text-white/80">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-semibold text-white/95 text-left">consensus_threshold_check</span>
                    <span className="text-blue-400 font-bold">66% Threshold</span>
                  </div>

                  {/* Interactivity: consensus calculation display */}
                  <div className="space-y-3 my-auto text-left">
                    <div className="flex justify-between items-center text-[9px] text-white/50">
                      <span>Consensus Tally:</span>
                      <span className="text-white">3 / 4 votes (75%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: "75%" }} />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-1.5 pt-1 text-center text-[8px]">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1.5 rounded font-bold">A1: YES</div>
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1.5 rounded font-bold">A2: YES</div>
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-1.5 rounded font-bold">A3: YES</div>
                      <div className="bg-white/5 border border-white/10 text-white/40 py-1.5 rounded">A4: --</div>
                    </div>
                  </div>

                  <div className="text-[9px] text-white/40 flex justify-between pt-1">
                    <span>Target: 0x92f...48b3</span>
                    <span className="text-emerald-400 font-bold">Consensus Reached</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Hosting */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 30 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group border border-white/10 bg-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all duration-300 shadow-xl"
            >
              <div className="p-8 space-y-4">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold">Automated Defensive Actions</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Sub-second consensus triggers pause hooks instantly. Protect your protocols without waiting for a human review.
                </p>
              </div>
              {/* Replace image with Code execution visualizer */}
              <div className="px-6 pb-6">
                <div className="rounded-xl border border-white/10 bg-black/40 p-4 h-48 flex flex-col justify-between font-mono text-[9px] text-white/80">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="font-semibold text-white/95 text-left">SwarmCoordinator.sol</span>
                    <span className="text-red-400 font-semibold font-sans">PAUSABLE_HOOK</span>
                  </div>

                  <div className="my-auto font-mono text-[9px] text-blue-300/90 leading-tight space-y-0.5 text-left select-all bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <div><span className="text-purple-400">function</span> <span className="text-yellow-300">pauseTarget</span>(address target) <span className="text-purple-400">external</span> &#123;</div>
                    <div className="pl-4"><span className="text-purple-400">require</span>(checkConsensus(), <span className="text-green-300">"unauthorized"</span>);</div>
                    <div className="pl-4">IPausable(target).pause();</div>
                    <div className="pl-4"><span className="text-purple-400">emit</span> <span className="text-yellow-300">ProtocolPaused</span>(target, block.timestamp);</div>
                    <div>&#125;</div>
                  </div>

                  <div className="text-[9px] text-white/40 flex justify-between pt-1">
                    <span>Block finality: 800ms</span>
                    <span className="text-violet-400 font-bold">Sub-second Auto-Pause</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section Component */}
      <section id="pricing" className="relative w-full py-24 px-6 border-t border-white/5 bg-black/40">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-medium font-instrument-sans uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> PRICING TIERS
            </div>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Flexible Protection for Your Protocol
            </h2>
            <p className="text-white/60 text-lg">
              Secure your smart contracts on testnet for free, or scale up to full-swarm mainnet shields.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Developer Sandbox */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-8 flex flex-col justify-between hover:border-white/20 transition-all duration-300">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white/60">Developer Sandbox</h3>
                  <div className="text-4xl font-semibold mt-2">$0</div>
                  <div className="text-white/40 text-xs mt-1">Free forever (Testnet)</div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Perfect for testing security agent logic and custom consensus setups on Monad testnet.
                </p>
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> 1 Monitored Contract
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Standard agent logs
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Testnet explorer support
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium text-sm transition-all duration-200 cursor-pointer">
                Start Deploying
              </button>
            </div>

            {/* Protocol Shield */}
            <div className="relative border border-blue-500/30 bg-blue-950/10 backdrop-blur-sm rounded-2xl p-8 flex flex-col justify-between hover:border-blue-500/50 transition-all duration-300 shadow-lg shadow-blue-500/5">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-semibold tracking-wider uppercase px-4 py-1 rounded-full border border-blue-400/40">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-blue-400">Protocol Shield</h3>
                  <div className="text-4xl font-semibold mt-2">$199<span className="text-sm font-normal text-white/40"> / mo</span></div>
                  <div className="text-white/40 text-xs mt-1">Billed monthly</div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Full production security swarm monitoring mempools, prices, and balances continuously.
                </p>
                <div className="border-t border-white/15 pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> 4 Dedicated Security Agents
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Custom consensus thresholds
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Sub-second pause execution
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Slack/Discord alert webhooks
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 bg-white text-black hover:bg-white/95 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-white/5">
                Secure Protocol
              </button>
            </div>

            {/* Custom Swarm */}
            <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-2xl p-8 flex flex-col justify-between hover:border-white/20 transition-all duration-300">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white/60">Custom Swarm</h3>
                  <div className="text-4xl font-semibold mt-2">Custom</div>
                  <div className="text-white/40 text-xs mt-1">Scale dynamically</div>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">
                  Tailored solutions for high-TVL ecosystems requiring dedicated agent clusters and SLAs.
                </p>
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Infinite agent nodes
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Custom LLM weights
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <Check className="w-4 h-4 text-blue-400 shrink-0" /> Zero-delay SLA protection
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium text-sm transition-all duration-200 cursor-pointer">
                Contact Swarm team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section Component */}
      <footer className="relative w-full py-16 px-6 border-t border-white/5 bg-black/60 text-white/60 text-sm">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-base">
              <SwarmIcon /> SwarmGuard
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              Decentralized AI security swarm for DeFi protocols on Monad. Autonomous monitoring, trustless consensus, and sub-second auto-pauses.
            </p>
            <p className="text-xs text-white/20">
              © 2026 SwarmGuard. All rights reserved.
            </p>
          </div>

          {/* Links 1 */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#hero" className="hover:text-white transition-colors duration-150">Security Agents</a></li>
              <li><a href="#features" className="hover:text-white transition-colors duration-150">SwarmCoordinator</a></li>
              <li><a href="#features" className="hover:text-white transition-colors duration-150">On-Chain Logs</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Developers</h4>
            <ul className="space-y-2 text-xs">
              <li><a className="hover:text-white transition-colors duration-150 cursor-pointer">Documentation</a></li>
              <li><a className="hover:text-white transition-colors duration-150 cursor-pointer">Monad Integration</a></li>
              <li><a className="hover:text-white transition-colors duration-150 cursor-pointer">Contract ABIs</a></li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Subscribe to Alerts</h4>
            <p className="text-xs text-white/40">
              Receive updates on new security agents and threat vector definitions.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="email@address.com"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:border-white/35 transition-colors duration-200"
              />
              <button className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-white/95 transition-all duration-200 cursor-pointer">
                Join
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
