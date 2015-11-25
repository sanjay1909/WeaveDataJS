(function () {

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(FilteredKeySet, 'NS', {
        value: 'weavedata'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(FilteredKeySet, 'CLASS_NAME', {
        value: 'FilteredKeySet'
    });

    FilteredKeySet.debug = false;

    /**
     * A FilteredKeySet has a base set of keys and an optional filter.
     * The resulting set of keys becomes the intersection of the base set with the filter.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function FilteredKeySet() {
        weavecore.CallbackCollection.call(this);
        if (FilteredKeySet.debug)
            this.addImmediateCallback(this, _firstCallback.bind(this));

        this._baseKeySet = null; // stores the base IKeySet


        this._filteredKeys = []; // stores the filtered list of keys
        this._filteredKeyLookup = new Map(); // this maps a key to a value if the key is included in this key set
        this._generatedKeySets;
        this._setColumnKeySources_arguments;
        this._prevTriggerCounter; // used to remember if the this._filteredKeys are valid


        this._i;
        this._asyncInverse;
        this._asyncFilter;
        this._asyncInput;
        this._asyncOutput;
        this._asyncLookup;

        // this stores the IKeyFilter
        Object.defineProperty(this, '_dynamicKeyFilter', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.DynamicKeyFilter())

        });

        /**
         * When this is set to true, the inverse of the filter will be used to filter the keys.
         * This means any keys appearing in the filter will be excluded from this key set.
         */


        Object.defineProperty(this, 'inverseFilter', {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.LinkableBoolean())

        });

        /**
         * @return The interface for setting a filter that is applied to the base key set.
         */

        Object.defineProperty(this, 'keyFilter', {
            get: function () {
                return this._dynamicKeyFilter;
            }

        });


        /**
         * @return The keys in this IKeySet.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                if (this._prevTriggerCounter !== this.triggerCounter)
                    validateFilteredKeys.call(this);
                return this._filteredKeys;
            }

        });


    }


    /**
     * @private
     */
    function validateFilteredKeys() {
        this._prevTriggerCounter = this.triggerCounter; // this prevents the function from being called again before callbacks are triggered again.

        this._asyncFilter = this._dynamicKeyFilter.getInternalKeyFilter();

        if (this._baseKeySet == null) {
            // no keys when base key set is undefined
            this._filteredKeys = [];
            this._filteredKeyLookup = new Map();
            return;
        }
        if (!this._asyncFilter) {
            // use base key set
            this._filteredKeys = this._baseKeySet.keys;
            this._filteredKeyLookup = new Map();
            weavedata.VectorUtils.fillKeys(this._filteredKeyLookup, this._filteredKeys);
            return;
        }

        this._i = 0;
        this._asyncInput = this._baseKeySet.keys;
        this._asyncOutput = [];
        this._asyncLookup = new Map();
        this._asyncInverse = this.inverseFilter.value;

        // high priority because all visualizations depend on key sets
        WeaveAPI.StageUtils.startTask(this, iterate.bind(this), WeaveAPI.TASK_PRIORITY_HIGH, asyncComplete.bind(this), weavecore.StandardLib.substitute('Filtering {0} keys in {1}', this._asyncInput.length, WeaveAPI.debugID(this)));
    }



    function iterate(stopTime) {
        if (this._prevTriggerCounter !== this.triggerCounter)
            return 1;

        for (; this._i < this._asyncInput.length; ++this._i) {
            if (!this._asyncFilter)
                return 1;
            if (getTimer() > stopTime)
                return this._i / this._asyncInput.length;

            var key = (this._asyncInput[this._i] && this._asyncInput[this._i] instanceof weavedata.IQualifiedKey) ? this._asyncInput[this._i] : null;
            var contains = this._asyncFilter.containsKey(key);
            if (contains !== this._asyncInverse) {
                this._asyncOutput.push(key);
                this._asyncLookup.set(key, true);
            }
        }

        return 1;
    }

    function getTimer() {
        return new Date().getTime();
    }

    function asyncComplete() {
        if (this._prevTriggerCounter !== this.triggerCounter) {
            validateFilteredKeys.call(this);
            return;
        }

        this._prevTriggerCounter++;
        this._filteredKeys = this._asyncOutput;
        this._filteredKeyLookup = this._asyncLookup;
        this.triggerCallbacks();
    }

    FilteredKeySet.prototype = new weavecore.CallbackCollection();
    FilteredKeySet.prototype.constructor = FilteredKeySet;

    var p = FilteredKeySet.prototype;

    function _firstCallback() {
        console.log(this, 'trigger', this.keys.length, 'keys');
    }

    p.dispose = function () {
        weavecore.CallbackCollection.prototype.dispose.call(this);
        this.setColumnKeySources(null);
    }

    /**
     * This sets up the FilteredKeySet to get its base set of keys from a list of columns and provide them in sorted order.
     * @param columns An Array of IAttributeColumns to use for comparing IQualifiedKeys.
     * @param sortDirections Array of sort directions corresponding to the columns and given as integers (1=ascending, -1=descending, 0=none).
     * @param keySortCopy A function that returns a sorted copy of an Array of keys. If specified, descendingFlags will be ignored and this function will be used instead.
     * @param keyInclusionLogic Passed to KeySetUnion constructor.
     * @see weave.data.KeySets.SortedKeySet#generateCompareFunction()
     */
    p.setColumnKeySources = function (columns, sortDirections, keySortCopy, keyInclusionLogic) {
        sortDirections = (sortDirections === undefined) ? null : sortDirections;
        keySortCopy = (keySortCopy === undefined) ? null : keySortCopy;
        keyInclusionLogic = (keyInclusionLogic === undefined) ? null : keyInclusionLogic;

        var args = Array.prototype.slice.call(arguments);
        if (weavecore.StandardLib.compare(this._setColumnKeySources_arguments, args) == 0)
            return;

        var keySet;

        // unlink from the old key set
        if (this._generatedKeySets) {
            this._generatedKeySets.forEach(function (keySet) {
                WeaveAPI.SessionManager.disposeObject(keySet);
            });
            this._generatedKeySets = null;
        } else {
            this.setSingleKeySource(null);
        }

        this._setColumnKeySources_arguments = args;

        if (columns) {
            // KeySetUnion should not trigger callbacks
            var union = WeaveAPI.SessionManager.registerDisposableChild(this, new weavedata.KeySetUnion(keyInclusionLogic));
            columns.forEach(function (keySet) {
                union.addKeySetDependency(keySet);
                if (weavecore.ClassUtils.is(keySet, weavedata.IAttributeColumn)) {
                    var stats = WeaveAPI.StatisticsCache.getColumnStatistics(keySet);
                    WeaveAPI.SessionManager.registerLinkableChild(union, stats);
                }
            })

            if (FilteredKeySet.debug && keySortCopy == null)
                console.log(WeaveAPI.debugID(this), 'sort by [', columns, ']');

            var sortCopy = keySortCopy || weavedata.SortedKeySet.generateSortCopyFunction(columns, sortDirections);
            // SortedKeySet should trigger callbacks
            var sorted = WeaveAPI.SessionManager.registerLinkableChild(this, new weavedata.SortedKeySet(union, sortCopy, columns));
            this._generatedKeySets = [union, sorted];

            this._baseKeySet = sorted;
        } else {
            this._baseKeySet = null;
        }

        this.triggerCallbacks();
    }

    /**
     * This function sets the base IKeySet that is being filtered.
     * @param newBaseKeySet A new IKeySet to use as the base for this FilteredKeySet.
     */
    p.setSingleKeySource = function (keySet) {
        if (this._generatedKeySets)
            this.setColumnKeySources(null);

        if (this._baseKeySet === keySet)
            return;

        // unlink from the old key set
        if (this._baseKeySet !== null)
            WeaveAPI.SessionManager.getCallbackCollection(this._baseKeySet).removeCallback(this.triggerCallbacks);

        this._baseKeySet = keySet; // save pointer to new base key set

        // link to new key set
        if (this._baseKeySet !== null)
            WeaveAPI.SessionManager.getCallbackCollection(this._baseKeySet).addImmediateCallback(this, this.triggerCallbacks.bind(this), false, true);

        this.triggerCallbacks();
    }



    /**
     * @param key A key to test.
     * @return true if the key exists in this IKeySet.
     */
    p.containsKey = function (key) {
        if (this._prevTriggerCounter !== this.triggerCounter)
            validateFilteredKeys.call(this);
        return this._filteredKeyLookup.get(key) !== undefined;
    }



    if (typeof exports !== 'undefined') {
        module.exports = FilteredKeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.FilteredKeySet = FilteredKeySet;
    }

    weavecore.ClassUtils.registerClass('weavedata.FilteredKeySet', weavedata.FilteredKeySet);
}());
