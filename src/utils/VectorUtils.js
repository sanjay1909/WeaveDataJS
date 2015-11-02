/**
 * This class contains static functions that manipulate Vectors and Arrays.
 * Functions with * as parameter types support both Vector and Array.
 * Vector.&lt;*&rt; is not used because it causes compiler errors.
 *
 * @author adufilie
 * @author sanjay1909
 */
(function () {

    function VectorUtils() {

    }

    VectorUtils._lookup = new Map();
    VectorUtils._lookupId = 0;

    /**
     * Computes the union of the items in a list of Arrays. Can also be used to get a list of unique items in an Array.
     * @param arrays A list of Arrays.
     * @return The union of all the unique items in the Arrays in the order they appear.
     */
    VectorUtils.union = function () {
        var arrays = arguments;
        var result = [];
        VectorUtils._lookupId++;
        for (var array in arrays) {
            for (var item in array) {
                if (VectorUtils._lookup[item] !== VectorUtils._lookupId) {
                    VectorUtils._lookup[item] = VectorUtils._lookupId;
                    result.push(item);
                }
            }
        }
        return result;
    }


    /**
     * Computes the intersection of the items in a list of two or more Arrays.
     * @param arrays A list of Arrays.
     * @return The intersection of the items appearing in all Arrays, in the order that they appear in the first Array.
     */
    VectorUtils.intersection = function (firtArray, secondArray) {
        var moreArrays = arguments.splice(0, 2);

        moreArrays.unshift(secondArray);

        var result = [];
        var item;
        var lastArray = moreArrays.pop();

        VectorUtils._lookupId++;
        for (item in lastArray)
            VectorUtils._lookup[item] = VectorUtils._lookupId;

        for (var array in moreArrays) {
            for (item in array)
                if (VectorUtils._lookup[item] === VectorUtils._lookupId)
                    VectorUtils._lookup[item] = VectorUtils._lookupId + 1;
            VectorUtils._lookupId++;
        }

        for (item in firstArray)
            if (VectorUtils._lookup[item] === VectorUtils._lookupId)
                result.push(item);

        return result;
    }

    /**
     * This function copies the contents of the source to the destination.
     * Either parameter may be either an Array or a Vector.
     * @param source An Array-like object.
     * @param destination An Array or Vector.
     * @return A pointer to the destination Array (or Vector)
     */
    VectorUtils.copy = function (source, destination) {
            if (destination === undefined) destination = null;
            if (!destination)
                destination = [];
            destination.length = source.length;
            for (var i in source)
                destination[i] = source[i];
            return destination;
        }
        /**
         * Fills a hash map with the keys from an Array.
         */
    VectorUtils.fillKeys = function (output, keys) {
            for (var key in keys)
                output[key] = true;
        }
        /**
         * Gets all keys in a hash map.
         */
    VectorUtils.getKeys = function (hashMap) {
        var keys = [];
        for (var key in hashMap)
            keys.push(key);
        return keys;
    }

    /**
     * If there are any properties of the hashMap, return false; else, return true.
     * @param hashMap The Object to test for emptiness.
     * @return A boolean which is true if the Object is empty, false if it has at least one property.
     */
    VectorUtils.isEmpty = function (hashMap) {
        for (var key in hashMap)
            return false;
        return true;
    }

    /**
     * Efficiently removes duplicate adjacent items in a pre-sorted Array (or Vector).
     * @param vector The sorted Array (or Vector)
     */
    VectorUtils.removeDuplicatesFromSortedArray = function (sorted) {
            var n = sorted.length;
            if (n === 0)
                return;
            var write = 0;
            var prev = sorted[0] === undefined ? null : undefined;
            for (var read = 0; read < n; ++read) {
                var item = sorted[read];
                if (item !== prev)
                    sorted[write++] = prev = item;
            }
            sorted.length = write;
        }
        /**
         * randomizes the order of the elements in the vector in O(n) time by modifying the given array.
         * @param the vector to randomize
         */
    VectorUtils.randomSort = function (vector) {
        var i = vector.length;
        while (i) {
            // randomly choose index j
            var j = Math.floor(Math.random() * i--);
            // swap elements i and j
            var temp = vector[i];
            vector[i] = vector[j];
            vector[j] = temp;
        }
    }

    /**
     * See http://en.wikipedia.org/wiki/Quick_select#Partition-based_general_selection_algorithm
     * @param list An Array or Vector to be re-organized
     * @param firstIndex The index of the first element in the list to partition.
     * @param lastIndex The index of the last element in the list to partition.
     * @param pivotIndex The index of an element to use as a pivot when partitioning.
     * @param compareFunction A function that takes two array elements a,b and returns -1 if a&lt;b, 1 if a&gt;b, or 0 if a==b.
     * @return The index the pivot element was moved to during the execution of the function.
     */
    VectorUtils.partition = function (list, firstIndex, lastIndex, pivotIndex, compareFunction) {
        var temp;
        var pivotValue = list[pivotIndex];
        // Move pivot to end
        temp = list[pivotIndex];
        list[pivotIndex] = list[lastIndex];
        list[lastIndex] = temp;

        var storeIndex = firstIndex;
        for (var i = firstIndex; i < lastIndex; i++) {
            if (compareFunction(list[i], pivotValue) < 0) {
                if (storeIndex != i) {
                    // swap elements at storeIndex and i
                    temp = list[storeIndex];
                    list[storeIndex] = list[i];
                    list[i] = temp;
                }

                storeIndex++;
            }
        }
        if (storeIndex != lastIndex) {
            // Move pivot to its final place
            temp = list[storeIndex];
            list[storeIndex] = list[lastIndex];
            list[lastIndex] = temp;
        }
        // everything to the left of storeIndex is < pivot element
        // everything to the right of storeIndex is >= pivot element
        return storeIndex;
    }

    //testPartition()
    VectorUtils.testPartition = function () {
        var list = [3, 7, 5, 8, 2];
        var pivotIndex = VectorUtils.partition(list, 0, list.length - 1, list.length / 2, weavedata.AsyncSort.primitiveCompare);

        for (var i = 0; i < list.length; i++)
            if (i < pivotIndex != list[i] < list[pivotIndex])
                throw new Error('assertion fail');
    }

    /**
     * See http://en.wikipedia.org/wiki/Quick_select#Partition-based_general_selection_algorithm
     * @param list An Array or Vector to be re-organized.
     * @param compareFunction A function that takes two array elements a,b and returns -1 if a&lt;b, 1 if a&gt;b, or 0 if a==b.
     * @param firstIndex The index of the first element in the list to calculate a median from.
     * @param lastIndex The index of the last element in the list to calculate a median from.
     * @return The index the median element.
     */
    VectorUtils.getMedianIndex = function (list, compareFunction, firstIndex, lastIndex) {
        //set default parameter values
        if (firstIndex === undefined) firstIndex = 0;
        if (lastIndex === undefined) lastIndex = -1;

        var left = firstIndex;
        var right = (lastIndex >= 0) ? (lastIndex) : (list.length - 1);
        if (left >= right)
            return left;
        var medianIndex = (left + right) / 2;
        while (true) {
            var pivotIndex = VectorUtils.partition(list, left, right, (left + right) / 2, compareFunction);
            if (medianIndex === pivotIndex)
                return medianIndex;
            if (medianIndex < pivotIndex)
                right = pivotIndex - 1;
            else
                left = pivotIndex + 1;
        }
        return -1;
    }

    /**
     * Merges two previously-sorted arrays or vectors.
     * @param sortedInputA The first sorted array or vector.
     * @param sortedInputB The second sorted array or vector.
     * @param mergedOutput A vector or array to store the merged arrays or vectors.
     * @param comparator A function that takes two parameters and returns -1 if the first parameter is less than the second, 0 if equal, or 1 if the first is greater than the second.
     */
    VectorUtils.mergeSorted = function (sortedInputA, sortedInputB, mergedOutput, comparator) {
        var indexA = 0;
        var indexB = 0;
        var indexOut = 0;
        var lengthA = sortedInputA.length;
        var lengthB = sortedInputB.length;
        while (indexA < lengthA && indexB < lengthB)
            if (VectorUtils.comparator(sortedInputA[indexA], sortedInputB[indexB]) < 0)
                mergedOutput[indexOut++] = sortedInputA[indexA++];
            else
                mergedOutput[indexOut++] = sortedInputB[indexB++];

        while (indexA < lengthA)
            mergedOutput[indexOut++] = sortedInputA[indexA++];

        while (indexB < lengthB)
            mergedOutput[indexOut++] = sortedInputB[indexB++];

        mergedOutput.length = indexOut;
    }

    /**
     * This will flatten an Array of Arrays into a flat Array.
     * Items will be appended to the destination Array.
     * @param source A multi-dimensional Array to flatten.
     * @param destination An Array or Vector to append items to.  If none specified, a new one will be created.
     * @return The destination Array with all the nested items in the source appended to it.
     */
    VectorUtils.flatten = function (source, destination) {
        if (destination === null || destination === undefined)
            destination = [];
        if (source === null || source === undefined)
            return destination;

        for (var i = 0; i < source.length; i++)
            if (source[i].constructor === Array) // no vector in JS
                flatten(source[i], destination);
            else
                destination.push(source[i]);
        return destination;
    }

    VectorUtils.flattenObject = function (input, output, prefix) {
        if (prefix === undefined) prefix = '';
        if (output === null || output === undefined)
            output = {};
        if (input === null || input === undefined)
            return output;

        for (var key in input)
            if (typeof input[key] === 'object')
                flattenObject(input[key], output, prefix + key + '.');
            else
                output[prefix + key] = input[key];
        return output;
    }

    /**
     * This will take an Array of Arrays of String items and produce a single list of String-joined items.
     * @param arrayOfArrays An Array of Arrays of String items.
     * @param separator The separator String used between joined items.
     * @param includeEmptyItems Set this to true to include empty-strings and undefined items in the nested Arrays.
     * @return An Array of String-joined items in the same order they appear in the nested Arrays.
     */
    VectorUtils.joinItems = function (arrayOfArrays, separator, includeEmptyItems) {
        var maxLength = 0;
        var itemList;
        for (itemList in arrayOfArrays)
            maxLength = Math.max(maxLength, itemList.length);

        var result = [];
        for (var itemIndex = 0; itemIndex < maxLength; itemIndex++) {
            var joinedItem = [];
            for (var listIndex = 0; listIndex < arrayOfArrays.length; listIndex++) {
                itemList = arrayOfArrays[listIndex];
                var item = '';
                if (itemList && itemIndex < itemList.length)
                    item = itemList[itemIndex] || '';
                if (item || includeEmptyItems)
                    joinedItem.push(item);
            }
            result.push(joinedItem.join(separator));
        }
        return result;
    }

    /**
     * Performs a binary search on a sorted array with no duplicate values.
     * @param sortedUniqueValues Array or Vector of Numbers or Strings
     * @param compare A compare function
     * @param exactMatchOnly If true, searches for exact match. If false, searches for insertion point.
     * @return The index of the matching value or insertion point.
     */
    VectorUtils.binarySearch = function (sortedUniqueValues, item, exactMatchOnly, compare) {
        if (compare === undefined) compare = null;
        var i = 0,
            imin = 0,
            imax = sortedUniqueValues.length - 1;
        while (imin <= imax) {
            i = (imin + imax) / 2;
            var a = sortedUniqueValues[i];
            var c = compare != null ? compare(item, a) : (item < a ? -1 : (item > a ? 1 : 0));
            if (c < 0)
                imax = i - 1;
            else if (c > 0)
                imin = ++i; // set i for possible insertion point
            else
                return i;
        }
        return exactMatchOnly ? -1 : i;
    }

    /**
     * Gets an Array of items from an ICollectionView.
     * @param collection The ICollectionView.
     * @param alwaysMakeCopy If set to false and the collection is an ArrayCollection, returns original source Array.
     */
    VectorUtils.getArrayFromCollection = function (collection, alwaysMakeCopy) {
        // set default values for parameters
        if (alwaysMakeCopy === undefined) alwaysMakeCopy = true;
        console.log('array collection not yet supported for weave');
        /*if (!collection || !collection.length)
				return [];

			var array:Array = null;
			if (collection is ArrayCollection && collection.filterFunction == null)
				array = (collection as ArrayCollection).source;
			if (array)
				return alwaysMakeCopy ? array.concat() : array;

			array = [];
			var cursor:IViewCursor = collection.createCursor();
			do
			{
				array.push(cursor.current);
			}
			while (cursor.moveNext());
			return array;*/
    }

    /**
     * Creates an object from arrays of keys and values.
     * @param keys Keys corresponding to the values.
     * @param values Values corresponding to the keys.
     * @return A new Object.
     */
    VectorUtils.zipObject = function (keys, values) {
        var n = Math.min(keys.length, values.length);
        var o = {};
        for (var i = 0; i < n; i++)
            o[keys[i]] = values[i];
        return o;
    }

    /**
     * This will get a subset of properties/items/attributes from an Object/Array/XML.
     * @param object An Object/Array/XML containing properties/items/attributes to retrieve.
     * @param keys A list of property names, index values, or attribute names.
     * @param output Optionally specifies where to store the resulting items.
     * @return An Object (or Array) containing the properties/items/attributes specified by keysOrIndices.
     */
    VectorUtils.getItems = function (object, keys, output) {
        if (output === null || output === undefined)
            output = object.constructor === Array ? [] : {};
        if (!object)
            return output;
        for (var keyIndex in keys) {
            var keyValue = keys[keyIndex];

            var item;
            /*if (object is XML_Class)
					item = String((object as XML_Class).attribute(keyValue));
				else*/
            item = object[keyValue];

            if (output.constructor === Array)
                output[keyIndex] = item;
            else
                output[keyValue] = item;
        }
        return output;
    }

    /**
     * Removes items from an Array or Vector.
     * @param array Array or Vector
     * @param indices Array of indices to remove
     */
    VectorUtils.removeItems = function (array, indices) {
        var n = array.length;
        /*var skipList:Vector.<int> = Vector.<int>(indices).sort(Array.NUMERIC);
			skipList.push(n);
			VectorUtils.removeDuplicatesFromSortedArray(skipList);

			var iSkip = 0;
			var skip = skipList[0];
			var write = skip;
			for (var read = skip; read < n; ++read)
			{
				if (read === skip)
					skip = skipList[++iSkip];
				else
					array[write++] = array[read];
			}
			array.length = write;*/
        console.log("Sanjay - Need to add alterantive for vector usage");
    }

    VectorUtils._pluckProperty;

    /**
     * Gets a list of values of a property from a list of objects.
     * @param array An Array or Vector of Objects.
     * @param property The property name to get from each object
     * @return A list of the values of the specified property for each object in the original list.
     */
    VectorUtils.pluck = function (array, property) {
        _pluckProperty = property;
        return array.map(_pluck);
    }


    VectorUtils._pluck = function (item, i, a) {
        return item[_pluckProperty];
    }

    /**
     * Creates a lookup from item (or item property) to index. Does not consider duplicate items (or item property values).
     * @param propertyChain A property name or chain of property names to index on rather than the item itself.
     * @return A reverse lookup.
     */
    VectorUtils.createLookup = function (array) {
        var propertyChain = arguments.splice(0, 1);
        var lookup = new Map();
        for (var key in array) {
            var value = array[key];
            for (var prop in propertyChain)
                value = value[prop];
            lookup[value] = key;
        }
        return lookup;
    }

    if (typeof exports !== 'undefined') {
        module.exports = VectorUtils;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.VectorUtils = VectorUtils;
    }
}());
