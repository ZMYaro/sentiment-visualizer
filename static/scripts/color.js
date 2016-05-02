function Color(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
	
	return this;
}

Color.prototype = {
	get rgb() {
		return 'rgb(' + Math.floor(this.r) + ',' + Math.floor(this.g) + ',' + Math.floor(this.b) + ')';
	}
};
