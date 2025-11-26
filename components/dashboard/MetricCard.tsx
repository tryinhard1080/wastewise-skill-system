interface MetricCardProps {
    title: string
    value: string | number
    subtext?: string
    progress?: {
        label: string
        value: number
        status: 'excellent' | 'good' | 'warning' | 'danger'
    }
}

export function MetricCard({ title, value, subtext, progress }: MetricCardProps) {
    const getProgressColor = (status: string) => {
        switch (status) {
            case 'excellent':
                return 'from-emerald-500 to-green-600'
            case 'good':
                return 'from-green-400 to-emerald-500'
            case 'warning':
                return 'from-yellow-400 to-orange-500'
            case 'danger':
                return 'from-orange-500 to-red-600'
            default:
                return 'from-gray-400 to-gray-500'
        }
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-emerald-600 rounded-lg p-5 transition-all duration-300 hover:translate-x-1 hover:shadow-lg">
            <strong className="block text-blue-900 mb-2 text-sm font-semibold">{title}</strong>
            <div className="text-3xl font-bold text-emerald-700 mb-1">{value}</div>
            {subtext && <div className="text-xs text-gray-600 mb-3">{subtext}</div>}

            {progress && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{progress.label}</span>
                        <span className="font-semibold">{progress.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getProgressColor(progress.status)} transition-all duration-1000 ease-out`}
                            style={{ width: `${progress.value}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
