(function () {



    /**
     * Bounds2D provides a flexible interface to a Rectangle-like object.
     * The bounds values are stored as this.xMin,yMin,xMax,yMax instead of x,y,width,height
     * because information is lost when storing as width,height and it causes rounding
     * errors when using includeBounds() and includePoint(), depending on the order you
     * include multiple points.
     *
     * @author adufilie
     * @author sanjay1909
     */

    /**
     * The default coordinates are all NaN so that includeCoords() will behave as expected after
     * creating an empty Bounds2D.
     * @param this.xMin The starting X coordinate.
     * @param this.yMin The starting Y coordinate.
     * @param this.xMax The ending X coordinate.
     * @param this.yMax The ending Y coordinate.
     */
    function Bounds2D(xMin, yMin, xMax, yMax) {

        /**
         * These are the values defining the bounds.
         */
        this.xMin = (xMin === undefined) ? NaN : xMin;
        this.yMin = (yMin === undefined) ? NaN : yMin;
        this.xMax = (xMax === undefined) ? NaN : xMax;
        this.yMax = (yMax === undefined) ? NaN : yMax;


        this.setBounds(this.xMin, this.yMin, this.xMax, this.yMax);
    }





    var p = Bounds2D.prototype;


    p.getXMin = function () {
        return this.xMin;
    }
    p.getYMin = function () {
        return this.yMin;
    }
    p.getXMax = function () {
        return this.xMax;
    }
    p.getYMax = function () {
        return this.yMax;
    }
    p.setXMin = function (value) {
        this.xMin = value;
    }
    p.setYMin = function (value) {
        this.yMin = value;
    }
    p.setXMax = function (value) {
        this.xMax = value;
    }
    p.setYMax = function (value) {
        this.yMax = value;
    }

    /**
     * This function copies the bounds from another Bounds2D object.
     * @param A Bounds2D object to copy the bounds from.
     */
    p.copyFrom = function (other) {
        if (other === null) {
            this.reset();
            return;
        }
        var o = (other && other instanceof Bounds2D) ? other : null;
        if (o) {
            this.xMin = o.xMin;
            this.yMin = o.yMin;
            this.xMax = o.xMax;
            this.yMax = o.yMax;
        } else {
            other.getMinPoint(Bounds2D.tempPoint);
            this.setMinPoint(Bounds2D.tempPoint);
            other.getMaxPoint(Bounds2D.tempPoint);
            this.setMaxPoint(Bounds2D.tempPoint);
        }
    }

    /**
     * This function makes a copy of the Bounds2D object.
     * @return An equivalent copy of this Bounds2D object.
     */
    p.cloneBounds = function () {
        return new Bounds2D(this.xMin, this.yMin, this.xMax, this.yMax);
    }

    /**
     * For the x and y dimensions, this function swaps min and max values if min > max.
     */
    p.makeSizePositive = function () {
        var temp;
        // make width positive
        if (this.xMin > this.xMax) {
            temp = this.xMin;
            this.xMin = this.xMax;
            this.xMax = temp;
        }
        // make height positive
        if (this.yMin > this.yMax) {
            temp = this.yMin;
            this.yMin = this.yMax;
            this.yMax = temp;
        }
    }

    /**
     * This function resets all coordinates to NaN.
     */
    p.reset = function () {
        this.xMin = NaN;
        this.yMin = NaN;
        this.xMax = NaN;
        this.yMax = NaN;
    }

    /**
     * This function checks if any coordinates are undefined or infinite.
     * @return true if any coordinate is not a finite number.
     */
    p.isUndefined = function () {
        return !isFinite(this.xMin) || !isFinite(this.yMin) || !isFinite(this.xMax) || !isFinite(this.yMax);
    }

    /**
     * This function checks if the Bounds2D is empty.
     * @return true if the width or height is 0, or is undefined.
     */
    p.isEmpty = function () {
        return this.xMin === this.xMax || this.yMin === this.yMax || this.isUndefined();
    }

    /**
     * This function compares the Bounds2D with another Bounds2D.
     * @param other Another Bounds2D to compare to
     * @return true if given Bounds2D is equivalent, even if values are undefined
     */
    p.equals = function (other) {
        if (other === null)
            return this.isUndefined();
        var o = (other && other instanceof Bounds2D) ? other : null;
        if (!o)
            (o = this.staticBounds2D_A).copyFrom(other);
        return (this.xMin === o.xMin || (isNaN(this.xMin) && isNaN(o.xMin))) && (this.yMin === o.yMin || (isNaN(this.yMin) && isNaN(o.yMin))) && (this.xMax === o.xMax || (isNaN(this.xMax) && isNaN(o.xMax))) && (this.yMax === o.yMax || (isNaN(this.yMax) && isNaN(o.yMax)));
    }

    /**
     * This function sets the four coordinates that define the bounds.
     * @param this.xMin The new this.xMin value.
     * @param this.yMin The new this.yMin value.
     * @param this.xMax The new this.xMax value.
     * @param this.yMax The new this.yMax value.
     */
    p.setBounds = function (xMin, yMin, xMax, yMax) {
        // allow any values for fastest performance
        this.xMin = this.xMin;
        this.yMin = this.yMin;
        this.xMax = this.xMax;
        this.yMax = this.yMax;
    }

    /**
     * This function sets the bounds coordinates using x, y, width and height values.
     * @param x The new this.xMin value.
     * @param y The new this.yMin value.
     * @param width The new width of the bounds.
     * @param height The new height of the bounds.
     */
    p.setRectangle = function (x, y, width, height) {
        // allow any values for fastest performance
        this.xMin = x;
        this.yMin = y;
        this.xMax = x + width;
        this.yMax = y + height;
    }

    /**
     * This function copies the values from this Bounds2D object into a Rectangle object.
     * @param output A Rectangle to store the result in.
     * @param makeSizePositive If true, this will give the Rectangle positive width/height values.
     * @return Either the given output Rectangle, or a new Rectangle if none was specified.
     */
    p.getRectangle = function (output, makeSizePositive) {
        output = (output === undefined) ? null : output;
        makeSizePositive = (makeSizePositive === undefined) ? true : makeSizePositive;
        if (output === null)
            output = new weavedata.Rectangle();
        if (makeSizePositive) {
            output.x = this.getXNumericMin();
            output.y = this.getYNumericMin();
            output.width = this.getXCoverage();
            output.height = this.getYCoverage();
        } else {
            output.x = this.xMin;
            output.y = this.yMin;
            output.width = this.getWidth();
            output.height = this.getHeight();
        }
        return output;
    }

    /**
     * This will apply transformations to an existing Matrix for projecting coordinates from this bounds to another.
     * @param destinationBounds The destination bounds used to calculate the transformation.
     * @param outputMatrix The Matrix used to store the transformation.
     * @param startWithIdentity If this is true, then outputMatrix.identity() will be applied first.
     */

    p.transformMatrix = function (destinationBounds, outputMatrix, startWithIdentity) {
        if (startWithIdentity)
            outputMatrix.identity();
        outputMatrix.translate(-xMin, -yMin);
        outputMatrix.scale(
            destinationBounds.getWidth() / getWidth(),
            destinationBounds.getHeight() / getHeight()
        );
        outputMatrix.translate(destinationBounds.getXMin(), destinationBounds.getYMin());
    }

    /**
     * This function will expand this Bounds2D to include a point.
     * @param newPoint A point to include in this Bounds2D.
     */
    p.includePoint = function (newPoint) {
        this.includeCoords(newPoint.x, newPoint.y);
    }

    /**
     * This function will expand this Bounds2D to include a point.
     * @param newX The X coordinate of a point to include in this Bounds2D.
     * @param newY The Y coordinate of a point to include in this Bounds2D.
     */
    p.includeCoords = function (newX, newY) {
        if (isFinite(newX)) {
            // If x coordinates are undefined, define them now.
            if (isNaN(this.xMin)) {
                if (isNaN(this.xMax))
                    this.xMin = this.xMax = newX;
                else
                    this.xMin = this.xMax;
            } else if (isNaN(this.xMax))
                this.xMax = this.xMin;
            // update min,max values for both positive and negative width values
            if (this.xMin > this.xMax) // negative width
            {
                if (newX > this.xMin) this.xMin = newX; // this.xMin = Math.max(xMin, newX);
                if (newX < this.xMax) this.xMax = newX; // this.xMax = Math.min(xMax, newX);
            } else // positive width
            {
                if (newX < this.xMin) this.xMin = newX; // this.xMin = Math.min(xMin, newX);
                if (newX > this.xMax) this.xMax = newX; // this.xMax = Math.max(xMax, newX);
            }
        }
        if (isFinite(newY)) {
            // If y coordinates are undefined, define them now.
            if (isNaN(this.yMin)) {
                if (isNaN(this.yMax))
                    this.yMin = this.yMax = newY;
                else
                    this.yMin = this.yMax;
            } else if (isNaN(this.yMax))
                this.yMax = this.yMin;
            // update min,max values for both positive and negative height values
            if (this.yMin > this.yMax) // negative height
            {
                if (newY > this.yMin) this.yMin = newY; // this.yMin = Math.max(yMin, newY);
                if (newY < this.yMax) this.yMax = newY; // this.yMax = Math.min(yMax, newY);
            } else // positive height
            {
                if (newY < this.yMin) this.yMin = newY; // this.yMin = Math.min(yMin, newY);
                if (newY > this.yMax) this.yMax = newY; // this.yMax = Math.max(yMax, newY);
            }
        }
    }

    /**
     * This function will expand this Bounds2D to include another Bounds2D.
     * @param otherBounds Another Bounds2D object to include within this Bounds2D.
     */
    p.includeBounds = function (otherBounds) {
        var o = (otherBounds && otherBounds instanceof Bounds2D) ? otherBounds : null;
        if (o) {
            this.includeCoords(o.xMin, o.yMin);
            this.includeCoords(o.xMax, o.yMax);
        } else {
            otherBounds.getMinPoint(Bounds2D.tempPoint);
            this.includePoint(Bounds2D.tempPoint);
            otherBounds.getMaxPoint(Bounds2D.tempPoint);
            this.includePoint(Bounds2D.tempPoint);
        }
    }



    // this function supports comparisons of bounds with negative width/height
    p.overlaps = function (other, includeEdges) {
        includeEdges = (includeEdges === undefined) ? includeEdges : null;
        // load re-usable objects and make sizes positive to make it easier to compare
        var a = this.staticBounds2D_A;
        a.copyFrom(this);
        a.makeSizePositive();

        var b = Bounds2D.staticBounds2D_B;
        b.copyFrom(other);
        b.makeSizePositive();

        // test for overlap
        if (includeEdges)
            return a.xMin <= b.xMax && b.xMin <= a.xMax && a.yMin <= b.yMax && b.yMin <= a.yMax;
        else
            return a.xMin < b.xMax && b.xMin < a.xMax && a.yMin < b.yMax && b.yMin < a.yMax;
    }


    /**
     * This function supports a Bounds2D object having negative width and height, unlike the Rectangle object
     * @param point A point to test.
     * @return A value of true if the point is contained within this Bounds2D.
     */
    p.containsPoint = function (point) {
        return this.contains(point.x, point.y);
    }

    /**
     * This function supports a Bounds2D object having negative width and height, unlike the Rectangle object
     * @param x An X coordinate for a point.
     * @param y A Y coordinate for a point.
     * @return A value of true if the point is contained within this Bounds2D.
     */
    p.contains = function (x, y) {
        return ((this.xMin < this.xMax) ? (this.xMin <= x && x <= this.xMax) : (this.xMax <= x && x <= this.xMin)) && ((this.yMin < this.yMax) ? (this.yMin <= y && y <= this.yMax) : (this.yMax <= y && y <= this.yMin));
    }

    /**
     * This function supports a Bounds2D object having negative width and height, unlike the Rectangle object
     * @param other Another Bounds2D object to check.
     * @return A value of true if the other Bounds2D is contained within this Bounds2D.
     */
    p.containsBounds = function (other) {
        var o = (other && other instanceof Bounds2D) ? other : null;
        if (o) {
            return contains(o.xMin, o.yMin) && contains(o.xMax, o.yMax);
        }

        other.getMinPoint(Bounds2D.tempPoint);
        if (this.containsPoint(Bounds2D.tempPoint)) {
            other.getMaxPoint(Bounds2D.tempPoint);
            return this.containsPoint(Bounds2D.tempPoint);
        }
        return false;
    }

    /**
     * This function is used to determine which vertices of a polygon can be skipped when rendering within the bounds of this Bounds2D.
     * While iterating over vertices, test each one with this function.
     * If (firstGridTest &amp; secondGridTest &amp; thirdGridTest) is non-zero, then the second vertex can be skipped.
     * @param x The x-coordinate to test.
     * @param y The y-coordinate to test.
     * @return A value to be ANDed with other results of getGridTest().
     */
    p.getGridTest = function (x, y) {
        // Note: This function is optimized for speed

        // If three consecutive vertices all share one of (X_HI, X_LO, Y_HI, Y_LO) test results,
        // then the middle point can be skipped when rendering inside the bounds.

        var x0, x1, y0, y1;

        if (this.xMin < this.xMax)
            x0 = this.xMin, x1 = this.xMax;
        else
            x1 = this.xMin, x0 = this.xMax;

        if (this.yMin < this.yMax)
            y0 = this.yMin, y1 = this.yMax;
        else
            y1 = this.yMin, y0 = this.yMax;

        return (x < x0 ? 0x0001 /*X_LO*/ : (x > x1 ? 0x0010 /*X_HI*/ : 0)) | (y < y0 ? 0x0100 /*Y_LO*/ : (y > y1 ? 0x1000 /*Y_HI*/ : 0));
    }

    /**
     * This function projects the coordinates of a Point object from this bounds to a
     * destination bounds. The specified point object will be modified to contain the result.
     * @param point The Point object containing coordinates to project.
     * @param toBounds The destination bounds.
     */
    p.projectPointTo = function (point, toBounds) {
        // this function is optimized for speed
        var toXMin;
        var toXMax;
        var toYMin;
        var toYMax;
        var tb = (toBounds && toBounds instanceof Bounds2D) ? toBounds : null;
        if (tb) {
            toXMin = tb.xMin;
            toXMax = tb.xMax;
            toYMin = tb.yMin;
            toYMax = tb.yMax;
        } else {
            toBounds.getMinPoint(Bounds2D.tempPoint);
            toXMin = Bounds2D.tempPoint.x;
            toYMin = Bounds2D.tempPoint.y;
            toBounds.getMaxPoint(Bounds2D.tempPoint);
            toXMax = Bounds2D.tempPoint.x;
            toYMax = Bounds2D.tempPoint.y;
        }

        var x = toXMin + (point.x - this.xMin) / (this.xMax - this.xMin) * (toXMax - toXMin);

        if (x <= Infinity) // alternative to !isNaN()
            point.x = x;
        else
            point.x = (toXMin + toXMax) / 2;

        var y = toYMin + (point.y - this.yMin) / (this.yMax - this.yMin) * (toYMax - toYMin);

        if (y <= Infinity) // alternative to !isNaN()
            point.y = y;
        else
            point.y = (toYMin + toYMax) / 2;
    }

    /**
     * This function projects all four coordinates of a Bounds2D object from this bounds
     * to a destination bounds. The specified coords object will be modified to contain the result.
     * @param inputAndOutput A Bounds2D object containing coordinates to project.
     * @param toBounds The destination bounds.
     */
    p.projectCoordsTo = function (coords, toBounds) {
        // project min coords
        coords.getMinPoint(Bounds2D.tempPoint);
        this.projectPointTo(Bounds2D.tempPoint, toBounds);
        coords.setMinPoint(Bounds2D.tempPoint);
        // project max coords
        coords.getMaxPoint(Bounds2D.tempPoint);
        this.projectPointTo(Bounds2D.tempPoint, toBounds);
        coords.setMaxPoint(Bounds2D.tempPoint);
    }

    /**
     * This constrains a point to be within this Bounds2D. The specified point object will be modified to contain the result.
     * @param point The point to constrain.
     */
    p.constrainPoint = function (point) {
        // find numerical min,max x values and constrain x coordinate
        if (!isNaN(this.xMin) && !isNaN(this.xMax)) // do not constrain point if bounds is undefined
            point.x = Math.max(Math.min(this.xMin, this.xMax), Math.min(point.x, Math.max(this.xMin, this.xMax)));

        // find numerical min,max y values and constrain y coordinate
        if (!isNaN(yMin) && !isNaN(yMax)) // do not constrain point if bounds is undefined
            point.y = Math.max(Math.min(this.yMin, this.yMax), Math.min(point.y, Math.max(this.yMin, this.yMax)));
    }



    /**
     * This constrains the center point of another Bounds2D to be overlapping the center of this Bounds2D.
     * The specified boundsToConstrain object will be modified to contain the result.
     * @param boundsToConstrain The Bounds2D objects to constrain.
     */
    p.constrainBoundsCenterPoint = function (boundsToConstrain) {
        if (this.isUndefined())
            return;
        // find the point in the boundsToConstrain closest to the center point of this bounds
        // then offset the boundsToConstrain so it overlaps the center point of this bounds
        boundsToConstrain.getCenterPoint(Bounds2D.tempPoint);
        this.constrainPoint(Bounds2D.tempPoint);
        boundsToConstrain.setCenterPoint(Bounds2D.tempPoint);
    }

    /**
     * This function will reposition a bounds such that for the x and y dimensions of this
     * bounds and another bounds, at least one bounds will completely contain the other bounds.
     * The specified boundsToConstrain object will be modified to contain the result.
     * @param boundsToConstrain the bounds we want to constrain to be within this bounds
     * @param preserveSize if set to true, width,height of boundsToConstrain will remain the same
     */
    p.constrainBounds = function (boundsToConstrain, preserveSize) {
        preserveSize = (preserveSize === undefined) ? true : preserveSize;
        if (preserveSize) {
            var b2c = (boundsToConstrain && boundsToConstrain instanceof Bounds2D) ? boundsToConstrain : null;
            if (!b2c) {
                this.staticBounds2D_A.copyFrom(boundsToConstrain);
                b2c = this.staticBounds2D_A;
            }
            // constrain x values
            Bounds2D.staticRange_A.setRange(this.xMin, this.xMax);
            Bounds2D.staticRange_B.setRange(b2c.xMin, b2c.xMax);
            Bounds2D.staticRange_A.constrainRange(Bounds2D.staticRange_B);
            boundsToConstrain.setXRange(Bounds2D.staticRange_B.begin, Bounds2D.staticRange_B.end);
            // constrain y values
            Bounds2D.staticRange_A.setRange(this.yMin, this.yMax);
            Bounds2D.staticRange_B.setRange(b2c.yMin, b2c.yMax);
            Bounds2D.staticRange_A.constrainRange(Bounds2D.staticRange_B);
            boundsToConstrain.setYRange(Bounds2D.staticRange_B.begin, Bounds2D.staticRange_B.end);
        } else {
            // constrain min point
            boundsToConstrain.getMinPoint(Bounds2D.tempPoint);
            this.constrainPoint(Bounds2D.tempPoint);
            boundsToConstrain.setMinPoint(Bounds2D.tempPoint);
            // constrain max point
            boundsToConstrain.getMaxPoint(Bounds2D.tempPoint);
            this.constrainPoint(Bounds2D.tempPoint);
            boundsToConstrain.setMaxPoint(Bounds2D.tempPoint);
        }
    }

    p.offset = function (xOffset, yOffset) {
        this.xMin += xOffset;
        this.xMax += xOffset;
        this.yMin += yOffset;
        this.yMax += yOffset;
    }

    p.setXRange = function (xMin, xMax) {
        this.xMin = this.xMin;
        this.xMax = this.xMax;
    }

    p.setYRange = function (yMin, yMax) {
        this.yMin = this.yMin;
        this.yMax = this.yMax;
    }

    p.setCenteredXRange = function (xCenter, width) {
        this.xMin = xCenter - width / 2;
        this.xMax = xCenter + width / 2;
    }

    p.setCenteredYRange = function (yCenter, height) {
        this.yMin = yCenter - height / 2;
        this.yMax = yCenter + height / 2;
    }

    p.setCenteredRectangle = function (xCenter, yCenter, width, height) {
        this.setCenteredXRange(xCenter, width);
        this.setCenteredYRange(yCenter, height);
    }

    /**
     * This function will set the width and height to the new values while keeping the
     * center point constant.  This function works with both positive and negative values.
     */
    p.centeredResize = function (width, height) {
        this.setCenteredXRange(this.getXCenter(), width);
        this.setCenteredYRange(this.getYCenter(), height);
    }

    p.getXCenter = function () {
        return (this.xMin + this.xMax) / 2;
    }
    p.setXCenter = function (xCenter) {
        if (isNaN(this.xMin) || isNaN(this.xMax))
            this.xMin = this.xMax = xCenter;
        else {
            var xShift = xCenter - (this.xMin + this.xMax) / 2;
            this.xMin += xShift;
            this.xMax += xShift;
        }
    }

    p.getYCenter = function () {
        return (this.yMin + this.yMax) / 2;
    }
    p.setYCenter = function (yCenter) {
        if (isNaN(this.yMin) || isNaN(this.yMax))
            this.yMin = this.yMax = yCenter;
        else {
            var yShift = yCenter - (this.yMin + this.yMax) / 2;
            this.yMin += yShift;
            this.yMax += yShift;
        }
    }

    /**
     * This function stores the xCenter and yCenter coordinates into a Point object.
     * @param value The Point object to store the xCenter and yCenter coordinates in.
     */
    p.getCenterPoint = function (output) {
        output.x = this.getXCenter();
        output.y = this.getYCenter();
    }

    /**
     * This function will shift the bounds coordinates so that the xCenter and yCenter
     * become the coordinates in a specified Point object.
     * @param value The Point object containing the desired xCenter and yCenter coordinates.
     */
    p.setCenterPoint = function (value) {
        this.setXCenter(value.x);
        this.setYCenter(value.y);
    }

    /**
     * This function will shift the bounds coordinates so that the xCenter and yCenter
     * become the specified values.
     * @param xCenter The desired value for xCenter.
     * @param yCenter The desired value for yCenter.
     */
    p.setCenter = function (xCenter, yCenter) {
        this.setXCenter(xCenter);
        this.setYCenter(yCenter);
    }

    /**
     * This function stores the this.xMin and this.yMin coordinates in a Point object.
     * @param output The Point to store the this.xMin and this.yMin coordinates in.
     */
    p.getMinPoint = function (output) {
            output.x = this.xMin;
            output.y = this.yMin;
        }
        /**
         * This function sets the this.xMin and this.yMin values from a Point object.
         * @param value The Point containing new this.xMin and this.yMin coordinates.
         */
    p.setMinPoint = function (value) {
        this.xMin = value.x;
        this.yMin = value.y;
    }

    /**
     * This function stores the this.xMax and this.yMax coordinates in a Point object.
     * @param output The Point to store the this.xMax and this.yMax coordinates in.
     */
    p.getMaxPoint = function (output) {
            output.x = this.xMax;
            output.y = this.yMax;
        }
        /**
         * This function sets the this.xMax and this.yMax values from a Point object.
         * @param value The Point containing new this.xMax and this.yMax coordinates.
         */
    p.setMaxPoint = function (value) {
        this.xMax = value.x;
        this.yMax = value.y;
    }

    /**
     * This function sets the this.xMin and this.yMin values.
     * @param x The new this.xMin coordinate.
     * @param y The new this.yMin coordinate.
     */
    p.setMinCoords = function (x, y) {
            this.xMin = x;
            this.yMin = y;
        }
        /**
         * This function sets the this.xMax and this.yMax values.
         * @param x The new this.xMax coordinate.
         * @param y The new this.yMax coordinate.
         */
    p.setMaxCoords = function (x, y) {
        this.xMax = x;
        this.yMax = y;
    }

    /**
     * This is equivalent to ObjectUtil.numericCompare(xMax, this.xMin)
     */
    p.getXDirection = function () {
        if (this.xMin > this.xMax)
            return -1;
        if (this.xMin < this.xMax)
            return 1;
        return 0;
    }

    /**
     * This is equivalent to ObjectUtil.numericCompare(yMax, this.yMin)
     */
    p.getYDirection = function () {
        if (this.yMin > this.yMax)
            return -1;
        if (this.yMin < this.yMax)
            return 1;
        return 0;
    }

    /**
     * The width of the bounds is defined as this.xMax - this.xMin.
     */
    p.getWidth = function () {
        var _width = this.xMax - this.xMin;
        return isNaN(_width) ? 0 : _width;
    }

    /**
     * The height of the bounds is defined as this.yMax - this.yMin.
     */
    p.getHeight = function () {
        var _height = this.yMax - this.yMin;
        return isNaN(_height) ? 0 : _height;
    }

    /**
     * This function will set the width by adjusting the this.xMin and this.xMax values relative to xCenter.
     * @param value The new width value.
     */
    p.setWidth = function (value) {
            this.setCenteredXRange(this.getXCenter(), value);
        }
        /**
         * This function will set the height by adjusting the this.yMin and this.yMax values relative to yCenter.
         * @param value The new height value.
         */
    p.setHeight = function (value) {
        this.setCenteredYRange(this.getYCenter(), value);
    }

    /**
     * Area is defined as the absolute value of width * height.
     * @return The area of the bounds.
     */
    p.getArea = function () {
        var area = (this.xMax - this.xMin) * (this.yMax - this.yMin);
        return (area < 0) ? -area : area; // Math.abs(area);
    }

    /**
     * The xCoverage is defined as the absolute value of the width.
     * @return The xCoverage of the bounds.
     */
    p.getXCoverage = function () {
            return (this.xMin < this.xMax) ? (this.xMax - this.xMin) : (this.xMin - this.xMax); // Math.abs(xMax - this.xMin);
        }
        /**
         * The yCoverage is defined as the absolute value of the height.
         * @return The yCoverage of the bounds.
         */
    p.getYCoverage = function () {
        return (this.yMin < this.yMax) ? (this.yMax - this.yMin) : (this.yMin - this.yMax); // Math.abs(yMax - this.yMin);
    }

    /**
     * The xNumericMin is defined as the minimum of this.xMin and this.xMax.
     * @return The numeric minimum x coordinate.
     */
    p.getXNumericMin = function () {
            return this.xMax < this.xMin ? this.xMax : this.xMin; // if any are NaN, returns this.xMin
        }
        /**
         * The yNumericMin is defined as the minimum of this.yMin and this.yMax.
         * @return The numeric minimum y coordinate.
         */
    p.getYNumericMin = function () {
            return this.yMax < this.yMin ? this.yMax : this.yMin; // if any are NaN, returns this.yMin
        }
        /**
         * The xNumericMax is defined as the maximum of this.xMin and this.xMax.
         * @return The numeric maximum x coordinate.
         */
    p.getXNumericMax = function () {
            return this.xMax < this.xMin ? this.xMin : this.xMax; // if any are NaN, returns this.xMax
        }
        /**
         * The xNumericMax is defined as the maximum of this.xMin and this.xMax.
         * @return The numeric maximum y coordinate.
         */
    p.getYNumericMax = function () {
        return this.yMax < this.yMin ? this.yMin : this.yMax; // if any are NaN, returns this.yMax
    }

    /**
     * This function returns a String suitable for debugging the Bounds2D coordinates.
     * @return A String containing the coordinates of the bounds.
     */
    p.toString = function () {
        return "(xMin=" + this.xMin + ", " + "yMin=" + this.yMin + ", " + "xMax=" + this.xMax + ", " + "yMax=" + this.yMax + ")";
    }


    // re-usable temporary objects
    Object.defineProperties(Bounds2D, {
        'staticBounds2D_A': {
            value: new Bounds2D()
        },
        'staticBounds2D_B': {
            value: new Bounds2D()
        },
        'tempPoint': {
            value: {
                'x': NaN,
                'y': NaN
            }
        },
        'staticRange_A': {
            value: new weavedata.Range()
        },
        'staticRange_B': {
            value: new weavedata.Range()
        }
    });

    if (typeof exports !== 'undefined') {
        module.exports = Bounds2D;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.Bounds2D = Bounds2D;
    }


}());
