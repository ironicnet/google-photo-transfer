// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Empties the grid of images.
function clearPreview() {
	showPreview(null, null);
}

// Shows a grid of media items in the photo frame.
// The source is an object that describes how the items were loaded.
// The media items are rendered on screen in a grid, with a caption based
// on the description, model of the camera that took the photo and time stamp.
// Each photo is displayed through the fancybox library for full screen and
// caption support.
function showPreview(source, mediaItems) {
	$('#images-container').empty();

	// Display the length and the source of the items if set.
	if (source && mediaItems) {
		$('#images-count').text(mediaItems.length);
		$('#images-source').text(JSON.stringify(source));
		$('#preview-description').show();
	} else {
		$('#images-count').text(0);
		$('#images-source').text('No photo search selected');
		$('#preview-description').hide();
	}

	// Show an error message and disable the slideshow button if no items are
	// loaded.
	if (!mediaItems || !mediaItems.length) {
		$('#images_empty').show();
		$('#startSlideshow').prop('disabled', true);
	} else {
		$('#images_empty').hide();
		$('startSlideshow').removeClass('disabled');
	}

	// Loop over each media item and render it.
	$.each(mediaItems, (i, item) => {
		// Construct a thumbnail URL from the item's base URL at a small pixel size.
		const thumbnailUrl = getMediaThumbnail(item);
		// Constuct the URL to the image in its original size based on its width and
		// height.
		const fullUrl = `${item.baseUrl}=w${item.mediaMetadata.width}-h${item.mediaMetadata.height}`;

		// Compile the caption, conisting of the description, model and time.
		const captionText = getCaptionText(item);

		// Each image is wrapped by a link for the fancybox gallery.
		// The data-width and data-height attributes are set to the
		// height and width of the original image. This allows the
		// fancybox library to display a scaled up thumbnail while the
		// full sized image is being loaded.
		// The original width and height are part of the mediaMetadata of
		// an image media item from the API.
		const linkToFullImage = $('<a />')
			.attr('href', fullUrl)
			.attr('data-fancybox', 'gallery')
			.attr('data-width', item.mediaMetadata.width)
			.attr('data-height', item.mediaMetadata.height);
		// Add the thumbnail image to the link to the full image for fancybox.
		const thumbnailImage = createThumbnailImage(thumbnailUrl, captionText);
		linkToFullImage.append(thumbnailImage);

		// The caption consists of the caption text and a link to open the image
		// in Google Photos.
		const imageCaption = $('<figcaption />')
			.addClass('hidden')
			.text(captionText);
		const linkToGooglePhotos = $('<a />')
			.attr('href', item.productUrl)
			.text('[Click to open in Google Photos]');
		imageCaption.append($('<br />'));
		imageCaption.append(linkToGooglePhotos);
		linkToFullImage.append(imageCaption);


		const actions = []
		const SelectToggleLabel = $('<label />')
			.attr('class', 'mdl-switch mdl-js-switch mdl-js-ripple-effect')
			.attr('for', `select-${item.id}`);
		const SelectToggleInput = $('<input />')
			.attr('class', 'mdl-switch__input')
			.attr('type', 'checkbox')
			.attr('id', `select-${item.id}`)
			.attr('name', 'photo')
			.attr('value', item.id)
			.attr('checked', false)
			.on('click', function (e) {
				console.log(this, this.checked, this.classList);
				if (this.checked) {
					this.parentElement.parentElement.parentElement.classList.add(
						'selected',
					);
				} else {
					this.parentElement.parentElement.parentElement.classList.remove(
						'selected',
					);
				}
			});
		const SelectToggleSpan = $('<span />').attr('class', 'mdl-switch__label');
		SelectToggleLabel.append(SelectToggleInput).append(SelectToggleSpan);
		actions.push(SelectToggleLabel);

		const media = linkToFullImage;

		const card = createCard(media, actions);
		

		// Add the link (consisting of the thumbnail image and caption) to
		// container.
		$('#images-container').append(card);
	});
}
function createCard(media, actions) {
	const card = $('<div />').attr(
		'class',
		'photo-card mdl-card mdl-shadow--2dp'
	);
	const cardTitle = $('<div />').attr(
		'class',
		'mdl-card__title mdl-card--expand'
	);
	// .attr('style', `background: url('${thumbnailUrl}') center / cover`)
	card.append(cardTitle);
	const cardMedia = $('<div />').attr('class', 'card__media');
	cardMedia.append(media);
	card.append(cardMedia);
	const cardActionsContainer = $('<div />').attr(
		'class',
		'mdl-card__actions'
	);
	card.append(cardActionsContainer);
	const cardName = $('<span />').text();
	cardActionsContainer.append(cardName);
	cardActionsContainer.append(
		$('<div />').attr('class', 'mdl-layout-spacer')
	);
	const cardMenu = $('<div />').attr('class', 'mdl-card__menu');
	actions.forEach(action => {
		cardMenu.append(action);
	});
	card.append(cardMenu);
	return card;
}

function createThumbnailImage(thumbnailUrl, captionText) {
	return $('<img />')
		.attr('src', thumbnailUrl)
		.attr('alt', captionText)
		.addClass('img-fluid rounded thumbnail');
}

/**
 * Compile the caption, conisting of the description, model and time.
 * @param {*} item 
 */
function getCaptionText(item) {
	const description = item.description ? item.description : '';
	const model = item.mediaMetadata.photo.cameraModel
		? `#Shot on ${item.mediaMetadata.photo.cameraModel}`
		: '';
	const time = item.mediaMetadata.creationTime;
	const captionText = `${description} ${model} (${time})`;
	return captionText;
}

/**
 * Construct a thumbnail URL from the item's base URL at a small pixel size.
 * @param {Object} item 
 */
function getMediaThumbnail(item) {
	return `${item.baseUrl}=w256-h256`;
}

function createSubmitDialog(selector) { 
	var dialog = document.querySelector(selector);
	if (!dialog.showModal) {
		dialogPolyfill.registerDialog(dialog);
	}
	dialog.querySelector("button.btnCancel")
		.addEventListener('click', function() {
			dialog.close();
		});
	dialog.querySelector("button.btnUpload")
		.addEventListener('click', function() {
			dialog.close();
		});
	dialog.refresh = function refresh() {
		listFolders('#dialog .file-browser');
		const selected = Array.from(document.querySelectorAll("input[name='photo']:checked").values()).map(el => el.value);
		$.ajax({
			type: 'GET',
			url: '/getSelected',
			dataType: 'json',
			data: {
				ids: selected,
			},
			success: (data) => {
				console.log('Loaded selected.', data);
				const photosContainer = dialog.querySelector(".photo-review");
				$(photosContainer).empty();
				data.photos.forEach(medaiItem => {
					const thumbnailUrl  = getMediaThumbnail(medaiItem);
					const caption = getCaptionText(medaiItem);
					const thumbnail = createThumbnailImage(thumbnailUrl, caption);
					const card = createCard(thumbnail, []);
					$(photosContainer).append(card);
				})
			},
			error: (data) => {
				console.error('Could not load selection', data);
			},
		});
	};

	return dialog;
}

// Makes a backend request to display the queue of photos currently loaded into
// the photo frame. The backend returns a list of media items that the user has
// selected. They are rendered in showPreview(..).
function loadQueue() {
	showLoadingDialog();
	$.ajax({
		type: 'GET',
		url: '/getQueue',
		dataType: 'json',
		success: (data) => {
			// Queue has been loaded. Display the media items as a grid on screen.
			hideLoadingDialog();
			showPreview(data.parameters, data.photos);
			hideLoadingDialog();
			console.log('Loaded queue.');
		},
		error: (data) => {
			hideLoadingDialog();
			handleError('Could not load queue', data);
		},
	});
}

$(document).ready(() => {
	// Load the queue of photos selected by the user for the photo
	loadQueue();

	// Set up the fancybox image gallery.
	$().fancybox({
		selector: '[data-fancybox="gallery"]',
		loop: true,
		buttons: ['slideShow', 'fullScreen', 'close'],
		image: { preload: true },
		transitionEffect: 'fade',
		transitionDuration: 1000,
		fullScreen: { autoStart: false },
		// Automatically advance after 3s to next photo.
		slideShow: { autoStart: true, speed: 3000 },
		// Display the contents figcaption element as the caption of an image
		caption: function (instance, item) {
			return $(this).find('figcaption').html();
		},
	});

	// Clicking the 'view fullscreen' button opens the gallery from the first
	// image.
	// $('#startSlideshow').on('click', (e) =>
	// 	$('#images-container a').first().click(),
	// );

	// Clicking log out opens the log out screen.
	$('#logout').on('click', (e) => {
		window.location = '/logout';
	});

	'use strict';
	var dialog = createSubmitDialog('#dialog');
	var dialogButton = document.querySelector('#startSlideshow');
	dialogButton.addEventListener('click', function() {
		dialog.showModal();
		dialog.refresh();
	});
});
