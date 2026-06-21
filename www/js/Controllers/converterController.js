angular.module('myApp').controller("converterController", function ($scope, $q, apiService, localStorageService) {

    var STALE_MS = 120 * 1000;
    var storedRates = localStorageService.getCachedUsdRates();
    var cachedUsdRates = storedRates && storedRates.rates ? storedRates.rates : null;
    var ratesFetchedAt = storedRates && storedRates.fetchedAt ? storedRates.fetchedAt : 0;
    var refreshPromise = null;

    $scope.Currobject = {
        fromCurrency: 1,
        toCurrency: 0
    };
    $scope.currencies = [];
    $scope.listLoading = true;
    $scope.listError = null;
    $scope.refreshingRates = false;
    $scope.ratesDateLabel = storedRates && storedRates.date ? storedRates.date + " (cached)" : "";
    $scope.conversionHistory = localStorageService.getConverterHistory();
    $scope.favoritePairs = localStorageService.getFavoritePairs();
    $scope.rateAlerts = [];
    $scope.alertTargetRate = "";
    $scope.quickAmounts = [10, 50, 100, 1000];
    $scope.comparisonCurrencies = localStorageService.getComparisonCurrencies();
    $scope.selectedComparisonCurrency = "";
    $scope.currencyPicker = {
        open: null,
        query: {
            from: "",
            to: ""
        }
    };

    function isRatesStale() {
        return !ratesFetchedAt || !cachedUsdRates || (Date.now() - ratesFetchedAt > STALE_MS);
    }

    function calculateLocalConvert(amount, from, to) {
        if (from === to) {
            return amount;
        }
        if (!cachedUsdRates) {
            return 0;
        }
        var uf = cachedUsdRates[from];
        var ut = cachedUsdRates[to];
        if (typeof uf !== "number" || typeof ut !== "number" || uf === 0) {
            return 0;
        }
        return amount * (ut / uf);
    }

    function applyLocalConvert(amount, from, to) {
        $scope.Currobject.toCurrency = calculateLocalConvert(amount, from, to);
    }

    function ensureUsdRates(forceRefresh) {
        if (!forceRefresh && cachedUsdRates && !isRatesStale()) {
            return $q.resolve();
        }
        if (refreshPromise) {
            return refreshPromise;
        }
        $scope.refreshingRates = true;
        var promise = apiService.getUsdRates().then(function (response) {
            var data = response.data;
            if (data && data.usd && typeof data.usd === "object") {
                cachedUsdRates = data.usd;
                ratesFetchedAt = Date.now();
                $scope.ratesDateLabel = data.date || "";
                localStorageService.setCachedUsdRates({
                    rates: cachedUsdRates,
                    fetchedAt: ratesFetchedAt,
                    date: data.date || ""
                });
            }
        }).catch(function (err) {
            console.log(err);
            var fallbackRates = localStorageService.getCachedUsdRates();
            if (fallbackRates && fallbackRates.rates) {
                cachedUsdRates = fallbackRates.rates;
                ratesFetchedAt = fallbackRates.fetchedAt || Date.now();
                $scope.ratesDateLabel = (fallbackRates.date || "Last saved") + " (cached)";
            }
        }).finally(function () {
            $scope.refreshingRates = false;
            if (refreshPromise === promise) {
                refreshPromise = null;
            }
        });
        refreshPromise = promise;
        return promise;
    }

    function buildCurrencyOptions(meta) {
        return Object.keys(meta).map(function (code) {
            var label = meta[code];
            if (!label || !String(label).trim()) {
                label = code.toUpperCase();
            }
            return {
                code: code.toLowerCase(),
                name: label + " (" + code.toUpperCase() + ")"
            };
        }).sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
    }

    function pickDefault(currencies, code) {
        var lower = code.toLowerCase();
        for (var i = 0; i < currencies.length; i++) {
            if (currencies[i].code === lower) {
                return currencies[i];
            }
        }
        return null;
    }

    function findCurrency(code) {
        return pickDefault($scope.currencies, code || "");
    }

    function pairKey(from, to) {
        return (from || "").toLowerCase() + ":" + (to || "").toLowerCase();
    }

    function persistHistory(item) {
        if (!item.fromCode || !item.toCode || !item.amount || !item.result) {
            return;
        }
        var history = localStorageService.getConverterHistory().filter(function (entry) {
            return !(entry.fromCode === item.fromCode && entry.toCode === item.toCode && entry.amount === item.amount);
        });
        history.unshift(item);
        history = history.slice(0, 8);
        localStorageService.setConverterHistory(history);
        $scope.conversionHistory = history;
    }

    function saveCurrentConversion(amount, from, to) {
        if (!from || !to || isNaN(amount) || !$scope.Currobject.toCurrency) {
            return;
        }
        persistHistory({
            amount: amount,
            result: $scope.Currobject.toCurrency,
            fromCode: from,
            toCode: to,
            createdAt: Date.now()
        });
    }

    function getCurrentRate() {
        var amount = parseFloat($scope.Currobject.fromCurrency);
        var result = parseFloat($scope.Currobject.toCurrency);
        if (!amount || isNaN(amount) || isNaN(result)) {
            return 0;
        }
        return result / amount;
    }

    function refreshRateAlerts() {
        var alerts = localStorageService.getRateAlerts().filter(function (alert) {
            return alert.type !== "crypto";
        });
        alerts.forEach(function (alert) {
            var currentRate = 0;
            if ($scope.Currobject.selectedFromCurr
                && $scope.Currobject.selectedToCurr
                && alert.fromCode === $scope.Currobject.selectedFromCurr.code
                && alert.toCode === $scope.Currobject.selectedToCurr.code) {
                currentRate = getCurrentRate();
            }
            alert.currentRate = currentRate;
            alert.isReached = currentRate > 0 && currentRate >= alert.targetRate;
        });
        $scope.rateAlerts = alerts;
    }

    async function loadCurrencies() {
        $scope.listLoading = true;
        $scope.listError = null;
        try {
            var resp = await apiService.getCurrencyCodesAndNames();
            $scope.currencies = buildCurrencyOptions(resp.data);
            $scope.Currobject.selectedFromCurr = pickDefault($scope.currencies, "usd") || $scope.currencies[0];
            $scope.Currobject.selectedToCurr = pickDefault($scope.currencies, "pkr")
                || pickDefault($scope.currencies, "eur")
                || ($scope.currencies[1] || $scope.currencies[0]);
            await ensureUsdRates(true);
        } catch (err) {
            console.log(err);
            $scope.listError = "Could not load currency list.";
            var fallback = (allcurrencies || []).map(function (c) {
                var code = (c.coinId || c.id || c.symbol || "").toString().toLowerCase();
                return {
                    code: code,
                    name: c.name + " (" + code.toUpperCase() + ")"
                };
            });
            $scope.currencies = fallback;
            $scope.Currobject.selectedFromCurr = $scope.currencies[0];
            $scope.Currobject.selectedToCurr = $scope.currencies[1] || $scope.currencies[0];
            await ensureUsdRates(true);
        } finally {
            $scope.listLoading = false;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            $scope.convert();
        }
    }

    $scope.getAllSupportedCurrencies = async function () {
        await loadCurrencies();
    };

    $scope.refreshRates = function () {
        ensureUsdRates(true).then(function () {
            $scope.convert();
        });
    };

    $scope.swapCurrencies = function () {
        var from = $scope.Currobject.selectedFromCurr;
        var to = $scope.Currobject.selectedToCurr;
        if (!from || !to || $scope.listLoading) {
            return;
        }
        $scope.currencyPicker.open = null;
        $scope.Currobject.selectedFromCurr = to;
        $scope.Currobject.selectedToCurr = from;
        $scope.convert();
    };

    $scope.toggleCurrencyPicker = function (side) {
        if ($scope.listLoading) {
            return;
        }
        $scope.currencyPicker.open = $scope.currencyPicker.open === side ? null : side;
        $scope.currencyPicker.query[side] = "";
    };

    $scope.filteredCurrencies = function (side) {
        var query = ($scope.currencyPicker.query[side] || "").toLowerCase().trim();
        if (!query) {
            return $scope.currencies;
        }
        return $scope.currencies.filter(function (curr) {
            return curr.code.indexOf(query) !== -1 || curr.name.toLowerCase().indexOf(query) !== -1;
        });
    };

    $scope.selectCurrency = function (side, curr) {
        if (!curr) {
            return;
        }
        if (side === "from") {
            $scope.Currobject.selectedFromCurr = curr;
        } else {
            $scope.Currobject.selectedToCurr = curr;
        }
        $scope.currencyPicker.open = null;
        $scope.currencyPicker.query[side] = "";
        $scope.convert();
    };

    $scope.isCurrentPairFavorite = function () {
        var from = $scope.Currobject.selectedFromCurr && $scope.Currobject.selectedFromCurr.code;
        var to = $scope.Currobject.selectedToCurr && $scope.Currobject.selectedToCurr.code;
        if (!from || !to) {
            return false;
        }
        var key = pairKey(from, to);
        return $scope.favoritePairs.some(function (pair) {
            return pair.key === key;
        });
    };

    $scope.toggleFavoritePair = function () {
        var from = $scope.Currobject.selectedFromCurr;
        var to = $scope.Currobject.selectedToCurr;
        if (!from || !to) {
            return;
        }
        var key = pairKey(from.code, to.code);
        var pairs = localStorageService.getFavoritePairs();
        if (pairs.some(function (pair) { return pair.key === key; })) {
            pairs = pairs.filter(function (pair) { return pair.key !== key; });
        } else {
            pairs.unshift({
                key: key,
                fromCode: from.code,
                fromName: from.name,
                toCode: to.code,
                toName: to.name
            });
        }
        pairs = pairs.slice(0, 10);
        localStorageService.setFavoritePairs(pairs);
        $scope.favoritePairs = pairs;
    };

    $scope.applyFavoritePair = function (pair) {
        var from = findCurrency(pair.fromCode);
        var to = findCurrency(pair.toCode);
        if (!from || !to) {
            return;
        }
        $scope.Currobject.selectedFromCurr = from;
        $scope.Currobject.selectedToCurr = to;
        $scope.convert();
    };

    $scope.applyHistoryItem = function (item) {
        var from = findCurrency(item.fromCode);
        var to = findCurrency(item.toCode);
        if (!from || !to) {
            return;
        }
        $scope.Currobject.selectedFromCurr = from;
        $scope.Currobject.selectedToCurr = to;
        $scope.Currobject.fromCurrency = item.amount;
        $scope.convert();
    };

    $scope.clearConversionHistory = function () {
        localStorageService.setConverterHistory([]);
        $scope.conversionHistory = [];
    };

    $scope.setQuickAmount = function (amount) {
        $scope.Currobject.fromCurrency = amount;
        $scope.convert();
    };

    $scope.addComparisonCurrency = function () {
        var code = ($scope.selectedComparisonCurrency || "").toLowerCase();
        if (!code || $scope.comparisonCurrencies.indexOf(code) !== -1) {
            return;
        }
        $scope.comparisonCurrencies.push(code);
        localStorageService.setComparisonCurrencies($scope.comparisonCurrencies);
        $scope.selectedComparisonCurrency = "";
    };

    $scope.removeComparisonCurrency = function (code) {
        $scope.comparisonCurrencies = $scope.comparisonCurrencies.filter(function (item) {
            return item !== code;
        });
        localStorageService.setComparisonCurrencies($scope.comparisonCurrencies);
    };

    $scope.getComparisonRows = function () {
        var from = $scope.Currobject.selectedFromCurr && $scope.Currobject.selectedFromCurr.code;
        var amount = parseFloat($scope.Currobject.fromCurrency);
        if (!from || isNaN(amount)) {
            return [];
        }
        return $scope.comparisonCurrencies.map(function (code) {
            var currency = findCurrency(code);
            return {
                code: code,
                name: currency ? currency.name : code.toUpperCase(),
                value: calculateLocalConvert(amount, from, code)
            };
        });
    };

    $scope.addRateAlert = function () {
        var from = $scope.Currobject.selectedFromCurr;
        var to = $scope.Currobject.selectedToCurr;
        var targetRate = parseFloat($scope.alertTargetRate);
        if (!from || !to || isNaN(targetRate) || targetRate <= 0) {
            return;
        }
        var alerts = localStorageService.getRateAlerts();
        alerts.unshift({
            id: Date.now(),
            type: "fiat",
            fromCode: from.code,
            toCode: to.code,
            targetRate: targetRate,
            createdAt: Date.now()
        });
        alerts = alerts.slice(0, 12);
        localStorageService.setRateAlerts(alerts);
        $scope.alertTargetRate = "";
        refreshRateAlerts();
    };

    $scope.removeRateAlert = function (alertId) {
        var alerts = localStorageService.getRateAlerts().filter(function (alert) {
            return alert.id !== alertId;
        });
        localStorageService.setRateAlerts(alerts);
        refreshRateAlerts();
    };

    $scope.convert = function () {
        var from = $scope.Currobject.selectedFromCurr && $scope.Currobject.selectedFromCurr.code;
        var to = $scope.Currobject.selectedToCurr && $scope.Currobject.selectedToCurr.code;
        var amount = parseFloat($scope.Currobject.fromCurrency);
        if (!from || !to || isNaN(amount)) {
            $scope.Currobject.toCurrency = 0;
            return;
        }

        if (isRatesStale()) {
            ensureUsdRates(false).then(function () {
                var f = $scope.Currobject.selectedFromCurr && $scope.Currobject.selectedFromCurr.code;
                var t = $scope.Currobject.selectedToCurr && $scope.Currobject.selectedToCurr.code;
                var amt = parseFloat($scope.Currobject.fromCurrency);
                if (!f || !t || isNaN(amt)) {
                    $scope.Currobject.toCurrency = 0;
                    return;
                }
                applyLocalConvert(amt, f, t);
                saveCurrentConversion(amt, f, t);
                refreshRateAlerts();
            });
            return;
        }

        applyLocalConvert(amount, from, to);
        saveCurrentConversion(amount, from, to);
        refreshRateAlerts();
    };

    refreshRateAlerts();
    loadCurrencies();
});
