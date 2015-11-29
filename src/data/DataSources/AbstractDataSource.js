/**
 * This is a base class to make it easier to develope a new class that implements IDataSource.
 * Classes that extend AbstractDataSource should implement the following methods:
 * getHierarchyRoot, generateHierarchyNode, requestColumnFromSource
 *
 * @author adufilie
 * @author asanjay
 */

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
    Object.defineProperty(AbstractDataSource, 'NS', {
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
    Object.defineProperty(AbstractDataSource, 'CLASS_NAME', {
        value: 'AbstractDataSource'
    });

    function AbstractDataSource() {
        weavedata.IDataSource.call(this);
        /*
         *
         * This variable is set to false when the session state changes and true when initialize() is called.*/
        this._initializeCalled = false;

        /**
         * This should be used to keep a pointer to the hierarchy root node.
         */
        this._rootNode;

        /**
         * ProxyColumn -> (true if pending, false if not pending)
         */
        this._proxyColumns = new Map();

        Object.defineProperty(this, "_hierarchyRefresh", {
            value: WeaveAPI.SessionManager.registerLinkableChild(this, new weavecore.CallbackCollection(), this.refreshHierarchy.bind(this))
        });

        Object.defineProperty(this, "hierarchyRefresh", {
            get: function () {
                return this._hierarchyRefresh;
            }
        });

        /**
         * Classes that extend AbstractDataSource can define their own replacement for this function.
         * All column requests will be delayed as long as this accessor function returns false.
         * The default behavior is to return false during the time between a change in the session state and when initialize() is called.
         */
        Object.defineProperty(this, "initializationComplete", {
            get: this._getinitializationComplete,
            configurable: true
        });

        var cc = WeaveAPI.SessionManager.getCallbackCollection(this);
        cc.addImmediateCallback(this, this.uninitialize.bind(this));
        cc.addGroupedCallback(this, this.initialize.bind(this), true);


    }




    AbstractDataSource.prototype = new weavedata.IDataSource();
    AbstractDataSource.prototype.constructor = AbstractDataSource;

    var p = AbstractDataSource.prototype;

    p._getinitializationComplete = function () {
        return this._initializeCalled;
    }

    /**
     * Sets _rootNode to null and triggers callbacks.
     * @inheritDoc
     */
    p.refreshHierarchy = function () {
        this._rootNode = null;
    }

    /**
     * This function must be implemented by classes that extend AbstractDataSource.
     * This function should set _rootNode if it is null, which may happen from calling refreshHierarchy().
     * @inheritDoc
     */
    p.getHierarchyRoot = function () {
        return this._rootNode;
    }

    /**
     * This function must be implemented by classes that extend AbstractDataSource.
     * This function should make a request to the source to fill in the proxy column.
     * @param proxyColumn Contains metadata for the column request and will be used to store column data when it is ready.
     */
    p.requestColumnFromSource = function (proxyColumn) {

    }

    /**
     * This function must be implemented by classes that extend AbstractDataSource.
     * @param metadata A set of metadata that may identify a column in this IDataSource.
     * @return A node that contains the metadata.
     */
    p.generateHierarchyNode = function (metadata) {
        return null;
    }

    /**
     * This function is called as an immediate callback and sets initialized to false.
     */
    p.uninitialize = function () {
        this._initializeCalled = false;
    }

    /**
     * This function will be called as a grouped callback the frame after the session state for the data source changes.
     * When overriding this function, super.initialize() should be called.
     */
    p.initialize = function (forceRefresh) {
        forceRefresh = (forceRefresh === undefined) ? false : forceRefresh;
        // set initialized to true so other parts of the code know if this function has been called.
        this._initializeCalled = true;
        if (forceRefresh) {
            this.refreshAllProxyColumns.call(this, this.initializationComplete);
        }

        this.handleAllPendingColumnRequests.call(this, this.initializationComplete);
    }

    /**
     * The default implementation of this function calls generateHierarchyNode(metadata) and
     * then traverses the _rootNode to find a matching node.
     * This function should be overridden if the hierachy is not known completely, since this
     * may result in traversing the entire hierarchy, causing many remote procedure calls if
     * the hierarchy is stored remotely.
     * @inheritDoc
     */
    p.findHierarchyNode = function (metadata) {
        var path = weavedata.HierarchyUtils.findPathToNode(this.getHierarchyRoot(), this.generateHierarchyNode(metadata));
        if (path)
            return path[path.length - 1];
        return null;
    }

    /**
     * This function creates a new ProxyColumn object corresponding to the metadata and queues up the request for the column.
     * @param metadata An object that contains all the information required to request the column from this IDataSource.
     * @return A ProxyColumn object that will be updated when the column data is ready.
     */
    p.getAttributeColumn = function (metadata) {
        var proxyColumn = WeaveAPI.SessionManager.registerDisposableChild(this, new weavedata.ProxyColumn());
        proxyColumn.setMetadata(metadata);
        var description = (WeaveAPI.globalHashMap.getName(this) || WeaveAPI.debugID(this)) + " pending column request";
        WeaveAPI.ProgressIndicator.addTask(proxyColumn, this, description);
        WeaveAPI.ProgressIndicator.addTask(proxyColumn, proxyColumn, description);
        this.handlePendingColumnRequest.call(this, proxyColumn);
        return proxyColumn;
    }


    /**
     * This function will call requestColumnFromSource() if initializationComplete==true.
     * Otherwise, it will delay the column request again.
     * This function may be overridden by classes that extend AbstractDataSource.
     * However, if the extending class decides it wants to call requestColumnFromSource()
     * for the pending column, it is recommended to call super.handlePendingColumnRequest() instead.
     * @param request The request that needs to be handled.
     */
    p.handlePendingColumnRequest = function (column, forced) {
        // If data source is already initialized (session state is stable, not currently changing), we can request the column now.
        // Otherwise, we have to wait.
        if (this.initializationComplete || forced) {
            this._proxyColumns.set(column, false); // no longer pending
            WeaveAPI.ProgressIndicator.removeTask(column);
            this.requestColumnFromSource.call(this, column);
        } else {
            this._proxyColumns.set(column, true); // pending
        }
    }

    /**
     * This function will call handlePendingColumnRequest() on each pending column request.
     */
    p.handleAllPendingColumnRequests = function (forced) {
        forced = (forced === undefined) ? false : forced;
        for (var proxyColumn of this._proxyColumns.keys()) {
            if (this._proxyColumns.get(proxyColumn)) // pending?
                this.handlePendingColumnRequest.call(this, proxyColumn, forced);
        }


    }

    /**
     * Calls requestColumnFromSource() on all ProxyColumn objects created previously via getAttributeColumn().
     */
    p.refreshAllProxyColumns = function (forced) {
        forced = (forced === undefined) ? false : forced;
        for (var proxyColumn of this._proxyColumns.keys())
            this.handlePendingColumnRequest.call(this, proxyColumn, forced);

    }

    /**
     * This function should be called when the IDataSource is no longer in use.
     * All existing pointers to objects should be set to null so they can be garbage collected.
     */
    p.dispose = function () {
        for (var column of this._proxyColumns.keys())
            WeaveAPI.ProgressIndicator.removeTask(column);

        this._initializeCalled = false;
        this._proxyColumns = null;
    }

    if (typeof exports !== 'undefined') {
        module.exports = AbstractDataSource;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.AbstractDataSource = AbstractDataSource;
    }

    weavecore.ClassUtils.registerClass('weavedata.AbstractDataSource', weavedata.AbstractDataSource);

}());
