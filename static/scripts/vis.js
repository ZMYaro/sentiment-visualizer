function Vis(canvas) {
	this._canvas = canvas;
	this._ctx = canvas.getContext('2d');
	this._colorFeed = undefined;
	
	// Initialize the color grid.
	this.grid = new Array(Vis.GRID_HEIGHT);
	for (var r = 0; r < this.grid.length; r++) {
		this.grid[r] = new Array(Vis.GRID_WIDTH);
		for (var c = 0; c < this.grid[r].length; c++) {
			this.grid[r][c] = Vis.DEFAULT_COLOR;
		}
	}
	
	this.update = this.update.bind(this);
	this.update();
	
	return this;
}

Vis.GRID_WIDTH = 64;
Vis.GRID_HEIGHT = 24;
Vis.STEP_TIME = 500; // Milliseconds
Vis.CURRENT_COLOR_WEIGHT = 0.3;
Vis.OTHER_COLOR_WEIGHT = 0.7;
Vis.DEFAULT_COLOR = new Color(32, 0, 32);

Vis.prototype = {
	/**
	 * Calculate the new color of a pixel.
	 * @param {Number} r - The row of the pixel
	 * @param {Number} c - The column of the pixel
	 */
	_calculateNewPixel(r, c) {
		return new Color(this._calculateNewSubpixel(r, c, 'r'),
			this._calculateNewSubpixel(r, c, 'g'),
			this._calculateNewSubpixel(r, c, 'b'));
	},
	
	/**
	 * Calculate the new color of a subpixel.
	 * @param {Number} r - The row of the pixel containing the subpixel
	 * @param {Number} c - The column of the pixel containing the subpixel
	 * @param {String} sp - The subpixel: “r”, “g”, or “b”
	 */
	_calculateNewSubpixel(r, c, sp) {
		var avgOtherColor = 0;
		
		for (var row = r - 1; row <= r + 1; row++) {
			for (var col = c - 1; col <= c + 1; col++) {
				if (row === r && col === c) {
					continue;
				}
				var wrappedRow = row,
					wrappedCol = col;
				if (wrappedRow < 0) {
					wrappedRow = this.grid.length - 1;
				} else if (wrappedRow >= this.grid.length) {
					wrappedRow = 0;
				}
				if (wrappedCol < 0) {
					wrappedCol = this.grid.length - 1;
				} else if (wrappedCol >= this.grid.length) {
					wrappedCol = 0;
				}
				avgOtherColor += this.grid[wrappedRow][wrappedCol][sp];
			}
		}
		avgOtherColor /= 8;
		
		return (this.grid[r][c][sp] * Vis.CURRENT_COLOR_WEIGHT) +
			(avgOtherColor * Vis.OTHER_COLOR_WEIGHT);
	},
	
	_updateGrid: function () {
		if (this._colorFeed) {
			for (var r = this._colorFeed.row - 2; r <= this._colorFeed.row + 2; r++) {
				for (var c = this._colorFeed.col - 2; c <= this._colorFeed.col + 2; c++) {
					this.grid[r][c] = this._colorFeed.color;
				}
			}
		}
		
		var newGrid = new Array(Vis.GRID_HEIGHT);
		for (var r = 0; r < this.grid.length; r++) {
			newGrid[r] = new Array(Vis.GRID_WIDTH);
			for (var c = 0; c < this.grid[r].length; c++) {
				newGrid[r][c] = this._calculateNewPixel(r, c);
			}
		}
		this.grid = newGrid;
	},
	
	_updateCanvas: function () {
		var cellWidth = this._canvas.width / this.grid[0].length,
			cellHeight = this._canvas.height / this.grid.length;
		
		for (var r = 0; r < this.grid.length; r++) {
			for (var c = 0; c < this.grid[r].length; c++) {
				this._ctx.fillStyle = this.grid[r][c].rgb;
				this._ctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
			}
		}
	},
	
	/**
	 * Add a splash of color in the center of the grid.
	 * @param {Number} polarity
	 * @param {Number} subjectivity
	 */
	setColorFeed: function (polarity, subjectivity) {
		this._colorFeed = {
			row: Math.round(Vis.GRID_HEIGHT / 2),
			col: Math.max(2, Math.min(Vis.GRID_WIDTH - 3, Math.round(subjectivity * Vis.GRID_WIDTH))),
			color: new Color(255 * (1 - polarity), 20 + 100 * polarity, 255 * polarity)
		};
		console.log(this._colorFeed);
	},
	
	/**
	 * Remove the color feed.
	 */
	clearColorFeed: function () {
		this._colorFeed = undefined;
	},
	
	update: function () {
		this._updateGrid();
		this._updateCanvas();
		setTimeout(this.update, Vis.STEP_TIME);
	}
};
