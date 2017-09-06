(function () {
	'use strict';

	let catalog;
	let loading = document.querySelector('.loading');
	let openRequest;
	let db;

	window.addEventListener('DOMContentLoaded', () => {

		if ('indexedDB' in window) {
			// Open request to the database
			openRequest = window.indexedDB.open('music');
			// There was an error opening the database
			openRequest.onerror = (event) => {
				console.log(event.target.errorCode);
			}
			// Need to upgrade the database
			openRequest.onupgradeneeded = (event) => {
				
				db = event.target.result;

				// We need a fresh albums store
				if (db.objectStoreNames.contains('albums')) {
					db.deleteObjectStore('albums');
				}
				// So we create it
				db.createObjectStore('albums', {
					keyPath: 'album_id'
				});
				// AJAX request for albums
				getMusic(populateAlbums);

			}

			// There is no need for a database upgrade
			// So we shall just get the albums from the database.
			openRequest.onsuccess = (event) => {
				
				db = event.target.result;
				
				var transaction = db.transaction('albums', 'readonly'),
					albumStore = transaction.objectStore('albums'),
					getRequest = albumStore.getAll(); // All the albums

				getRequest.onsuccess = (event) => {
					catalog = event.target.result;
					loading.classList.add('hidden');
					renderCatalog(catalog); // Show albums on to screen
				}

			}
			
		}
	
	});	

	/**
	 * Populate the database with albums.
	 * This is run only when upgrading the database
	 */
	function populateAlbums() {

		var transaction = db.transaction('albums', 'readwrite');
		var albumStore = transaction.objectStore('albums');

		catalog.forEach((album) => {
			albumStore.add(album);	
		});

		renderCatalog(catalog); // Show albums on screen

	}

	/**
	 * Show albums on screen
	 *
	 * @param {Array} catalog 
	 */
	function renderCatalog(catalog) {

		var catalogWrapperFragment = document.createDocumentFragment(),
			catalogWrapper = document.querySelector('.products .container'),
			ul = createElement('ul', { class: 'store' });

		catalog.forEach(function (album) {

			var albumFragment = document.createDocumentFragment(),
				li = createElement('li', {}),
				h3 = createElement('h3', {}),
				div = createElement('div', {});
			
			h3.innerHTML = album.album_title;
			div.innerHTML = album.album_information;
			li.appendChild(h3);
			li.appendChild(div);
			albumFragment.appendChild(li);
			ul.appendChild(albumFragment);
			catalogWrapperFragment.appendChild(albumFragment);

		});

		ul.appendChild(catalogWrapperFragment)
		catalogWrapper.appendChild(ul);

	}

	/**
	 * Create an element with specified attributes
	 *
	 * @param {String} el 
	 * @param {Object} attributes 
	 */
	function createElement(el, attributes) {

		var element = document.createElement(el);
		setAttributes(element, attributes);

		return element;

	}

	/**
	 * Set attributes on element
	 *
	 * @param {Node} element 
	 * @param {Object} attributes 
	 */
	function setAttributes(element, attributes) {
		
		if (!element instanceof Node) {
			throw element + ' is not of Node type';
		}

		if (typeof attributes !== 'object') {
			throw attributes + ' is not an object';
		}

		for (var attr in attributes) {
			element.setAttribute(attr, attributes[attr]);
		}

	}

	/**
	 * Get music from API
	 *
	 * @param {Function} callback 
	 */
	function getMusic(callback) {

		var req = new XMLHttpRequest();
		var url = 'https://freemusicarchive.org/api/get/albums.json?api_key=CFEFES9JPKBN4T7H';	

		req.onload = () => {
			
			if (req.status === 200 && req.status < 400) {
				catalog = JSON.parse(req.response).dataset;
				callback();
			} else {
				loading.innerHTML = 'Problem loading music archive';
			}

		}
		req.timeout = () => {
			loading.innerHTML = 'Server timed out. Please refresh the page.';
		}
		req.onerror = () => {
			console.log(req.response);
		}

		req.open('GET', url);
		req.send();
	}
}());