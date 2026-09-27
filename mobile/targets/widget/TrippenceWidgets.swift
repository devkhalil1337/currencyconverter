import SwiftUI
import WidgetKit

@main
struct TrippenceWidgets: WidgetBundle {
    var body: some Widget {
        PairWidget()
        RatesWidget()
    }
}

struct PairWidget: Widget {
    let kind = "TrippencePair"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RatesProvider()) { entry in
            PairWidgetView(entry: entry)
        }
        .configurationDisplayName("Pair")
        .description("Your first currency against your home currency.")
        .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryCircular, .accessoryInline])
    }
}

struct RatesWidget: Widget {
    let kind = "TrippenceRates"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RatesProvider()) { entry in
            RatesWidgetView(entry: entry)
        }
        .configurationDisplayName("Rates")
        .description("Up to three currencies against your home currency.")
        .supportedFamilies([.systemMedium])
    }
}
