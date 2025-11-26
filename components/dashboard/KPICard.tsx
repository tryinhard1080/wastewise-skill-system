interface KPICardProps {
    label: string
    value: string | number
    isPrimary?: boolean
    progress?: number
    progressLabel?: string
}

export function KPICard({ label, value, isPrimary = false, progress, progressLabel }: KPICardProps) {
    const getProgressColor = () => {
        if (!progress) return 'bg-gray-300'
        if (progress >= 90) return 'bg-gradient-to-r from-emerald-500 to-green-600'
        if (progress >= 70) return 'bg-gradient-to-r from-green-400 to-emerald-500'
        if (progress >= 50) return 'bg-gradient-to-r from-yellow-400 to-orange-500'
        return 'bg-gradient-to-r from-orange-500 to-red-600'
    }

    return (
        <div
            className={`rounded-xl p-4 text-center transition-all duration-300 hover:-translate-y-1 ${isPrimary
                    ? 'bg-emerald-700 border-2 border-green-300 shadow-lg shadow-green-300/30'
                    : 'bg-white/10 backdrop-blur-sm'
                }`}
        >
            <div className={`text-xs uppercase tracking-wide mb-2 ${isPrimary ? 'opacity-90' : 'opacity-85'}`}>
                {label}
            </div>
            <div className={`text-2xl font-bold ${isPrimary ? 'text-green-300' : 'text-white'}`}>
                {value}
            </div>
            {progress !== undefined && (
                <div className="mt-3">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getProgressColor()} transition-all duration-1000 ease-out`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {progressLabel && (
                        <div className="text-xs mt-1 opacity-75">{progressLabel}</div>
                    )}
                </div>
            )}
        </div>
    )
}
