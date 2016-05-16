'use strict';

function Vis3D(container, textureCanvas) {
	// Store references to the 2D visualizer.
	this._textureCanvas = textureCanvas;
	this._textureLoader = new THREE.TextureLoader();
	this.wireframe = false;
	
	// Initialize the three.js scene.
	this._scene = new THREE.Scene();
	this._renderer = new THREE.WebGLRenderer();
	this._renderer.setSize(textureCanvas.width, textureCanvas.height);
	container.appendChild(this._renderer.domElement);
	container.style.width = textureCanvas.width + 'px';
	container.style.height = textureCanvas.height + 'px';
	container.style.display = 'block';
	
	var geometry = new THREE.PlaneGeometry(
		textureCanvas.width,
		textureCanvas.height,
		Vis3D.GRID_WIDTH - 1,
		Vis3D.GRID_HEIGHT - 1);
	geometry.dynamic = true;
	this._mesh = new THREE.Mesh(
		geometry,
		new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } ));
	this._mesh.rotation.x = -Math.PI / 4;
	this._mesh.position.y = -10;
	this._scene.add(this._mesh);
	
	this._camera = new THREE.PerspectiveCamera(75, textureCanvas.width / textureCanvas.height, 0.1, 1000);
	this._camera.position.y = -50;
	this._camera.position.z = 150;
	this._scene.add(this._camera);
	
	this._terrainFeed = undefined;
	
	// Initialize the terrain grid.
	this.grid = new Array(Vis3D.GRID_HEIGHT);
	for (var r = 0; r < this.grid.length; r++) {
		this.grid[r] = new Array(Vis3D.GRID_WIDTH);
		for (var c = 0; c < this.grid[r].length; c++) {
			this.grid[r][c] = 0;
		}
	}
	
	this.update = this.update.bind(this);
	this.update();
	
	return this;
}

Vis3D.GRID_WIDTH = 64;
Vis3D.GRID_HEIGHT = 24;
Vis3D.STEP_TIME = 500; // Milliseconds
Vis3D.CURRENT_HEIGHT_WEIGHT = 0.3;
Vis3D.OTHER_HEIGHT_WEIGHT = 0.7;
Vis3D.MAX_HEIGHT = 10;

Vis3D.prototype = {
	/**
	 * Calculate the new color of a pixel.
	 * @param {Number} r - The row of the pixel
	 * @param {Number} c - The column of the pixel
	 */
	_calculateNewPixel(r, c) {
		var avgOtherHeight = 0;
		
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
				avgOtherHeight += this.grid[wrappedRow][wrappedCol];
			}
		}
		avgOtherHeight /= 8;
		
		return (this.grid[r][c] * Vis3D.CURRENT_HEIGHT_WEIGHT) +
			(avgOtherHeight * Vis3D.OTHER_HEIGHT_WEIGHT);
	},
	
	_updateGrid: function () {
		if (this._terrainFeed) {
			for (var r = this._terrainFeed.row - 2; r <= this._terrainFeed.row + 2; r++) {
				for (var c = this._terrainFeed.col - 2; c <= this._terrainFeed.col + 2; c++) {
					this.grid[r][c] = this._terrainFeed.value * Vis3D.MAX_HEIGHT;
				}
			}
		}
		
		var newGrid = new Array(Vis3D.GRID_HEIGHT);
		for (var r = 0; r < this.grid.length; r++) {
			newGrid[r] = new Array(Vis3D.GRID_WIDTH);
			for (var c = 0; c < this.grid[r].length; c++) {
				newGrid[r][c] = this._calculateNewPixel(r, c);
			}
		}
		this.grid = newGrid;
	},
	
	_updateCanvas: function () {
		// Update terrain.
		for (var i = 0; i < this._mesh.geometry.vertices.length; i++) {
			var row = Math.floor(i / Vis3D.GRID_WIDTH),
				col = i - (row * Vis3D.GRID_WIDTH);
			this._mesh.geometry.vertices[i].z = this.grid[row][col] * Vis3D.MAX_HEIGHT;
		}
		this._mesh.geometry.__dirtyVertices = true;
		this._mesh.geometry.computeFaceNormals();
		this._mesh.geometry.computeVertexNormals();
		this._mesh.geometry.verticesNeedUpdate = true;
		
		// Update texture.
		var that = this;
		this._textureLoader.load(
			this._textureCanvas.toDataURL(),
			function (texture) {
				that._mesh.material = new THREE.MeshBasicMaterial({
					map: texture,
					wireframe: that.wireframe
				});
			}
		);
		
		
		this._renderer.render(this._scene, this._camera);
	},
	
	/**
	 * Add a splash of color in the center of the grid.
	 * @param {Number} polarity
	 * @param {Number} subjectivity
	 */
	setTerrainFeed: function (polarity, subjectivity) {
		this._terrainFeed = {
			row: Math.round(Vis3D.GRID_HEIGHT / 2),
			col: Math.max(2, Math.min(Vis3D.GRID_WIDTH - 3, Math.round(subjectivity * Vis3D.GRID_WIDTH))),
			value: polarity
		};
		console.log(this._terrainFeed);
	},
	
	/**
	 * Remove the color feed.
	 */
	clearTerrainFeed: function () {
		this._terrainFeed = undefined;
	},
	
	update: function () {
		this._updateGrid();
		this._updateCanvas();
		setTimeout(this.update, Vis3D.STEP_TIME);
	}
};
