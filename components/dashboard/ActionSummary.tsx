interface ActionSummaryProps {
    totalSavings: number
    opportunities: Array<{
        priority: number
        title: string
        savings: number
        contact: {
            name: string
            email: string
        }
    }>
}

export function ActionSummary({ totalSavings, opportunities }: ActionSummaryProps) {
    return (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-l-4 border-orange-500 rounded-lg p-6 mb-6 shadow-md">
            <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Action Required - Potential Savings: ${totalSavings.toLocaleString()}/year
            </h2>

            <ul className="space-y-3">
                {opportunities.map((opp, idx) => (
                    <li
                        key={idx}
                        className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                    >
                        <span className="flex-1 text-gray-800">
                            <strong className="text-orange-700">Priority {opp.priority}:</strong> {opp.title} (${opp.savings.toLocaleString()} savings)
                        </span>
                        <a
                            href={`mailto:${opp.contact.email}?subject=Waste Optimization - ${opp.title}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact {opp.contact.name}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}
