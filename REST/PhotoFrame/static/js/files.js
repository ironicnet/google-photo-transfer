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


// Loads a list of all albums owned by the logged in user from the backend.
// The backend returns a list of albums from the Library API that is rendered
// here in a list with a cover image, title and a link to open it in Google
// Photos.
function listFolders(parent, up) {
  hideError();
  showLoadingDialog();
  $('#albums').empty();

  const searchParameters = {
    parent
  };
  console.log('Loading folders: ', searchParameters);

  $.ajax({
    type: 'GET',
    url: '/getSharedFolders',
    data: searchParameters,
    dataType: 'json',
    success: (data) => {
      console.log('Loaded folders: ', data);

      hideLoadingDialog();
      showFolders(data.parameters, data.folders, up);
    },
    error: (data) => {
      hideLoadingDialog();
      handleError('Couldn\'t load folders', data);
    }
  });
}
function showFolders(source, folders, up) {
  $('#files-container').empty();

  // Display the length and the source of the items if set.
  if (source && folders) {
    $('#files-count').text(folders.length);
    // $('#files-path').text(JSON.stringify(source));
    const linkToFolder = $('<a />')
    .attr('href', `?folder=${up || ''}`)
    .text(JSON.stringify(source));
    $('#files-path').empty();
    $('#files-path').append(linkToFolder);
  } else {
    $('#files-count').text(0);
    $('#files-path').empty();
    $('#files-path').text('No folder search selected');
  }

  // Show an error message and disable the slideshow button if no items are
  // loaded.
  if (!folders || !folders.length) {
    $('#files_empty').show();
  } else {
    $('#files_empty').hide();
  }

  // Loop over each media item and render it.
  $.each(folders, (i, folder) => {
    // Compile the caption, conisting of the description, model and time.
    const description = folder.name || '';
    const captionText = `${description} (Folder)`

    // Each image is wrapped by a link for the fancybox gallery.
    // The data-width and data-height attributes are set to the
    // height and width of the original image. This allows the
    // fancybox library to display a scaled up thumbnail while the
    // full sized image is being loaded.
    // The original width and height are part of the mediaMetadata of
    // an image media item from the API.
    const container = $('<ul />');
    const linkToFolder = $('<a />')
    .attr('href', `?folder=${folder.id}&up=${source.parent}`)
    .text(captionText);
    // .on('click', (e) => {
    //   e.preventDefault();
    //   listFolders(folder.id);
    // })
    const fileItem = $('<li />')
                        .attr('data-id', folder.id);
    fileItem.append(linkToFolder);
    
    container.append(fileItem);

    // Add the link (consisting of the thumbnail image and caption) to
    // container.
    $('#files-container').append(container);
  });
};
$(document).ready(() => {
  let params = (new URL(document.location)).searchParams;
  let folder = params.get('folder');
  let up = params.get('up');
  // Load the list of albums from the backend when the page is ready.
  listFolders(folder, up);

});
