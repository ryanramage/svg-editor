/**
 * Package: svgedit.draw
 *
 * Licensed under the Apache License, Version 2
 *
 * Copyright(c) 2011 Jeff Schiller
 */

// Dependencies:
// 1) jQuery

(function() {
if (!window.svgedit) {
	window.svgedit = {};
}

if (!svgedit.draw) {
	svgedit.draw = {};
}

var svg_ns = "http://www.w3.org/2000/svg";
var se_ns = "http://svg-edit.googlecode.com";

/**
 * This class encapsulates the concept of a layer in the drawing
 * @param name {String} Layer name
 * @param child {SVGGElement} Layer SVG group.
 */
svgedit.draw.Layer = function(name, group) {
	this.name_ = name;
	this.group_ = group;
};

svgedit.draw.Layer.prototype.getName = function() {
	return this.name_;
};

svgedit.draw.Layer.prototype.getGroup = function() {
	return this.group_;
};


/**
 * This class encapsulates the concept of a SVG-edit drawing
 *
 * @param svgElem {SVGSVGElement} The SVG DOM Element that this JS object
 *     encapsulates.  If the svgElem has a se:nonce attribute on it, then
 *     IDs will use the nonce as they are generated.
 * @param opt_idPrefix {String} The ID prefix to use.  Defaults to "svg_"
 *     if not specified.
 */
svgedit.draw.Drawing = function(svgElem, opt_idPrefix) {
	if (!svgElem || !svgElem.tagName || !svgElem.namespaceURI ||
		svgElem.tagName != 'svg' || svgElem.namespaceURI != svg_ns) {
		throw "Error: svgedit.draw.Drawing instance initialized without a <svg> element";
	}

	this.svgElem_ = svgElem;
	this.obj_num = 0;
	this.idPrefix = opt_idPrefix || "svg_";
	this.releasedNums = [];

	// z-ordered array of tuples containing layer names and <g> elements
	// the first layer is the one at the bottom of the rendering
	this.all_layers = [];

	// Determine if the <svg> element has a nonce on it
	this.nonce_ = this.svgElem_.getAttributeNS(se_ns, 'nonce') || "";
};

svgedit.draw.Drawing.prototype.getElem_ = function(id) {
	if(this.svgElem_.querySelector) {
		// querySelector lookup
		return this.svgElem_.querySelector('#'+id);
	} else {
		// jQuery lookup: twice as slow as xpath in FF
		return $(this.svgElem_).find('[id=' + id + ']')[0];
	}
};

svgedit.draw.Drawing.prototype.getSvgElem = function() {
	return this.svgElem_;
}

svgedit.draw.Drawing.prototype.getNonce = function() {
	return this.nonce_;
};

/**
 * Returns the latest object id as a string.
 * @return {String} The latest object Id.
 */
svgedit.draw.Drawing.prototype.getId = function() {
	return this.nonce_ ?
		this.idPrefix + this.nonce_ +'_' + this.obj_num :
 		this.idPrefix + this.obj_num;
};

/**
 * Returns the next object Id as a string.
 * @return {String} The next object Id to use.
 */
svgedit.draw.Drawing.prototype.getNextId = function() {
	var oldObjNum = this.obj_num;
	var restoreOldObjNum = false;

	// If there are any released numbers in the release stack, 
	// use the last one instead of the next obj_num.
	// We need to temporarily use obj_num as that is what getId() depends on.
	if (this.releasedNums.length > 0) {
		this.obj_num = this.releasedNums.pop();
		restoreOldObjNum = true;
	} else {
		// If we are not using a released id, then increment the obj_num.
		this.obj_num++;
	}

	// Ensure the ID does not exist.
	var id = this.getId();
	while (this.getElem_(id)) {
		if (restoreOldObjNum) {
			this.obj_num = oldObjNum;
			restoreOldObjNum = false;
		}
		this.obj_num++;
		id = this.getId();
	}
	// Restore the old object number if required.
	if (restoreOldObjNum) {
		this.obj_num = oldObjNum;
	}
	return id;
};

// Function: svgedit.draw.Drawing.releaseId
// Releases the object Id, letting it be used as the next id in getNextId().
// This method DOES NOT remove any elements from the DOM, it is expected
// that client code will do this.
//
// Parameters:
// id - The id to release.
//
// Returns:
// True if the id was valid to be released, false otherwise.
svgedit.draw.Drawing.prototype.releaseId = function(id) {
	// confirm if this is a valid id for this Document, else return false
	var front = this.idPrefix + (this.nonce_ ? this.nonce_ +'_' : '');
	if (typeof id != typeof '' || id.indexOf(front) != 0) {
		return false;
	}
	// extract the obj_num of this id
	var num = parseInt(id.substr(front.length));

	// if we didn't get a positive number or we already released this number
	// then return false.
	if (typeof num != typeof 1 || num <= 0 || this.releasedNums.indexOf(num) != -1) {
		return false;
	}
	
	// push the released number into the released queue
	this.releasedNums.push(num);

	return true;
};

// Function: svgedit.draw.Drawing.getNumLayers
// Returns the number of layers in the current drawing.
// 
// Returns:
// The number of layers in the current drawing.
svgedit.draw.Drawing.prototype.getNumLayers = function() {
	return this.all_layers.length;
};

// Function: svgedit.draw.Drawing.hasLayer
// Check if layer with given name already exists
svgedit.draw.Drawing.prototype.hasLayer = function(name) {
	for(var i = 0; i < this.getNumLayers(); i++) {
		if(this.all_layers[i][0] == name) return true;
	}
	return false;
};


})();
