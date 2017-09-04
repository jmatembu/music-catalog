(function () {
	'use strict';

	let catalog;
	let loading = document.querySelector('.loading');
	let openRequest;
	let db;

	window.addEventListener('DOMContentLoaded', function (event) {

		if ('indexedDB' in window) {

			openRequest = window.indexedDB.open('music');
			
			openRequest.onerror = function (event) {
				console.log(event.target.errorCode);
			}

			openRequest.onupgradeneeded = function (event) {
				
				db = event.target.result;

				if (db.objectStoreNames.contains('albums')) {
					db.deleteObjectStore('albums');
				}

				var albumStore = db.createObjectStore('albums', {
					keyPath: 'album_id'
				});

				getMusic(populateAlbums);

			}

			openRequest.onsuccess = function (event) {
				
				db = event.target.result;
				
				var transaction = db.transaction('albums', 'readonly'),
					albumStore = transaction.objectStore('albums'),
					getRequest = albumStore.getAll();

				getRequest.onsuccess = function (event) {
					catalog = event.target.result;
					loading.classList.add('hidden');
					renderCatalog(catalog);
				}

			}
		}
	
	});	

	/**
	 * Populate the database with albums
	 */
	function populateAlbums() {

		var transaction = db.transaction('albums', 'readwrite');
		var albumStore = transaction.objectStore('albums');

		catalog.forEach(function (album) {
			albumStore.add(album);	
		});

		renderCatalog(catalog);
	}

	function readAlbums() {

	}

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

	function createElement(el, attributes) {
		var element = document.createElement(el);
		setAttributes(element, attributes);

		return element;
	}

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

	function getMusic(callback) {
		console.log('Getting music');
		var req = new XMLHttpRequest();
		var url = 'https://freemusicarchive.org/api/get/albums.json?api_key=CFEFES9JPKBN4T7H';	

		req.onload = function () {
			
			if (req.status === 200 && req.status < 400) {
				catalog = JSON.parse(req.response).dataset;
				callback();
			} else {
				loading.innerHTML = 'Problem loading music archive';
			}

		}
		req.timeout = function () {
			loading.innerHTML = 'Server timed out. Please refresh the page.';
		}
		req.onerror = function () {
			console.log(req.response);
		}

		req.open('GET', url);
		req.send();
	}
}());