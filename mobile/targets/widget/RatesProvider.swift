import Foundation
import WidgetKit

// Must match src/widgets/ios-widget.ts and the App Group in app.json.
private let appGroup = "group.com.currency.io"
private let snapshotKey = "widgetSnapshot"
// Written by the widget itself; the app never reads it.
private let fetchedRatesKey = "widgetFetchedRates"

/// The JSON the app saves (IosWidgetSnapshot in src/lib/widget-snapshot.ts).
struct StoredSnapshot: Decodable {
    struct Row: Decodable {
        let code: String
        let name: String?
        let rate: Double?
    }

    let home: String
    let rows: [Row]
    let usdRates: [String: Double]?
    /// Milliseconds since 1970, like JavaScript's Date.now().
    let updatedAt: Double?
    let locked: Bool?

    static func load() -> StoredSnapshot? {
        guard let defaults = UserDefaults(suiteName: appGroup) else { return nil }
        // ExtensionStorage saves strings as strings; accept Data too in case that changes.
        var json: Data? = nil
        if let string = defaults.string(forKey: snapshotKey) {
            json = string.data(using: .utf8)
        } else {
            json = defaults.data(forKey: snapshotKey)
        }
        guard let data = json else { return nil }
        return try? JSONDecoder().decode(StoredSnapshot.self, from: data)
    }

    /// Seconds since 1970, or 0 when the app hasn't fetched rates yet.
    var updatedSeconds: Double {
        guard let ms = updatedAt else { return 0 }
        return ms / 1000
    }

    /// Worth fetching only for Pro users whose newest rates are older than the app's
    /// own 30-minute refresh window.
    func needsLiveRates(now: Date, fetched: FetchedRates?) -> Bool {
        guard locked == false else { return false }
        let newest = max(updatedSeconds, fetched?.fetchedAt ?? 0)
        return now.timeIntervalSince1970 - newest >= 30 * 60
    }
}

/// Rates the widget fetched on its own. Kept so a failed fetch later doesn't roll the
/// widget back to the app's older rates, and so reloads don't refetch every time.
struct FetchedRates: Codable {
    let usd: [String: Double]
    /// Seconds since 1970.
    let fetchedAt: Double

    static func load() -> FetchedRates? {
        guard let data = UserDefaults(suiteName: appGroup)?.data(forKey: fetchedRatesKey) else { return nil }
        return try? JSONDecoder().decode(FetchedRates.self, from: data)
    }

    func save() {
        guard let data = try? JSONEncoder().encode(self) else { return }
        UserDefaults(suiteName: appGroup)?.set(data, forKey: fetchedRatesKey)
    }
}

struct RateRow: Identifiable {
    let code: String
    let name: String
    /// How many units of `code` one unit of the home currency buys.
    let rate: Double?

    var id: String { code }
}

struct RatesEntry: TimelineEntry {
    enum Status {
        case ready
        case locked
        /// The app hasn't saved anything yet.
        case setup
    }

    let date: Date
    let status: Status
    let home: String
    let rows: [RateRow]
    let updatedAt: Date?

    static var sample: RatesEntry {
        RatesEntry(
            date: Date(),
            status: .ready,
            home: "usd",
            rows: [
                RateRow(code: "eur", name: "Euro", rate: 0.9234),
                RateRow(code: "gbp", name: "British Pound", rate: 0.7891),
                RateRow(code: "jpy", name: "Japanese Yen", rate: 149.32),
            ],
            updatedAt: Date()
        )
    }

    /// Prefers rates the widget fetched when they're newer than the ones the app saved.
    static func make(from snapshot: StoredSnapshot?, fetched: FetchedRates?, now: Date) -> RatesEntry {
        guard let snapshot = snapshot else {
            return RatesEntry(date: now, status: .setup, home: "", rows: [], updatedAt: nil)
        }
        let home = snapshot.home
        let saved = snapshot.usdRates ?? [:]
        var newer: FetchedRates? = nil
        if let fetched = fetched, fetched.fetchedAt > snapshot.updatedSeconds {
            newer = fetched
        }
        var rows: [RateRow] = []
        var usedFetched = false
        for row in snapshot.rows {
            var rate: Double? = row.rate ?? crossRate(from: home, to: row.code, usd: saved)
            if let usd = newer?.usd, let live = crossRate(from: home, to: row.code, usd: usd) {
                rate = live
                usedFetched = true
            }
            rows.append(RateRow(code: row.code, name: row.name ?? "", rate: rate))
        }
        var updatedAt: Date? = nil
        if usedFetched, let newer = newer {
            updatedAt = Date(timeIntervalSince1970: newer.fetchedAt)
        } else if let ms = snapshot.updatedAt {
            updatedAt = Date(timeIntervalSince1970: ms / 1000)
        }
        // A missing flag counts as locked so free users never see rates by accident.
        let status: Status = (snapshot.locked ?? true) ? .locked : .ready
        return RatesEntry(date: now, status: status, home: home, rows: rows, updatedAt: updatedAt)
    }

    /// Same as unitRate in src/lib/convert.ts: rates are USD-based.
    static func crossRate(from home: String, to code: String, usd: [String: Double]) -> Double? {
        guard let homeUsd = usd[home], let codeUsd = usd[code], homeUsd > 0, codeUsd > 0 else { return nil }
        let rate = codeUsd / homeUsd
        return rate.isFinite ? rate : nil
    }
}

/// Same free API the app uses, so the widget stays fresh between app launches.
enum LiveRates {
    private static let endpoints = [
        "https://latest.currency-api.pages.dev/v1/currencies/usd.json",
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    ]

    static func fetch() async -> [String: Double]? {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 6
        configuration.timeoutIntervalForResource = 8
        let session = URLSession(configuration: configuration)
        defer { session.finishTasksAndInvalidate() }

        for endpoint in endpoints {
            guard let url = URL(string: endpoint) else { continue }
            do {
                let (data, response) = try await session.data(from: url)
                if let http = response as? HTTPURLResponse, !(200...299).contains(http.statusCode) {
                    continue
                }
                if let rates = parse(data) {
                    return rates
                }
            } catch {
                continue
            }
        }
        return nil
    }

    /// Reads `{ "date": "...", "usd": { "eur": 0.92, ... } }`, skipping anything that isn't a number.
    private static func parse(_ data: Data) -> [String: Double]? {
        guard
            let object = try? JSONSerialization.jsonObject(with: data, options: []),
            let root = object as? [String: Any],
            let usd = root["usd"] as? [String: Any]
        else { return nil }
        var rates: [String: Double] = [:]
        for (code, value) in usd {
            if let number = value as? NSNumber {
                let rate = number.doubleValue
                if rate.isFinite && rate > 0 {
                    rates[code] = rate
                }
            }
        }
        return rates.isEmpty ? nil : rates
    }
}

struct RatesProvider: TimelineProvider {
    func placeholder(in context: Context) -> RatesEntry {
        RatesEntry.sample
    }

    func getSnapshot(in context: Context, completion: @escaping (RatesEntry) -> Void) {
        if context.isPreview {
            completion(RatesEntry.sample)
            return
        }
        completion(RatesEntry.make(from: StoredSnapshot.load(), fetched: FetchedRates.load(), now: Date()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RatesEntry>) -> Void) {
        let snapshot = StoredSnapshot.load()
        let cached = FetchedRates.load()
        let needsRates = snapshot?.needsLiveRates(now: Date(), fetched: cached) ?? false
        Task {
            var fetched = cached
            if needsRates {
                let usd = await LiveRates.fetch()
                if let usd = usd {
                    let fresh = FetchedRates(usd: usd, fetchedAt: Date().timeIntervalSince1970)
                    fresh.save()
                    fetched = fresh
                }
            }
            let now = Date()
            let entry = RatesEntry.make(from: snapshot, fetched: fetched, now: now)
            let next = now.addingTimeInterval(30 * 60)
            completion(Timeline(entries: [entry], policy: .after(next)))
        }
    }
}
