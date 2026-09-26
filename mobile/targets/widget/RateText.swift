import Foundation

enum RateText {
    static let missing = "—"

    /// Mirrors formatRate in src/lib/format.ts: 2 decimals from 100, 4 from 1,
    /// and about 4 significant digits below 1.
    static func full(_ value: Double?) -> String {
        guard let value = value, value.isFinite else { return missing }
        let decimals: Int
        if value >= 100 {
            decimals = 2
        } else if value >= 1 || value <= 0 {
            decimals = 4
        } else {
            decimals = min(8, -Int(floor(log10(value))) + 4)
        }
        return number(value, decimals: decimals)
    }

    /// Fits the lock screen circle: "0.92", "18.5", "149", "16.3K".
    static func short(_ value: Double?) -> String {
        guard let value = value, value.isFinite, value > 0 else { return missing }
        if value >= 1_000_000 {
            return number(value / 1_000_000, decimals: value >= 10_000_000 ? 0 : 1) + "M"
        }
        if value >= 10_000 {
            return number(value / 1_000, decimals: value >= 100_000 ? 0 : 1) + "K"
        }
        if value >= 100 {
            return number(value, decimals: 0)
        }
        if value >= 10 {
            return number(value, decimals: 1)
        }
        if value >= 1 {
            return number(value, decimals: 2)
        }
        return number(value, decimals: min(8, -Int(floor(log10(value))) + 1))
    }

    /// "Updated 9:14 AM" today, "Updated Sep 24" for older rates.
    static func updated(_ date: Date?) -> String {
        guard let date = date else { return "Open to load rates" }
        if Calendar.current.isDateInToday(date) {
            return "Updated " + date.formatted(date: .omitted, time: .shortened)
        }
        return "Updated " + date.formatted(.dateTime.month(.abbreviated).day())
    }

    // en-US like the app, which formats rates the same way in every locale.
    private static func number(_ value: Double, decimals: Int) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = decimals
        formatter.maximumFractionDigits = decimals
        formatter.roundingMode = .halfUp
        return formatter.string(from: NSNumber(value: value)) ?? String(format: "%.\(decimals)f", value)
    }
}
