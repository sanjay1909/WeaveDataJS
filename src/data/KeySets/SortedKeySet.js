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
    Object.defineProperty(SortedKeySet, 'NS', {
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
    Object.defineProperty(SortedKeySet, 'CLASS_NAME', {
        value: 'SortedKeySet'
    });


    /**
     * Generates a function like <code>function(keys)</code> that returns a sorted copy of an Array of keys.
     * Note that the resulting sort function depends on WeaveAPI.StatisticsManager, so the sort function should be called
     * again when statistics change for any of the columns you provide.
     * @param columns An Array of IAttributeColumns or Functions mapping IQualifiedKeys to Numbers.
     * @param sortDirections Sort directions (-1, 0, 1)
     * @return A function that returns a sorted copy of an Array of keys.
     */
    SortedKeySet.generateSortCopyFunction = function (columns, sortDirections) {
        sortDirections = (sortDirections === undefined) ? null : sortDirections;
        return function (keys) {
            var params = [];
            var directions = [];
            var lastDirection = 1;
            for (var i = 0; i < columns.length; i++) {
                var param = columns[i];
                if (WeaveAPI.SessionManager.objectWasDisposed(param))
                    continue;
                if (weavecore.ClassUtils.is(param, weavedata.IAttributeColumn)) {
                    var stats = WeaveAPI.StatisticsCache.getColumnStatistics(param);
                    param = stats.hack_getNumericData();
                }
                if (!param || param instanceof weavedata.IKeySet)
                    continue;
                if (sortDirections && !sortDirections[i])
                    continue;
                lastDirection = (sortDirections ? sortDirections[i] : 1)
                params.push(param);
                directions.push(lastDirection);
            }
            var qkm = WeaveAPI.QKeyManager;
            params.push(qkm.keyTypeLookup, qkm.localNameLookup);
            directions.push(lastDirection, lastDirection);

            //var t = getTimer();
            var result = weavecore.StandardLib.sortOn(keys, params, directions, false);
            //trace('sorted',keys.length,'keys in',getTimer()-t,'ms',DebugUtils.getCompactStackTrace(new Error()));
            return result;
        };
    }

    //
    SortedKeySet._EMPTY_ARRAY = []


    /**
     * This provides the keys from an existing IKeySet in a sorted order.
     * Callbacks will trigger when the sorted result changes.
     */
    function SortedKeySet(keySet, sortCopyFunction, dependencies) {
        sortCopyFunction = (sortCopyFunction === undefined) ? null : sortCopyFunction;
        dependencies = (dependencies === undefined) ? null : dependencies;
        weavedata.IKeySet.call(this);

        this._triggerCounter = 0;
        this._dependencies = WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.CallbackCollection());
        this._keySet;
        this._sortCopyFunction = WeaveAPI.QKeyManager.keySortCopy;
        this._sortedKeys = [];


        this._keySet = keySet;
        this._sortCopyFunction = (sortCopyFunction) ? sortCopyFunction : QKeyManager.keySortCopy;

        dependencies.forEach(function (object) {
            WeaveAPI.SessionManager.registerLinkableChild(this, this._dependencies, object);
            if (object instanceof weavedata.IAttributeColumn) {
                var stats = WeaveAPI.StatisticsCache.getColumnStatistics(object);
                WeaveAPI.SessionManager.registerLinkableChild(this, this._dependencies, stats);
            }
        }.bind(this));
        WeaveAPI.SessionManager.registerLinkableChild(this, this._dependencies, this._keySet);
        /**
         * This is the list of keys from the IKeySet, sorted.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                if (this._triggerCounter !== this._dependencies.triggerCounter)
                    _validate.call(this);
                return this._sortedKeys;
            }
        })

    }



    function _validate() {
        this._triggerCounter = this._dependencies.triggerCounter;
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this))
            return;

        WeaveAPI.StageUtils.startTask(this, _asyncTask.bind(this), WeaveAPI.TASK_PRIORITY_NORMAL, _asyncComplete.bind(this));
    }




    function _asyncTask() {
        // first try sorting an empty array to trigger any column statistics requests
        this._sortCopyFunction(SortedKeySet._EMPTY_ARRAY);

        // stop if any async tasks were started
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this._dependencies))
            return 1;

        // sort the keys
        this._sortedKeys = this._sortCopyFunction(this._keySet.keys);

        return 1;
    }


    function _asyncComplete() {
        if (WeaveAPI.SessionManager.linkableObjectIsBusy(this._dependencies) || this._triggerCounter != this._dependencies.triggerCounter)
            return;

        WeaveAPI.SessionManager.getCallbackCollection(this).triggerCallbacks();
    }

    SortedKeySet.prototype = new weavedata.IKeySet();
    SortedKeySet.prototype.constructor = SortedKeySet;
    var p = SortedKeySet.prototype;

    /**
     * @inheritDoc
     */
    p.containsKey = function (key) {
        return this._keySet.containsKey(key);
    }

    if (typeof exports !== 'undefined') {
        module.exports = SortedKeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.SortedKeySet = SortedKeySet;
    }

    weavecore.ClassUtils.registerClass('weavedata.SortedKeySet', weavedata.SortedKeySet);

}());
