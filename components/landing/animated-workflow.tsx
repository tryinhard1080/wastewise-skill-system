'use client'

import { useEffect, useState } from 'react'

const steps = [
  { id: 'upload', title: 'Upload Invoices', description: 'Drop your waste invoices' },
  { id: 'analyze', title: 'AI Analysis', description: 'Claude extracts & analyzes' },
  { id: 'results', title: 'Get Savings', description: 'Download optimization report' },
]

export function AnimatedWorkflow() {
  const [activeStep, setActiveStep] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3)
    }, 3000)
    return () => clearInterval(interval)
  }, [isHovered])

  return (
    <div
      className="w-full max-w-[960px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #059669 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="relative p-6 md:p-10">
          {/* Step Indicators */}
          <div className="flex justify-center gap-3 mb-8">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  activeStep === index ? 'bg-emerald-500' : 'bg-slate-100'
                }`}>
                  {index + 1}
                </span>
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </button>
            ))}
          </div>

          {/* Animation Area */}
          <div className="relative min-h-[350px] md:min-h-[420px] flex items-center justify-center">
            {/* Step 1: Upload */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              activeStep === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <UploadStep />
            </div>

            {/* Step 2: Analyze */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              activeStep === 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <AnalyzeStep />
            </div>

            {/* Step 3: Results */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
              activeStep === 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}>
              <ResultsStep />
            </div>
          </div>

          {/* Step Description */}
          <div className="text-center mt-4">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800">
              {steps[activeStep].title}
            </h3>
            <p className="text-slate-600 mt-1">
              {steps[activeStep].description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadStep() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Upload Zone */}
      <div className="w-72 h-52 md:w-80 md:h-56 border-2 border-dashed border-emerald-400 rounded-2xl bg-emerald-50/50 flex flex-col items-center justify-center animate-pulse-slow">
        {/* Dropping Document */}
        <div className="relative animate-bounce-slow">
          <div className="w-16 h-20 bg-white rounded-lg shadow-lg border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-4 h-4 bg-slate-100 border-l border-b border-slate-200" />
            <div className="p-2 pt-6 space-y-1.5">
              <div className="h-1.5 bg-slate-200 rounded w-full" />
              <div className="h-1.5 bg-slate-200 rounded w-3/4" />
              <div className="h-1.5 bg-emerald-400 rounded w-1/2" />
              <div className="h-1.5 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
            PDF
          </div>
        </div>

        <p className="text-emerald-600 text-sm font-medium mt-4">
          Drop invoices here
        </p>
      </div>

      {/* File Types */}
      <div className="flex gap-3">
        {['PDF', 'XLSX', 'CSV'].map((type) => (
          <div key={type} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
            {type}
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyzeStep() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* AI Brain */}
      <div className="relative">
        {/* Outer Glow */}
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping-slow" style={{ margin: -16 }} />

        {/* Brain Container */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl animate-spin-slow">
          <div className="animate-spin-reverse">
            <svg className="w-16 h-16 md:w-20 md:h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>

        {/* Orbiting Dots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-56 md:h-56 animate-spin-slow">
          {[0, 90, 180, 270].map((rotation) => (
            <div key={rotation} className="absolute w-4 h-4" style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${rotation}deg) translateX(80px) translateY(-50%)`,
            }}>
              <div className="w-4 h-4 bg-white rounded-full shadow-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Processing Steps */}
      <div className="flex flex-col gap-2 mt-4">
        {['Extracting data...', 'Analyzing patterns...', 'Calculating savings...'].map((text, i) => (
          <div key={text} className="flex items-center gap-2" style={{ animationDelay: `${i * 0.3}s` }}>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-slate-600">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultsStep() {
  const [count, setCount] = useState(0)
  const targetSavings = 4250

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = targetSavings / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetSavings) {
        setCount(targetSavings)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Results Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Analysis Complete</h4>
            <p className="text-xs text-slate-500">3 optimization opportunities found</p>
          </div>
        </div>

        {/* Savings Amount */}
        <div className="text-center py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl mb-4">
          <p className="text-sm text-slate-600 mb-1">Potential Annual Savings</p>
          <div className="text-4xl md:text-5xl font-bold text-emerald-600">
            ${count.toLocaleString()}/yr
          </div>
        </div>

        {/* Mini Chart */}
        <div className="flex items-end justify-center gap-2 h-16 mb-4">
          {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
            <div
              key={i}
              className={`w-5 rounded-t transition-all duration-500 ${i === 5 ? 'bg-emerald-500' : 'bg-slate-200'}`}
              style={{
                height: `${height}%`,
                transitionDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>

        {/* Download Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel
          </button>
          <button className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
