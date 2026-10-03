// Source strings. Other locales must match this shape exactly (see Messages in ./index.ts).
// Placeholders are %{name}; objects with `one`/`other` are plural forms picked by %{count}.
export const en = {
  common: {
    cancel: 'Cancel',
    remove: 'Remove',
    delete: 'Delete',
    close: 'Close',
    back: 'Back',
    tryAgain: 'Try again',
    updating: 'Updating…',
    // context: badge on locked features; keep to about 4 characters
    pro: 'PRO',
    requiresPro: 'Requires Trippence Pro',
    swapCurrencies: 'Swap currencies',
    // context: "Euro to US Dollar" or "EUR to USD"
    fromTo: '%{from} to %{to}',
    // context: a percentage, e.g. "2.5%"
    percent: '%{value}%',
  },
  tabs: {
    // context: tab bar labels and screen titles; keep to about 10 characters
    convert: 'Convert',
    rates: 'Rates',
    trips: 'Trips',
    settings: 'Settings',
  },
  convert: {
    subtitle: 'Tap to set base · hold to remove',
    removeConfirm: 'Remove %{code} from your list?',
    loadFailedTitle: 'Couldn’t load rates',
    loadFailedBody: 'Connect to the internet once and Trippence will keep working offline after that.',
    // context: small caption under the amount being typed; keep short
    amount: 'Amount',
    // context: caption under a converted amount, e.g. "incl. 3% card fee"; keep short
    feeIncluded: 'incl. %{fee}% card fee',
    // context: caption under a converted amount, e.g. "after 3% card fee"; keep short
    feeDeducted: 'after %{fee}% card fee',
    noRate: 'No rate',
    // context: toggle chip; "Real cost" is the feature name (amounts with the card fee added)
    realCostChip: 'Real cost +%{fee}%',
    realCostHint: 'Shows amounts with your card fee, to and from your home currency',
    // context: chip button
    addCurrency: 'Add currency',
    baseHint: 'Base currency. Type an amount on the keypad.',
    otherHint: 'Makes this the base currency. Long press to remove.',
  },
  keypad: {
    delete: 'Delete',
    decimal: 'Decimal point',
  },
  ratesStatus: {
    // context: small status pill in the header; keep short
    loading: 'Loading rates…',
    offlineFrom: 'Offline · rates from %{date}',
    offline: 'Offline',
    updated: 'Updated %{time}',
    refresh: '%{status}. Refresh rates',
  },
  rates: {
    ranges: {
      // context: chart range segments (1 week, 1 month, 1 year, 5 years); max 3 characters
      week: '1W',
      month: '1M',
      year: '1Y',
      fiveYears: '5Y',
    },
    // context: %{range} is a range label such as "1M"; "mid-market" is the rate type
    overRange: 'over %{range} · mid-market',
    alertMarker: 'Alert · %{rate}',
    exportTitle: '%{pair} rates',
    exportFailed: 'Couldn’t export',
    noHistory: 'No history available for this pair and range.',
    chartFailed: 'Couldn’t load the chart.',
    // context: stat labels under the chart; keep to about 6 characters
    low: 'Low',
    high: 'High',
    now: 'Now',
    sourceEcb: 'History: European Central Bank (via Frankfurter)',
    sourceDaily: 'History: exchange-api daily snapshots',
    exportLabel: 'Export chart data as CSV',
    // context: small button next to the source line; keep to about 8 characters
    export: 'Export',
    compareWith: 'Compare with 1 %{code}',
    pastRateTitle: 'Rate on a past date',
    pastRateSubtitle: 'For invoices and expense reports',
  },
  chart: {
    label: 'Chart from %{start} to %{end}, low %{low}, high %{high}',
    empty: 'Chart',
  },
  alerts: {
    yourAlerts: 'Your alerts',
    above: 'Above %{rate}',
    below: 'Below %{rate}',
    footnote:
      'Alerts use daily reference rates and are checked when you open the app and about every 15 minutes in the background.',
    alertMeWhen: 'Alert me when %{pair}',
    now: 'Now %{rate}',
    // context: segment next to the target field; keep to about 12 characters
    risesAbove: 'Rises above',
    fallsBelow: 'Falls below',
    // context: placeholder in a narrow number field; keep short
    targetPlaceholder: 'Target',
    targetLabel: 'Target rate',
    limitReached: {
      one: 'Limit of %{count} alert reached',
      other: 'Limit of %{count} alerts reached',
    },
    unlockMore: 'Unlock more alerts with Pro',
    create: 'Create alert',
    freeUsage: {
      one: '%{used} of %{count} free alert in use',
      other: '%{used} of %{count} free alerts in use',
    },
    savedGranted: 'Alert saved. We’ll notify you when it’s reached.',
    // context: "Reached" is the status label shown on a fired alert (alerts.reached)
    savedUnsupported: 'Alert saved. This preview can’t send notifications, so it will show as Reached in the list below.',
    savedDenied: 'Alert saved, but notifications are off. Turn them on to hear about it.',
    // context: link that opens the system settings for notifications
    openSettings: 'Settings',
    // context: status pill on a fired alert, e.g. "Reached 3 Oct"; keep short
    reached: 'Reached %{date}',
    // context: status pill on an active alert; keep short
    watching: 'Watching',
    rearm: 'Re-arm %{pair} alert',
    delete: 'Delete %{pair} alert',
  },
  notifications: {
    channelName: 'Rate alerts',
    channelDescription: 'When a currency pair reaches your target rate',
    roseAbove: '%{pair} rose above %{rate}',
    fellBelow: '%{pair} fell below %{rate}',
    body: '1 %{from} = %{rate} %{to} now.',
  },
  pastRate: {
    title: 'Past rate',
    date: 'Date',
    dateLabel: 'Date, %{date}',
    opensCalendar: 'Opens a calendar',
    dateInputLabel: 'Date, as year-month-day',
    goesBackTo: 'Rates for this pair go back to %{date}.',
    amountOptional: 'Amount (optional)',
    amountIn: 'Amount in %{code}',
    rateFrom: {
      exact: 'Rate from %{date}',
      previousBusinessDay: 'Rate from %{date}, the last business day before',
      latestPublished: 'Rate from %{date}, the latest published',
      earlierSnapshot: 'Rate from %{date}, the closest earlier day',
    },
    sourceEcb: 'ECB reference rate',
    sourceDaily: 'Daily mid-market rate',
    share: 'Share',
    shareMessage: '%{rate} on %{date} (%{source})',
    shareMessageAmount: '%{amount} at %{rate} on %{date} (%{source})',
    noData: 'No rate was published for this pair on that date.',
    loadFailed: 'Couldn’t load the rate. Check your connection.',
  },
  trips: {
    newTrip: 'New trip',
    emptyTitle: 'Track a trip’s spending',
    emptyBody:
      'Set a budget, log what you spend in the local currency and see the total at home, card fees included.',
    planTrip: 'Plan a trip',
    addExpense: 'Add expense',
    recent: 'Recent',
    seeAll: 'See all expenses',
    otherTrips: 'Other trips',
    upcoming: 'Upcoming',
  },
  tripCard: {
    dayOf: 'Day %{day} of %{count}',
    startsIn: {
      one: 'Starts in %{count} day',
      other: 'Starts in %{count} days',
    },
    finished: 'Finished',
    atHome: '≈ %{amount} at home',
    atHomeWithFee: '≈ %{amount} at home, card payments incl. %{fee}% fee',
    budgetUsed: '%{percent}% of %{budget}',
    // context: budget overspent by this amount; keep short
    over: '%{amount} over',
    perDayLeft: '%{amount}/day left',
    left: '%{amount} left',
    details: '%{name} trip details',
  },
  tripNew: {
    title: 'New trip',
    whereTo: 'Where to?',
    namePlaceholder: 'e.g. Lisbon',
    nameLabel: 'Trip name',
    localCurrency: 'Local currency',
    // context: chip that opens the full currency list
    other: 'Other',
    dates: 'Dates',
    // context: start-date chips; keep to about 14 characters
    startsToday: 'Starts today',
    tomorrow: 'Tomorrow',
    inAWeek: 'In a week',
    days: {
      one: '%{count} day',
      other: '%{count} days',
    },
    fewerDays: 'Fewer days',
    moreDays: 'More days',
    budgetIn: 'Budget in %{code} (optional)',
    budgetPlaceholder: 'e.g. 1200',
    budgetLabel: 'Budget',
    budgetError: 'Budget must be a number greater than 0, or left empty.',
    create: 'Create trip',
  },
  expense: {
    title: 'Add expense',
    titleWithTrip: 'Add expense · %{trip}',
    approx: '≈ %{amount}',
    approxWithFee: '≈ %{amount} incl. %{fee}% card fee',
    noRate: 'No rate available',
    whatPlaceholder: 'What was it? (optional)',
    whatLabel: 'Expense title',
    save: 'Save expense',
    longPressToDelete: 'Long press to delete',
    categories: {
      // context: category chips; keep to about 12 characters
      food: 'Food',
      transport: 'Transport',
      stay: 'Stay',
      shopping: 'Shopping',
      activity: 'Activities',
      other: 'Other',
    },
    methods: {
      // context: payment method segment; keep to about 10 characters
      card: 'Card',
      cash: 'Cash',
    },
  },
  trip: {
    title: 'Trip',
    missing: 'This trip no longer exists.',
    today: 'Today',
    yesterday: 'Yesterday',
    exportFailed: 'Couldn’t export this trip',
    noExpenses: 'No expenses yet.',
    // context: %{title} is the expense name, or untitledExpense when it has none
    deleteExpense: 'Delete “%{title}”?',
    untitledExpense: 'expense',
    longPressHint: 'Long press an expense to delete it.',
    exportHint: 'Shares a spreadsheet of this trip’s expenses',
    exportCsv: 'Export CSV',
    deleteTripConfirm: 'Delete %{name} and all its expenses?',
    deleteTrip: 'Delete trip',
  },
  picker: {
    home: 'Home currency',
    trip: 'Trip currency',
    add: 'Add currency',
    searchPlaceholder: 'Search by name or code',
    searchLabel: 'Search currencies',
    noMatches: 'No matching currencies',
    notDownloaded: 'Rates haven’t downloaded yet',
  },
  language: {
    title: 'Language',
    system: 'System default',
  },
  onboarding: {
    // context: three-line headline in a large serif font; keep each line short
    headline1: 'Every currency.',
    headline2: 'One tap.',
    headline3: 'Even offline.',
    homeCurrency: 'Home currency',
    detected: 'Detected from your region',
    changeHome: 'Change home currency',
    // context: small pill button; keep to about 8 characters
    change: 'Change',
    whereHeaded: 'Where are you headed?',
    addLater: 'You can add any of 300+ currencies later.',
    continue: 'Continue',
    footer: 'No account needed. Works offline after first launch.',
  },
  settings: {
    proUnlocked: 'Everything is unlocked',
    proActive: 'You have Trippence Pro',
    proTitle: 'Trippence Pro',
    proBodyFree: 'Every feature is free while Trippence is new. Enjoy!',
    proBodyActive: 'Every Pro feature is unlocked. Thanks for your support!',
    proBodyWidgets: 'Widgets, trips, past rates, export and unlimited alerts.',
    proBody: 'Trips, past rates, export and unlimited alerts.',
    manageSubscription: 'Manage subscription',
    seePlans: 'See Pro plans',
    money: 'Money',
    app: 'App',
    homeCurrency: 'Home currency',
    // context: "Real cost" is the feature name (amounts with the card fee added)
    cardFee: 'Card fee for Real cost',
    decreaseFee: 'Decrease card fee',
    increaseFee: 'Increase card fee',
    rateType: 'Rate type',
    rateTypes: {
      // context: two-option segment; keep each to about 14 characters
      midMarket: 'Mid-market',
      withCardFee: 'With card fee',
    },
    offlineRates: 'Offline rates',
    // context: e.g. "342 saved · 14:05" (number of currencies stored offline, then the time)
    savedAt: {
      one: '%{count} saved · %{time}',
      other: '%{count} saved · %{time}',
    },
    notDownloaded: 'Not downloaded yet',
    widgets: 'Widgets',
    widget: 'Home-screen widget',
    // context: short value at the end of the row; keep to about 6 characters
    add: 'Add',
    addWidgetTitle: 'Add a widget',
    addWidgetIos:
      'Touch and hold your Home Screen, tap Edit › Add Widget, then search for Trippence.\n\nLock Screen widgets: touch and hold the Lock Screen › Customize.',
    addWidgetAndroidTitle: 'Add the widget',
    addWidgetAndroid: 'Touch and hold an empty spot on your home screen, tap Widgets, then find Trippence.',
    appearance: 'Appearance',
    appearances: {
      // context: three-option segment; keep each to about 8 characters
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    language: 'Language',
    // context: %{language} is the detected language's own name, e.g. "System (Deutsch)"
    languageSystem: 'System (%{language})',
    privacy: 'No account. No ads. No tracking.',
  },
  paywall: {
    reasons: {
      alerts: {
        one: 'Free includes %{count} active alert.',
        other: 'Free includes %{count} active alerts.',
      },
      trips: {
        one: 'Free includes %{count} trip.',
        other: 'Free includes %{count} trips.',
      },
      history: 'Rates on past dates are part of Pro.',
      export: 'CSV export is part of Pro.',
      scan: 'Receipt scanning is part of Pro.',
      widgets: 'Widgets are part of Pro.',
    },
    tagline: 'For people who spend money in more than one currency.',
    benefits: {
      widgetAndroid: 'Home-screen rates widget',
      widgetsIos: 'Home & lock-screen widgets',
      trips: 'Unlimited trips with budgets',
      pastRates: 'Rates on any past date + CSV export',
      alerts: 'Unlimited rate alerts',
    },
    plans: {
      yearly: 'Yearly',
      monthly: 'Monthly',
      lifetime: 'Lifetime',
      // context: price per month, e.g. "$1.25/mo"
      perMonth: '%{price}/mo',
      billedYearly: 'Billed yearly',
      billedMonthly: 'Billed monthly',
      payOnce: 'Pay once, keep forever',
    },
    freeTrial: {
      day: {
        one: '%{count}-day free trial',
        other: '%{count}-day free trial',
      },
      month: {
        one: '%{count}-month free trial',
        other: '%{count}-month free trial',
      },
      year: {
        one: '%{count}-year free trial',
        other: '%{count}-year free trial',
      },
    },
    startTrial: {
      day: {
        one: 'Start %{count}-day free trial',
        other: 'Start %{count}-day free trial',
      },
      month: {
        one: 'Start %{count}-month free trial',
        other: 'Start %{count}-month free trial',
      },
      year: {
        one: 'Start %{count}-year free trial',
        other: 'Start %{count}-year free trial',
      },
    },
    pricePer: {
      day: {
        one: '%{price}/day',
        other: '%{price} every %{count} days',
      },
      week: {
        one: '%{price}/week',
        other: '%{price} every %{count} weeks',
      },
      month: {
        one: '%{price}/month',
        other: '%{price} every %{count} months',
      },
      year: {
        one: '%{price}/year',
        other: '%{price} every %{count} years',
      },
    },
    subscribe: 'Subscribe',
    buyLifetime: 'Buy lifetime',
    lifetimeFine: 'One-time purchase. No subscription.',
    // context: %{price} is the renewal price, e.g. "$14.99/year"
    trialFine: 'Then %{price}. Cancel anytime.',
    renewFine: 'Renews automatically until cancelled. Cancel anytime in your store account settings.',
    loadFailed: 'Couldn’t load plans. Check your connection and try again.',
    purchaseFailed: 'The purchase didn’t go through. You haven’t been charged.',
    restored: 'Pro restored.',
    nothingToRestore: 'No earlier Pro purchase found for this account.',
    restoreFailed: 'Couldn’t restore purchases. Try again later.',
    freeNowTitle: 'Everything is free right now',
    freeNowBody: 'Every feature is unlocked while Trippence is new. There is nothing to buy.',
    thanks: 'You have Trippence Pro. Thank you!',
    unavailableTitle: 'Plans aren’t available right now',
    unavailableBody: 'Check your connection and try again in a moment.',
    // context: small pill on the yearly plan; keep to about 12 characters
    bestValue: 'Best value',
    restore: 'Restore purchase',
    terms: 'Terms',
    privacy: 'Privacy',
  },
  widget: {
    // context: Android home-screen widget; space is tight, keep each to about 32 characters
    lockedTitle: 'Live rates on your home screen',
    lockedCta: 'Tap to unlock with Pro',
    // context: top-right corner of the widget, e.g. "Updated 14:05"; keep to about 16 characters
    updated: 'Updated %{time}',
    openToLoad: 'Open to load rates',
  },
  errors: {
    sharingUnavailable: 'Sharing isn’t available on this device.',
    pleaseTryAgain: 'Please try again.',
    rateNotPositive: 'Enter a rate greater than 0.',
    rateNotAbove: 'Pick a rate above the current one.',
    rateNotBelow: 'Pick a rate below the current one.',
  },
  csv: {
    // context: spreadsheet column headers
    date: 'Date',
    time: 'Time',
    title: 'Title',
    category: 'Category',
    payment: 'Payment',
    amount: 'Amount',
    currency: 'Currency',
    amountHome: 'Amount (home)',
    homeCurrency: 'Home currency',
    total: 'Total',
    rate: 'Rate',
    pair: 'Pair',
  },
} as const;
