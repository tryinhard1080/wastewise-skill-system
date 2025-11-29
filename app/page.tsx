"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

// Demo URL - uses environment variable in production, localhost in development
const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || "http://localhost:5173"
import DocumentationSection from "../components/documentation-section"
import TestimonialsSection from "../components/testimonials-section"
import FAQSection from "../components/faq-section"
import PricingSection from "../components/pricing-section"
import CTASection from "../components/cta-section"
import FooterSection from "../components/footer-section"
import { AnimatedWorkflow } from "../components/landing/animated-workflow"

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  return (
    <div className="w-full min-h-screen relative bg-white overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
                <div className="flex justify-center items-center">
                  <div className="flex justify-start items-center">
                    <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
                      WasteWise
                    </div>
                  </div>
                  <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 flex justify-start items-start hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
                    <div className="flex justify-start items-center">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Products
                      </div>
                    </div>
                    <div className="flex justify-start items-center">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Pricing
                      </div>
                    </div>
                    <div className="flex justify-start items-center">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Docs
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <a href="/login" className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center no-underline hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                      Log in
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full sm:pl-0 sm:pr-0 pl-0 pr-0 relative">
              {/* Gradient Background Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 opacity-60 pointer-events-none" />

              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 relative z-10">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <div className="w-full max-w-[748.71px] lg:w-[748.71px] text-center flex justify-center flex-col text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif px-2 sm:px-4 md:px-0">
                    <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                      Reduce Waste Costs
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 bg-clip-text text-transparent font-semibold">
                      by Up to 30%
                    </span>
                  </div>
                  <div className="w-full max-w-[506.08px] lg:w-[506.08px] text-center flex justify-center flex-col text-gray-600 sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans px-2 sm:px-4 md:px-0 lg:text-lg font-medium text-sm">
                    Data-driven waste management analysis for multifamily properties.
                    <br className="hidden sm:block" />
                    Upload invoices, get insights in minutes.
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <div className="backdrop-blur-[8.25px] flex justify-start items-center gap-4 flex-col sm:flex-row">
                  <a href="/login" className="group h-12 sm:h-12 md:h-14 px-8 sm:px-10 md:px-12 lg:px-14 py-3 relative bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg hover:shadow-xl overflow-hidden rounded-full flex justify-center items-center transition-all duration-300 transform hover:-translate-y-1 cursor-pointer no-underline">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-white/10" />
                    <div className="flex flex-col justify-center text-white text-base sm:text-base md:text-[16px] font-semibold leading-5 font-sans relative z-10">
                      START FREE ANALYSIS
                      <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </a>
                  <button
                    onClick={() => alert('Demo video coming soon! Check back later for a walkthrough of WasteWise.')}
                    className="group h-12 sm:h-12 md:h-14 px-8 sm:px-10 md:px-12 lg:px-14 py-3 relative bg-white border-2 border-gray-900 hover:bg-gray-50 overflow-hidden rounded-full flex justify-center items-center transition-all duration-300 transform hover:-translate-y-1 cursor-pointer no-underline shadow-md hover:shadow-lg"
                  >
                    <div className="flex flex-row justify-center items-center gap-2 text-gray-900 text-base sm:text-base md:text-[16px] font-semibold leading-5 font-sans">
                      <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300 group-hover:scale-110">
                        <path d="M3 2L13 8L3 14V2Z" />
                      </svg>
                      Watch 2-Min Demo
                    </div>
                  </button>
                </div>
              </div>

              <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
                <img
                  src="/mask-group-pattern.svg"
                  alt=""
                  className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-20 sm:opacity-25 md:opacity-30 mix-blend-multiply"
                  style={{
                    filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
                  }}
                />
              </div>

              {/* Animated Workflow Preview */}
              <div className="w-full pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 px-2 sm:px-4 relative z-5">
                <AnimatedWorkflow />
              </div>

              <div className="self-stretch border-t border-[#E0DEDB] border-b border-[#E0DEDB] flex justify-center items-start">
                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Left decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 px-0 sm:px-2 md:px-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
                  {/* Feature Cards */}
                  <FeatureCard
                    title="Automated Invoice Processing"
                    description="Upload PDFs, AI extracts service data, tonnage, and charges automatically."
                    isActive={activeCard === 0}
                    progress={activeCard === 0 ? progress : 0}
                    onClick={() => handleCardClick(0)}
                  />
                  <FeatureCard
                    title="AI-Powered Optimization"
                    description="Identify over-servicing, right-size contracts, and reduce contamination fees."
                    isActive={activeCard === 1}
                    progress={activeCard === 1 ? progress : 0}
                    onClick={() => handleCardClick(1)}
                  />
                  <FeatureCard
                    title="Professional Reports"
                    description="Download Excel workbooks and interactive HTML dashboards instantly."
                    isActive={activeCard === 2}
                    progress={activeCard === 2 ? progress : 0}
                    onClick={() => handleCardClick(2)}
                  />
                </div>

                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Right decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Proof Section */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
                <div className="self-stretch px-4 sm:px-6 md:px-24 py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                  <div className="w-full max-w-[586px] px-4 sm:px-6 py-6 sm:py-8 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-4 sm:gap-6 shadow-none">
                    <Badge
                      icon={
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="3" width="4" height="6" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="1" width="4" height="8" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="2" y="4" width="1" height="1" fill="#37322F" />
                          <rect x="3.5" y="4" width="1" height="1" fill="#37322F" />
                          <rect x="2" y="5.5" width="1" height="1" fill="#37322F" />
                          <rect x="3.5" y="5.5" width="1" height="1" fill="#37322F" />
                          <rect x="8" y="2" width="1" height="1" fill="#37322F" />
                          <rect x="9.5" y="2" width="1" height="1" fill="#37322F" />
                          <rect x="8" y="3.5" width="1" height="1" fill="#37322F" />
                          <rect x="9.5" y="3.5" width="1" height="1" fill="#37322F" />
                          <rect x="8" y="5" width="1" height="1" fill="#37322F" />
                          <rect x="9.5" y="5" width="1" height="1" fill="#37322F" />
                        </svg>
                      }
                      text="Social Proof"
                    />
                    <div className="w-full max-w-[472.55px] text-center flex justify-center flex-col text-gray-900 text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold leading-tight md:leading-[60px] font-sans tracking-tight">
                      Trusted by 850+ Properties Nationwide
                    </div>
                    <div className="self-stretch text-center text-gray-600 text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 mt-6">
                        <div className="flex flex-col items-center group cursor-default">
                          <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110">
                            $2.4M+
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-2">Total Saved</div>
                        </div>
                        <div className="flex flex-col items-center group cursor-default">
                          <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110">
                            850+
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-2">Properties Analyzed</div>
                        </div>
                        <div className="flex flex-col items-center group cursor-default">
                          <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110">
                            95%
                          </div>
                          <div className="text-sm font-medium text-gray-600 mt-2">Client Satisfaction</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bento Grid Section */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
                {/* Header Section */}
                <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                  <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
                    <Badge
                      icon={
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="1" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                        </svg>
                      }
                      text="How It Works"
                    />
                    <div className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                      From Invoice to Insights in 4 Steps
                    </div>
                    <div className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                      Upload your waste data and get actionable recommendations
                      <br />
                      in minutes, not weeks.
                    </div>
                  </div>
                </div>

                {/* Bento Grid Content */}
                <div className="self-stretch flex justify-center items-start">
                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Left decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                    {/* Step 1 - Upload Files */}
                    <div className="border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-xl font-bold">1</div>
                          <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                            Upload Files
                          </h3>
                        </div>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Drag and drop invoices, contracts, or haul logs. We support PDF, Excel, and CSV formats.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg border-2 border-dashed border-[rgba(55,50,47,0.2)] bg-white flex items-center justify-center flex-col gap-4">
                        <svg className="w-16 h-16 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div className="text-[#605A57] text-sm text-center">
                          <span className="font-medium text-[#22C55E]">Click to browse</span> or drag files here
                        </div>
                      </div>
                    </div>

                    {/* Step 2 - Property Info */}
                    <div className="border-b border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-xl font-bold">2</div>
                          <h3 className="text-[#37322F] font-semibold leading-tight font-sans text-lg sm:text-xl">
                            Enter Property Info
                          </h3>
                        </div>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Property name, units, location, and equipment type help us tailor the analysis.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg bg-white p-6 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="text-xs font-medium text-[#605A57]">Property Name</div>
                          <div className="h-10 rounded border border-[rgba(55,50,47,0.2)] bg-[#F7F5F3] px-3 flex items-center text-sm text-[#37322F]">
                            Columbia Square Apartments
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="text-xs font-medium text-[#605A57]">Units</div>
                            <div className="h-10 rounded border border-[rgba(55,50,47,0.2)] bg-[#F7F5F3] px-3 flex items-center text-sm text-[#37322F]">
                              308
                            </div>
                          </div>
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="text-xs font-medium text-[#605A57]">City</div>
                            <div className="h-10 rounded border border-[rgba(55,50,47,0.2)] bg-[#F7F5F3] px-3 flex items-center text-sm text-[#37322F]">
                              McKinney, TX
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 - AI Analysis */}
                    <div className="border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6 bg-transparent">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-xl font-bold">3</div>
                          <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                            AI Analysis
                          </h3>
                        </div>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Claude Vision extracts data, analyzes patterns, and calculates savings opportunities.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg bg-white p-6 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-sm text-[#37322F]">Processing Invoices</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-[#22C55E] flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></div>
                          </div>
                          <span className="text-sm text-[#37322F]">Regulatory Research</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-[rgba(55,50,47,0.2)]"></div>
                          <span className="text-sm text-[#605A57]">Generating Reports</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 4 - Download Reports */}
                    <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-xl font-bold">4</div>
                          <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                            Download Reports
                          </h3>
                        </div>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Get Excel workbooks and interactive HTML dashboards with actionable recommendations.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg bg-white p-6 flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-3 rounded border border-[rgba(55,50,47,0.1)] hover:border-[#22C55E] transition-colors cursor-pointer">
                          <svg className="w-8 h-8 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#37322F]">Excel Workbook</div>
                            <div className="text-xs text-[#605A57]">Complete analysis spreadsheet</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded border border-[rgba(55,50,47,0.1)] hover:border-[#22C55E] transition-colors cursor-pointer">
                          <svg className="w-8 h-8 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#37322F]">HTML Dashboard</div>
                            <div className="text-xs text-[#605A57]">Interactive charts & graphs</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Right decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Demo Section */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center bg-gradient-to-b from-white to-emerald-50/30">
                <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-12 sm:py-16 md:py-20 flex flex-col justify-center items-center gap-8">
                  {/* Section Header */}
                  <div className="w-full max-w-[616px] lg:w-[616px] flex flex-col justify-start items-center gap-4">
                    <Badge
                      icon={
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" fill="#37322F" />
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#37322F" strokeWidth="1.5" fill="none" />
                        </svg>
                      }
                      text="Live Demo"
                    />
                    <div className="text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                      See WasteWise in Action
                    </div>
                    <div className="text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans max-w-md">
                      Explore our interactive demo to see how WasteWise transforms your waste data into actionable insights.
                    </div>
                  </div>

                  {/* Demo Embed Container */}
                  <div className="w-full max-w-5xl mx-auto">
                    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-[rgba(55,50,47,0.12)] bg-white">
                      {/* Browser-like header */}
                      <div className="bg-[#1f4220] px-4 py-3 flex items-center gap-3">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="flex-1 flex justify-center">
                          <div className="bg-[#2C5F2D] rounded-md px-4 py-1.5 flex items-center gap-2 max-w-md w-full">
                            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-white/80 text-sm truncate">demo.wastewise.app</span>
                          </div>
                        </div>
                      </div>

                      {/* Demo iframe */}
                      <div className="relative w-full aspect-video md:aspect-[3/2]">
                        <iframe
                          src={DEMO_URL}
                          className="absolute inset-0 w-full h-full border-0"
                          title="WasteWise Interactive Demo - Explore dashboard features and invoice scanning"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          referrerPolicy="strict-origin-when-cross-origin"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Demo call-to-action */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                      <a
                        href={DEMO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open WasteWise demo in new tab (opens in new window)"
                        className="group inline-flex items-center gap-2 px-6 py-3 bg-[#2C5F2D] hover:bg-[#1f4220] text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Demo in New Tab
                      </a>
                      <span className="text-[#605A57] text-sm">
                        No signup required - explore freely
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Section */}
              <DocumentationSection />

              {/* Testimonials Section */}
              <TestimonialsSection />

              {/* Pricing Section */}
              <PricingSection />

              {/* FAQ Section */}
              <FAQSection />

              {/* CTA Section */}
              <CTASection />

              {/* Footer Section */}
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// FeatureCard component definition inline to fix import error
function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}) {
  // Icon mapping for each feature
  const getIcon = () => {
    if (title.includes("Invoice")) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    } else if (title.includes("AI") || title.includes("Optimization")) {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  return (
    <div
      className={`group w-full md:flex-1 self-stretch px-6 py-6 overflow-hidden flex flex-col justify-start items-start gap-3 cursor-pointer relative border-b md:border-b-0 last:border-b-0 transition-all duration-300 ${isActive
        ? "bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg border-2 border-emerald-200"
        : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-emerald-200"
        }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-green-500">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 to-green-700 transition-all duration-100 ease-linear shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Icon */}
      <div className={`transition-all duration-300 ${isActive ? "text-emerald-600 scale-110" : "text-gray-600 group-hover:text-emerald-500 group-hover:scale-105"}`}>
        {getIcon()}
      </div>

      <div className="self-stretch flex justify-center flex-col text-gray-900 text-base md:text-base font-bold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-gray-600 text-sm md:text-sm font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>

      {/* Hover indicator */}
      {!isActive && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      )}
    </div>
  )
}
