angular.module('myApp').controller("converterController", function ($scope, $q, apiService) {

    var STALE_MS = 120 * 1000;
    var cachedUsdRates = null;
    var ratesFetchedAt = 0;
    var refreshPromise = null;

    $scope.Currobject = {
        fromCurrency: 1,
        toCurrency: 0
    };
    $scope.currencies = [];
    $scope.listLoading = true;
    $scope.listError = null;
    $scope.refreshingRates = false;
    $scope.ratesDateLabel = "";
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

    function applyLocalConvert(amount, from, to) {
        if (from === to) {
            $scope.Currobject.toCurrency = amount;
            return;
        }
        if (!cachedUsdRates) {
            $scope.Currobject.toCurrency = 0;
            return;
        }
        var uf = cachedUsdRates[from];
        var ut = cachedUsdRates[to];
        if (typeof uf !== "number" || typeof ut !== "number" || uf === 0) {
            $scope.Currobject.toCurrency = 0;
            return;
        }
        $scope.Currobject.toCurrency = amount * (ut / uf);
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
            }
        }).catch(function (err) {
            console.log(err);
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
            });
            return;
        }

        applyLocalConvert(amount, from, to);
    };

    loadCurrencies();
});
