import SwiftUI
import WidgetKit

/// Same palette as the app and the Android widget.
struct Tone {
    let bg: Color
    let ink: Color
    let muted: Color
    let accent: Color

    static let light = Tone(bg: rgb(0xF5F4EF), ink: rgb(0x15171C), muted: rgb(0x5B6068), accent: rgb(0x0F766E))
    static let dark = Tone(bg: rgb(0x171A1F), ink: rgb(0xF1F0EB), muted: rgb(0x9CA1A9), accent: rgb(0x5EEAD4))

    static func of(_ scheme: ColorScheme) -> Tone {
        scheme == .dark ? Tone.dark : Tone.light
    }
}

func rgb(_ hex: UInt32) -> Color {
    Color(
        .sRGB,
        red: Double((hex >> 16) & 0xFF) / 255,
        green: Double((hex >> 8) & 0xFF) / 255,
        blue: Double(hex & 0xFF) / 255,
        opacity: 1
    )
}

enum Links {
    static let app = URL(string: "trippence://")
    static let paywall = URL(string: "trippence://paywall?reason=widgets")

    static func forEntry(_ entry: RatesEntry) -> URL? {
        entry.status == .locked ? paywall : app
    }
}

extension RatesEntry {
    var first: RateRow? { rows.first }

    var homeCode: String { home.uppercased() }

    /// "USD → EUR": the pair reads as 1 home currency in the other one.
    var pairTitle: String {
        guard let row = first else { return homeCode }
        return "\(homeCode) → \(row.code.uppercased())"
    }

    /// VoiceOver would read the arrow as "right arrow".
    var pairSpokenTitle: String {
        guard let row = first else { return homeCode }
        return "\(homeCode) to \(row.code.uppercased())"
    }
}

// MARK: - Shared states

struct LockedView: View {
    let tone: Tone

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Trippence Pro")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(tone.accent)
            Text("Unlock widgets")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(tone.ink)
            Text("Live rates on your Home Screen")
                .font(.system(size: 12))
                .foregroundStyle(tone.muted)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct SetupView: View {
    let tone: Tone

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Trippence")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(tone.accent)
            Text("Open the app to load your rates")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(tone.ink)
                .lineLimit(3)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

// MARK: - Pair (small + Lock Screen)

struct PairWidgetView: View {
    let entry: RatesEntry

    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var colorScheme

    private var tone: Tone { Tone.of(colorScheme) }

    private var isAccessory: Bool {
        switch family {
        case .accessoryCircular, .accessoryRectangular, .accessoryInline:
            return true
        default:
            return false
        }
    }

    var body: some View {
        content
            .containerBackground(isAccessory ? Color.clear : tone.bg, for: .widget)
            .widgetURL(Links.forEntry(entry))
    }

    @ViewBuilder
    private var content: some View {
        switch family {
        case .accessoryInline:
            Text(inlineText)
        case .accessoryCircular:
            PairCircularView(entry: entry)
        case .accessoryRectangular:
            PairRectangularView(entry: entry)
        default:
            switch entry.status {
            case .locked:
                LockedView(tone: tone)
            case .setup:
                SetupView(tone: tone)
            case .ready:
                PairSmallView(entry: entry, tone: tone)
            }
        }
    }

    private var inlineText: String {
        switch entry.status {
        case .locked:
            return "Trippence Pro"
        case .setup:
            return "Open Trippence"
        case .ready:
            guard let row = entry.first else { return "Trippence" }
            return "\(row.code.uppercased()) \(RateText.full(row.rate))"
        }
    }
}

struct PairSmallView: View {
    let entry: RatesEntry
    let tone: Tone

    private var subtitle: String {
        guard let row = entry.first, !row.name.isEmpty else { return "per 1 \(entry.homeCode)" }
        return row.name
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(entry.pairTitle)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(tone.accent)
                .lineLimit(1)
                .accessibilityLabel(entry.pairSpokenTitle)
            Spacer(minLength: 4)
            Text(RateText.full(entry.first?.rate))
                .font(.system(size: 32, weight: .semibold).monospacedDigit())
                .foregroundStyle(tone.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(tone.muted)
                .lineLimit(1)
            Spacer(minLength: 4)
            Text(RateText.updated(entry.updatedAt))
                .font(.system(size: 11).monospacedDigit())
                .foregroundStyle(tone.muted)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct PairRectangularView: View {
    let entry: RatesEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            switch entry.status {
            case .locked:
                Text("Trippence Pro")
                    .font(.system(size: 13, weight: .semibold))
                    .widgetAccentable()
                Text("Unlock widgets")
                    .font(.system(size: 15, weight: .semibold))
            case .setup:
                Text("Trippence")
                    .font(.system(size: 13, weight: .semibold))
                    .widgetAccentable()
                Text("Open to load rates")
                    .font(.system(size: 15, weight: .semibold))
            case .ready:
                Text(entry.pairTitle)
                    .font(.system(size: 13, weight: .semibold))
                    .widgetAccentable()
                    .lineLimit(1)
                    .accessibilityLabel(entry.pairSpokenTitle)
                Text(RateText.full(entry.first?.rate))
                    .font(.system(size: 22, weight: .semibold).monospacedDigit())
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text(RateText.updated(entry.updatedAt))
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct PairCircularView: View {
    let entry: RatesEntry

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            switch entry.status {
            case .locked:
                Image(systemName: "lock.fill")
                    .font(.system(size: 18, weight: .semibold))
            case .setup:
                Image(systemName: "arrow.left.arrow.right")
                    .font(.system(size: 18, weight: .semibold))
            case .ready:
                VStack(spacing: 0) {
                    Text(entry.first?.code.uppercased() ?? entry.homeCode)
                        .font(.system(size: 11, weight: .semibold))
                        .widgetAccentable()
                        .lineLimit(1)
                    Text(RateText.short(entry.first?.rate))
                        .font(.system(size: 15, weight: .semibold).monospacedDigit())
                        .lineLimit(1)
                        .minimumScaleFactor(0.5)
                }
                .padding(.horizontal, 4)
            }
        }
    }
}

// MARK: - Rates (medium)

struct RatesWidgetView: View {
    let entry: RatesEntry

    @Environment(\.colorScheme) private var colorScheme

    private var tone: Tone { Tone.of(colorScheme) }

    var body: some View {
        content
            .containerBackground(tone.bg, for: .widget)
            .widgetURL(Links.forEntry(entry))
    }

    @ViewBuilder
    private var content: some View {
        switch entry.status {
        case .locked:
            LockedView(tone: tone)
        case .setup:
            SetupView(tone: tone)
        case .ready:
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text("1 " + entry.homeCode)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(tone.ink)
                    Spacer(minLength: 8)
                    Text(RateText.updated(entry.updatedAt))
                        .font(.system(size: 11).monospacedDigit())
                        .foregroundStyle(tone.muted)
                        .lineLimit(1)
                }
                Spacer(minLength: 6)
                VStack(spacing: 8) {
                    ForEach(Array(entry.rows.prefix(3))) { row in
                        RateRowView(row: row, tone: tone)
                    }
                }
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
    }
}

struct RateRowView: View {
    let row: RateRow
    let tone: Tone

    var body: some View {
        HStack(spacing: 8) {
            Text(row.code.uppercased())
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(tone.accent)
                .lineLimit(1)
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .frame(minWidth: 40)
                .background(tone.accent.opacity(0.14), in: RoundedRectangle(cornerRadius: 6, style: .continuous))
            Text(row.name)
                .font(.system(size: 13))
                .foregroundStyle(tone.muted)
                .lineLimit(1)
            Spacer(minLength: 8)
            Text(RateText.full(row.rate))
                .font(.system(size: 17, weight: .semibold).monospacedDigit())
                .foregroundStyle(tone.ink)
                .lineLimit(1)
                .layoutPriority(1)
        }
    }
}
