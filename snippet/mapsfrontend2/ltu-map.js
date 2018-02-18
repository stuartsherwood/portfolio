/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
function detectIE() {
  var ua = window.navigator.userAgent;

  // Test values; Uncomment to check result …

  // IE 10
  // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
  
  // IE 11
  // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
  
  // Edge 12 (Spartan)
  // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
  
  // Edge 13
  // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

  var msie = ua.indexOf('MSIE ');
  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  }

  var trident = ua.indexOf('Trident/');
  if (trident > 0) {
    // IE 11 => return version number
    var rv = ua.indexOf('rv:');
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
  }

  var edge = ua.indexOf('Edge/');
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
  }

  // other browser
  return false;
}




var map = document.getElementById('ltu-map');
var element = document.createElement('script');
element.src = '//maps.googleapis.com/maps/api/js?&sensor=false&&libraries=places,geometry&callback=ready';
//element.src = '//maps.googleapis.com/maps/api/js?key=AIzaSyDBREq0y8RtbkyRjZxC_-zeNgJnCd-TfNY&sensor=false&&libraries=places,geometry&callback=ready'
map.appendChild(element);

// Default map
function ready(){
    initialiseMap('ltu-map','BU',function() {});
	if(typeof editMode == 'boolean') {
		if(editMode) {
			initialiseEditor('ltu-map');
		}
	}
}

/* Have to load maps for the following environments
 - Portal: insert js
 - Matrix: nested content
 - LTU application: insert js

 Must be able to override default map via each of the following:
 - campus
 - building by building id
 - street address
 - location by matrix map id eg: http://wwwdev.latrobe.edu.au/google-map-locations?mapID=234464
*/

var isIE = false;
var onloadedAction = null;
var apiEndpoint = '//wwwdev.latrobe.edu.au/maps/api/';
var outerContainer;
var map;
var campusCode;
var currentCampus;
var markerContent;
var groups = [];
var locations = [];
var locationPointers = {};
var amenities = {};
var paths = {};
var constructions = [];
var retrievedLocations = {};
var amenityOptions = {};
var searchables;
var firstLabel = true;
var mapInitialised = false;
var overlayLoaded = false;
var selectedGroup;
var mousedGroup;
var selectedLocationIndex;
var mousedLocationIndex;
var selectedAmenityType;
var selectedPath;
var selectedType;
var selectedAmenityIndex = null;
var svgDiv;
var emptyItemIdentifier = '_NOTSET_';
var colours = {
	transparent: 'rgba(0,0,0,0)',
	highlight: {fillColor: '#ff9e1b', strokeColor: 'black'},
	teaching: {fillColor: '', strokeColor: ''},
	research: {fillColor: '', strokeColor: ''},
	residential: {fillColor: '', strokeColor: ''},
	retail: {fillColor: '', strokeColor: ''},
	sports: {fillColor: '', strokeColor: ''},
	administration: {fillColor: '', strokeColor: ''},
	parking: {fillColor: 'rgba(0,0,0,0)', strokeColor: 'black'},
	sanctuary: {fillColor: 'rgba(0,0,0,0)', strokeColor: 'black'},
	construction: {fillColor: '#ffff00', fillOpacity: 0.8, strokeColor: '#ffff00'},
	building: {fillColor: '#fff', strokeColor: 'black'}
};
var campuses = {
	BU: {lat: -37.720727, lng: 145.048395, name: 'Melbourne', site_id: 'MELBOURNE', loaded: false, geojson: null},
	AW: {lat: -36.111335, lng: 146.848782, name: 'Albury-Wodonga', site_id: 'ALWOD', loaded: false, geojson: null},
	BE: {lat: -36.780395, lng: 144.299492, name: 'Bendigo', site_id: 'BENDIGO', loaded: false, geojson: null},
	CC: {lat: -37.8163556, lng: 144.9622697, name: 'City', site_id: 'CITY CENTRE', loaded: false, geojson: null},
	CF: {lat: -37.8097000, lng: 144.9576200, name: 'Franklin Street', site_id: 'FRANKLIN ST', loaded: false, geojson: null},
	MI: {lat: -34.203942,lng: 142.167373, name: 'Mildura', site_id: 'MILDURA', loaded: false, geojson: null},
	SH: {lat: -36.380378,lng: 145.406413, name: 'Shepparton', site_id: 'SHEPTON', loaded: false, geojson: null}
};
var mapControls =   '<div id="ltu_map_container" class="map-container"></div>'+
                    '<div id="controls">'+
                        '<input id="find" class="icon" type="image" src="icons/search.svg" alt="Find locations" height="48" width="48" />'+
	'<select class="map-select" id="campus-select" onchange="changeCampus(this.value);" title="Change campus"></select>'+
                    '</div>'+
				    '<div id="close-icon"><input id="close-drawer" class="icon" type="image" src="img/arrow-2-left.svg" alt="Close search" height="48" width="48" /></div><div id="drawer">'+
						'<div class="building-filter">'+
						  '<label class="off-screen" for="filter-locations">Find</label><input type="text" onsearch="updateLocationResults();" id="filter-locations" class="filter" placeholder="Building or location name"><input class="icon" id="close-info" type="image" alt="Clear search filter" src="icons/delete.svg" height="48" width="48" />'+
						  '<ul id="location-list" aria-live="polite" aria-atomic="true"></ul>'+
                        '</div>'+
    				    '<div class="building-info">'+
								'<img class="building-image" id="building-image" alt="" />'+
								'<div class="building-controls"><select class="map-select" id="rooms" title="Select room"></select>'+
                                '</div>'+
				        '</div>'+
                        '<div id="svgDiv" class="hidden" ></div>'+
                    '</div>'+
                    '<div id="floorplan-wrapper"><h2 id="floorplan-header" tabindex="-1">Floorplan</h2><input id="close-floorplan" class="icon" type="image" src="icons/delete.svg" alt="Close floorplan" height="48" width="48" /><div id="floorplan-content"></div></div>';
var amenityIcon = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="32" height="32" viewBox="0 0 55 55" enable-background="new 0 0 55 55" xml:space="preserve"><g style="opacity:0.7" id="Pin"><g><path fill-rule="evenodd" clip-rule="evenodd" fill="#404041" d="M27.258,3.096c-9.848,0-18.472,7.982-18.472,17.83 c0,7.816,13.347,24.916,17.203,29.695h2.173c4.012-4.742,17.808-21.625,17.808-29.695C45.97,11.078,37.106,3.096,27.258,3.096z M27.377,28.24c-3.883,0-7.029-3.146-7.029-7.029c0-3.881,3.146-7.029,7.029-7.029c3.882,0,7.029,3.148,7.029,7.029 C34.406,25.094,31.259,28.24,27.377,28.24z"/></g></g></svg>';
var placeholderBuilding;
var placeholderParking;

function selectGroup(group,scroll) {
	if(selectedAmenityType!=null) {
		toggleAmenity(selectedAmenityType,false);
	}
	selectedType = 1;
	if(selectedGroup==group) {
		outerContainer.classList.add('show-building-info');
		return false;
	}
	unselectItems();
	selectedGroup = group;
	groups[selectedGroup].marker.setIcon(encodeSvg(getTextSvg('group',mousedGroup==selectedGroup,true,groups[selectedGroup].text,groups[selectedGroup].text)));
	displayGroupInfo(group);
	panToMarker('group',group,scroll);
	outerContainer.classList.add('show-building-info');
}

function selectLocation(locationIndex,scroll) {
	if(selectedAmenityType!=null) {
		toggleAmenity(selectedAmenityType,false);
	}
	selectedType = 2;
	if(selectedLocationIndex==locationIndex) {
		outerContainer.classList.add('show-building-info');
		return false;
	}
	unselectItems();
	selectedLocationIndex = locationIndex;
	locations[locationIndex].marker.setIcon(encodeSvg(getTextSvg(locations[locationIndex].type,mousedLocationIndex==selectedLocationIndex,true,locations[locationIndex].name,locations[locationIndex].code)));
	var location = locations[locationIndex];
	if(retrievedLocations[campusCode].hasOwnProperty(location.code)) {
		displayLocationInfo(locationIndex,scroll);
	}
	else {
		xhr('GET','json','room/' + campusCode + '/' + location.code, function(data) {
				retrievedLocations[campusCode][location.code] = data;
				displayLocationInfo(locationIndex,scroll);
			},
			function() {
				retrievedLocations[campusCode][location.code] = {};
				displayLocationInfo(locationIndex,scroll);
			}
		);
	}
	panToMarker(location.type,locationIndex,scroll);
	outerContainer.classList.add('show-building-info');
}

function updateLocationResults() {
	var query = document.getElementById('filter-locations').value;
	var locationList = document.getElementById('location-list');
	query = query.toLowerCase();
	for(var i=0;i<searchables.length;++i) {
		var j = searchables[i].index;
		switch(searchables[i].type) {
			case 1:
				var text = groups[j].text;
				if(text.toLowerCase().indexOf(query)!=-1 || text.toLowerCase().indexOf(query)!=-1) {
					document.getElementById(j).classList.remove('hidden');
				}
				else {
					document.getElementById(j).classList.add('hidden');
				}
				break;
			case 2:
				var code = locations[j].code;
				var text = locations[j].name;
				if(code.toLowerCase().indexOf(query)!=-1 || text.toLowerCase().indexOf(query)!=-1) {
					document.getElementById(locations[j].type+j).classList.remove('hidden');
				}
				else {
					document.getElementById(locations[j].type+j).classList.add('hidden');
				}
				break;
			case 3:
				var code = j;
				var text = amenityOptions[j].text;
				if(text.toLowerCase().indexOf(query)!=-1) {
					document.getElementById(code).classList.remove('hidden');
				}
				else {
					document.getElementById(code).classList.add('hidden');
					outerContainer.classList.remove('show-building-info');
				}
				break;
			case 4:
				var code = searchables[i].amenity+j;
				if(amenityOptions[searchables[i].amenity].text.toLowerCase().indexOf(query)!=-1 || amenities[searchables[i].amenity][j].text.toLowerCase().indexOf(query)!=-1) {
					document.getElementById(code).classList.remove('hidden');
				}
				else {
					document.getElementById(code).classList.add('hidden');
					outerContainer.classList.remove('show-building-info');
				}
				break;
			case 5:
				if(paths[j].text.toLowerCase().indexOf(query)!=-1) {
					document.getElementById(j).classList.remove('hidden');
				}
				else {
					document.getElementById(j).classList.add('hidden');
					outerContainer.classList.remove('show-building-info');
				}
		}
	}
	for(var i=0;i<locations.length;++i) {
		var code = locations[i].code;
	};
	var locationListNodes = document.getElementById('location-list').childNodes;
	for(var i=0;i<locationListNodes.length;++i) {
		locationListNodes[i].classList.remove('show-building-info');

	}
}

function initialiseMap(divElement,campus,callback) {
	isIE = detectIE();
	if(typeof campus==='undefined') {
		document.getElementById(divElement).insertAdjacentHTML('beforeend','<p class="alert">No campus code specified.</p>');
		return false;
	}
	campusCode = campus;
	if(!campuses.hasOwnProperty(campusCode)) {
		document.getElementById(divElement).insertAdjacentHTML('beforeend','<p class="alert">Invalid campus code specified.</p>');
		return false;
	}
	if(!mapInitialised) {
		outerContainer = document.getElementById(divElement);
		map.insertAdjacentHTML('beforeend',mapControls);
		map = new google.maps.Map(document.getElementById('ltu_map_container'), {
			center: {lat:campuses[campusCode].lat,lng:campuses[campusCode].lng},
			scrollwheel: true,
			disableDefaultUI: true,
			scaleControl: true,
			panControl: true,
			panControlOptions: {
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			},
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			},
			streetViewControl: true,
			streetViewControlOptions: {
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			},
			zoom: 17,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
		});
		map.set('styles', [
			{
				featureType: 'poi',
				elementType: 'labels',
				stylers: [
					{ visibility: 'off' }
				]
			}
		]);
		map.addListener('zoom_changed', zoomChanged);
		mapInitialised = true;
		renderMapControls(divElement);
		initialiseKeyboardAccessibility();
		placeholderBuilding = encodeSvg('<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360 240" enable-background="new 0 0 360 240" xml:space="preserve"><rect y="159.8" fill="#CCCCCC" width="360" height="80.2"/><polygon fill="#CCCCCC" points="43,157.2 51.3,157.2 51.3,56.1 43,63.1 "/><polygon fill="#666666" points="51.3,56.1 222.2,91 222.2,157.2 51.3,157.2 "/><polygon fill="#CCCCCC" points="254.5,98.7 200.5,85.8 200.5,162 254.5,162 "/><polygon fill="#666666" points="235,65.8 140,33.8 140,150.6 235,157.2 "/><polygon fill="#CCCCCC" points="140,33.8 62.6,69.6 62.6,151 140,151 "/><polygon fill="#808080" points="243.8,126 162.4,116.6 162.4,150.4 243.8,153.9 "/><polygon fill="#B3B3B3" points="154.5,153.8 162.4,153.8 162.4,116.6 154.5,117.9 "/><polygon fill="#E6E6E6" points="83.8,165 0,211.4 0,240 175.2,240 130,165.8 "/><polygon fill="#808080" points="114.3,121 79.3,127.3 80.3,151.3 114.7,151.3 "/><polygon fill="#4D4D4D" points="262,154.4 100.9,147.9 100.9,174.7 262,166.7 "/><polygon fill="#B3B3B3" points="33.5,152 33.5,169.6 100.9,174.7 100.9,147.9 41.7,152 "/><path fill="#333333" d="M314.3,240.6c0,0,6.5-49.8,6.5-51.4c0-1.6-5.8-35.6-5.2-39.2s0.6-29.3,0.4-30.8c-0.2-1.6-1.8-38.5-1.8-38.5s-22-27.4-22.6-28.2s-22.3-1.7-23.2-3.2c-0.8-1.6-6.2-17.4-6.2-20.2s-18.8-11.6-19.4-13.2c-0.6-1.6-17.8-9.4-18-10.2c-0.2-0.8-3.4-5.6-3.4-5.6h4.2l9.4,6l9.4,3.6l1.8-4.2L245,0h2.2l2.4,6.6l4.8,11.8l12,6.1l7,17l6.2,1l5.8-3.8c0,0,5.8-14.4,6-16.8s-5.8-10.1-5.8-10.1L285,3.1L281.8,0h4.2l3.8,3.6l1.4,7.2l7,11.8l-6,21.8L307.8,61l13,6.6l11.4-11.8c0,0,8.4-14.4,9-16.8c0.6-2.4,2.6-15.6,4.6-18.6c1.9-3,2.6-8.4,3-9.4s7-7.2,7-7.2l0.7-3.8h3.6v7.2l-5.4,4.6l-1.4,5l-2.2,9.5l4.8,0.1h4.2V30l-4.6,0.7l1.8,2.9h2.6v3.6l-4.6-2.2l-2.2-3.4l-2.2,4.2l1.2,10.8l-7.8,13.4l-12.6,19.8l-5,13l3.6,31.8c0,0,1.8,13.8,1.8,14.6s2.4,20.6,2.4,20.6l3,24.6l2.2,18.6l3.8,15.4l5.4,17l1.4,4.2L314.3,240.6z"/><path fill="#333333" d="M180,0c0.8,4.8,5.8,3.6,7.1,8.4c1.3,4.8-7.9,6.8,1.3,10.8s15.8,9.2,19.3,3.2c3.5-6,3.1-5.2,5.3-9.6c2.2-4.4-0.8-8.8,3.1-9.6c4-0.8,4.2,8.8,5.9,8.6c18.8-2.2,5-15.4,11.6-3.8c6.6,11.5,7.4,12.8,15,11.6c7.6-1.2,5.8-2.4,14-5.6c8.3-3.2,5.3-6.8,14.2-6.8c8.9,0,5.3-2,15,1.2c9.7,3.2,10.6,2.4,19.8,0.8c9.2-1.6,4.8-5.6,11.4-1.6c6.6,4.1,6.6,3.6,10.1,6.4c3.5,2.8,8.4,2,14,2c5.8,0,5.6,2.4,0,3.2c-28.3,4-7.1,15.4-5.8,17.8c1.3,2.4,18.6,6.4,18.6,6.4v-44L162.7,0c0,0,1.7,3.7,4.6,3.6C174.7,3.2,180,0,180,0z"/><polygon fill="#E6E6E6" points="133.8,180 129.3,173.7 262.6,165.7 272.8,166.7 "/><polygon fill="#E6E6E6" points="70.4,177.3 23.8,169.3 33.3,169 78.3,173.3 "/><polygon fill="#E6E6E6" points="101.2,175.1 116.7,176 262,154.4 246.7,154 "/><polygon fill="#E6E6E6" points="33.5,152 93.5,175 99.8,174.7 42,152.2 "/></svg>').url;
		placeholderParking = encodeSvg('<?xml version="1.0" encoding="utf-8"?><svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 360 240" enable-background="new 0 0 360 240" xml:space="preserve"><rect y="159.8" fill="#CCCCCC" width="360" height="80.2"/><polygon fill="#E6E6E6" points="86.8,159.6 0,211.4 0,240 175.2,240 145.4,195.6 358.5,195.5 358.5,176 132.4,176.2 121.2,159.6 "/><path fill="#666666" d="M0,96.9l2.4,1.5l3.3,1.3l0.6-1.5l-0.4-1.9h0.8l0.8,2.3l1.7,4.1l4.2,2.1l2.4,5.9l2.2,0.3l2-1.3 c0,0,2-5,2.1-5.9c0.1-0.8-2-3.5-2-3.5l-0.2-3l-1.1-1.1h1.5l1.3,1.3l0.5,2.5l2.4,4.1l-2.1,7.6l5.4,5.8l4.5,2.3l4-4.1 c0,0,2.9-5,3.1-5.9c0.2-0.8,0.9-5.4,1.6-6.5c0.7-1,0.9-2.9,1-3.3c0.1-0.3,2.4-2.5,2.4-2.5l0.3-1.3H46v2.5l-1.9,1.6l-0.5,1.8 l-0.8,3.3l1.7,0H46v1.3l-1.6,0.3l0.6,1H46v1.3l-1.6-0.8l-0.8-1.2l-0.8,1.5l0.4,3.8l-2.7,4.7l-4.4,6.9l-1.8,4.5l1.3,11.1 c0,0,0.6,4.8,0.6,5.1s0.8,7.2,0.8,7.2l1,8.6l0.8,6.5l1.3,5.4l1.9,5.9l0.5,1.5c0,0-3.6,1.9-6.7,2.2c-3,0.3-5.9-1.9-5.9-1.9 s2.3-17.4,2.3-17.9c0-0.5-2-12.4-1.8-13.7c0.2-1.3,0.2-10.2,0.1-10.7S30,124.4,30,124.4s-7.7-9.5-7.9-9.8c-0.2-0.3-7.8-0.6-8.1-1.1 c-0.3-0.5-2.2-6.1-2.2-7s-6.6-4.1-6.8-4.6C5,101.5,1.8,99.9,0,99L0,96.9z"/><path fill="#666666" d="M0,100c3.3-1.4,0-4.3,2-0.8c2.3,4,2.6,4.5,5.2,4.1c2.6-0.4,2-0.8,4.9-2c2.9-1.1,1.8-2.4,4.9-2.4 s1.8-0.7,5.2,0.4c3.4,1.1,3.7,0.8,6.9,0.3s1.7-2,4-0.5c2.3,1.4,2.3,1.3,3.5,2.2c1.2,1,2.9,0.7,4.9,0.7c2,0,2,0.8,0,1.1 c-9.9,1.4-2.5,5.4-2,6.2c0.5,0.8,6.5,2.2,6.5,2.2s17-1.8,21-6.5s12.7-7,10-14.3c-2.7-7.3,4-17-3.3-20.3c-7.3-3.3-10,0-20-1.7 C43.7,67,41,60,33,59.7c-8-0.3-15.3,2-22,5.3c-3,1.5-6.8,1.9-11,2.2L0,100z"/><g><rect x="230.5" y="162.5" fill="#999999" width="23.1" height="77.5"/><g><path fill="#4D4D4D" d="M296.3,165c0,3.3-2.7,6-6,6h-96.5c-3.3,0-6-2.7-6-6V41c0-3.3,2.7-6,6-6h96.5c3.3,0,6,2.7,6,6V165z"/></g><g><path fill="#FFFFFF" d="M230.8,92.5V115h-13.2V51h25c3.8,0,7.2,0.5,10.1,1.6c3,1.1,5.5,2.5,7.6,4.4c2.1,1.9,3.6,4.1,4.7,6.7 s1.6,5.4,1.6,8.5c0,3.1-0.5,5.9-1.6,8.4c-1.1,2.5-2.7,4.6-4.7,6.4c-2.1,1.8-4.6,3.1-7.6,4.1c-3,1-6.3,1.4-10.1,1.4H230.8z M230.8,81.8h11.8c1.9,0,3.5-0.2,4.9-0.7c1.4-0.5,2.5-1.1,3.3-2c0.9-0.8,1.5-1.8,1.9-3c0.4-1.2,0.6-2.4,0.6-3.8 c0-1.4-0.2-2.7-0.6-4s-1-2.4-1.9-3.4c-0.9-1-2-1.8-3.3-2.4c-1.4-0.6-3-0.9-4.9-0.9h-11.8V81.8z"/></g><polygon fill="#FFFFFF" points="271.4,143.1 247.8,129.4 249.8,138 213,138 213,148 249.8,148 247.8,156.7"/></g></svg>').url;
		if(callback) {
			onloadedAction = callback;
		}
		xhr('GET','json','category/all', loadAmenities,
			function() {
				console.log('Error: could not retrieve amenity icon data.');
				getCampusData(campusCode,loadCampusFromGeojson);
			}
		);
	}
}

/**
This function initialises keyboard accessibility for the map. Code courtesy of Pierre Frederiksen at Vision Australia.
http://www.visionaustralia.org/digital-access-googlemap
*/
function initialiseKeyboardAccessibility() {
	var hPan = Math.floor(outerContainer.offsetHeight/3);
	var wPan = Math.floor(outerContainer.offsetWidth/3);
	var googListener = google.maps.event.addListener(map, 'tilesloaded', function() {
		var titles = {"zoom in":1,"zoom out":1,"show street map":1,"show satellite imagery":1};
		var divs = outerContainer.getElementsByTagName("div");
		for(var i=0,el;el=divs[i];i++) {

			var title = el.getAttribute("title")
			if(title) title=title.toLowerCase().trim();
			if(title in titles) {
				el.setAttribute("tabindex","0");
				el.setAttribute("role","button");
				el.setAttribute("aria-label",title);
				el.addEventListener("keydown", function(ev){
					var key = ev.keyCode || ev.which;
					if(key == 13 || key == 32){
						var event = document.createEvent('HTMLEvents');
						event.initEvent('click', true, false);
						this.dispatchEvent(event);

					}else if(key==40) {//down
						map.panBy(0, wPan);
					}else if(key==38) {//up
						map.panBy(0, -wPan);
					}else if(key==37) {//left
						map.panBy(-hPan, 0);
					}else if(key==39) {//right
						map.panBy(hPan, 0);
					}else{
						return
					}
					ev.preventDefault();
				});

				(function(el){
					var mo = false;
					var bo = el.style.border;
					var ma = el.style.margin;
					var bc = el.style.backgroundColor;
					var op = el.style.opacity;

					el.addEventListener("mouseover",(function(){mo=true;}));
					el.addEventListener("mouseout",(function(){mo=false;}));

					el.addEventListener("focus",(function(){
						if(mo)return;
						el.style.border ="2px solid blue";
						el.style.margin="-2px";
						el.style.backgroundColor = "transparent";
						el.style.opacity = "1";
					}));
					el.addEventListener("blur",(function(){
						el.style.border = bo;
						el.style.margin= ma;
						el.style.backgroundColor = bc;
						el.style.opacity = op;
					}));
				})(el);
			}
		}
		google.maps.event.removeListener(googListener);
	});
}

function loadAmenities(data) {
	for(var i=0;i<data.length;++i) {
		var amenity = data[i];
		if(['building','parking'].indexOf(amenity.code)==-1) {
			amenityOptions[amenity.code] = {colour: amenity.color, display: amenity.display, text: amenity.name};
		}
	}
	for(var amenity in amenityOptions) {
		if(amenityOptions.hasOwnProperty(amenity)) {
			while(svgDiv.hasChildNodes()) {
				svgDiv.removeChild(svgDiv.lastChild);
			}
			svgDiv.insertAdjacentHTML('beforeend',amenityIcon);
			svgDiv.firstElementChild.getElementsByTagName('path')[0].setAttribute('fill',amenityOptions[amenity].colour);
			amenityOptions[amenity].svg = encodeSvg(svgDiv.innerHTML);
			amenities[amenity] = [];
		}
	}
	getCampusData(campusCode,loadCampusFromGeojson);
}

/*
	This function generates an ordered array of pointers to searchable items: it adds index information about locations, location groups, amenities, amenity types and any other
	type of searchable item that should appear in the search list. It essentially creates an array of pointers of the form {type, index}. The type is an enumerable integer corresponding to
	the particular item type, as follows:
	- 1 = location_group
 	- 2 = location
 	- 3 = amenity_group
 	- 4 = amenity
	- 5 = path
	After the list is populated, the indexes are sorted alphabetically in terms of the searchable text / search 'term', so that the list is displayed in alphabetical order.
*/
function generateSearchablesList() {
	searchables = [];
	//location groups here
	for(group in groups) {
		if(groups.hasOwnProperty(group)) {
			searchables.push({type: 1, index: group});
		}
	}
	for(var i=0;i<locations.length;++i) {
		searchables.push({type: 2, index: i});
	}
	for(amenity in amenities) {
		if(amenities[amenity].length || typeof editMode === 'boolean') {
			searchables.push({type: 3, index: amenity});
			for(var i=0;i<amenities[amenity].length;++i) {
				searchables.push({type: 4, index: i, amenity: amenity});
			}
		}
	}
	for(path in paths) {
		searchables.push({type: 5, index: path});
	}
	searchables.sort(function(a,b) {
		var nameA, nameB;
		switch(a.type) {
			case 1:
				nameA = groups[a.index].text;
				break;
			case 2:
				nameA = locations[a.index].name;
				break;
			case 3:
				nameA = amenityOptions[a.index].text;
				break;
			case 4:
				nameA = amenityOptions[a.amenity].text + ' - ' + amenities[a.amenity][a.index].text;
				break;
			case 5:
				nameA = paths[a.index].text;
				break;
		}
		switch(b.type) {
			case 1:
				nameB = groups[b.index].text;
				break;
			case 2:
				nameB = locations[b.index].name;
				break;
			case 3:
				nameB = amenityOptions[b.index].text;
				break;
			case 4:
				nameB = amenityOptions[b.amenity].text + ' - ' + amenities[b.amenity][b.index].text;
				break;
			case 5:
				nameB = paths[b.index].text;
				break;
		}
		nameA = nameA.toLowerCase()
		nameB = nameB.toLowerCase()
		if(nameA < nameB) {
			return -1;
		}
		else if(nameA > nameB) {
			return 1;
		}
		else {
			return 0;
		}
	});
}

// This code removes all DOM elements of the searchable list, then repopulates this list from the searchables pointer array. This must be done whenever the data for a particular campus
// is loaded.
function repaintSearchables() {
	var locationList = document.getElementById('location-list');
	while(locationList.lastChild) {
		locationList.removeChild(locationList.lastChild);
	}
	for(var i=0;i<searchables.length;++i) {
		var j = searchables[i].index;
		switch(searchables[i].type) {
			case 1:
				locationList.insertAdjacentHTML('beforeend',
					'<li id="'+j+'" class="building">'
					+ '<button class="building-title" onclick="selectGroup(\''+j+'\',false)" onkeydown="selectGroup(\''+j+'\',false)">'+groups[j].text + '</button>'
					+ '</li>');
				break;
			case 2:
				var codeText = locations[j].code.indexOf(emptyItemIdentifier)==-1 ? (' (' + locations[j].code +')') : '';
				locationList.insertAdjacentHTML('beforeend',
					'<li id="'+locations[j].type+j+'" class="building">'
					+ '<button class="building-title" onclick="selectLocation('+j+',false)">'+locations[j].name + codeText + '</button>'
					+ '</li>');
				break;
			case 3:
				locationList.insertAdjacentHTML('beforeend',
					'<li id="'+j+'" class="building">'
					+ '<button class="building-title" onclick="selectAmenityGroup(\''+j+'\')">'+amenityOptions[j].text+' (All)</button>'
					+ '</li>');
				break;
			case 4:
				locationList.insertAdjacentHTML('beforeend',
					'<li id="'+searchables[i].amenity+j+'" class="building">'
					+ '<button class="building-title" onclick="selectAmenity(\''+searchables[i].amenity+'\','+j+',false)">' + amenityOptions[searchables[i].amenity].text + ' - ' + amenities[searchables[i].amenity][j].text +'</button>'
					+ '</li>');
				break;
			case 5:
				locationList.insertAdjacentHTML('beforeend',
					'<li id="'+j+'" class="building">'
					+ '<button class="building-title" onclick="selectPath(\''+j+'\');">'+paths[j].text+'</button>'
					+ '</li>');
				break;
		}
	}
}

// This function renders the map control DOM elements and assigns appropriate event handlers to them.
function renderMapControls(divElement) {
	svgDiv = document.getElementById('svgDiv');
	var find = document.getElementById('find');
	var filter = document.getElementById('filter-locations');
	var close = document.getElementById('close-drawer');
	var locationList = document.getElementById('location-list');
	for(var campus in campuses) {
		if(campuses.hasOwnProperty(campus)) {
			document.getElementById('campus-select').insertAdjacentHTML('beforeend','<option value="' + campus + '">' + campuses[campus].name + ' campus</option>');
		}
	}
	find.addEventListener('click', function(){
		openDrawer();
		var filter = document.getElementById('filter-locations');
		close.focus();
	});
	close.addEventListener('click', function(){
		closeDrawer();
        find.focus();
	});
	document.getElementById('close-info').addEventListener('click', closeInfo);
	filter.addEventListener('keyup', filterKeyup, false);
	document.getElementById('rooms').addEventListener('change', function(){
		var roomList = document.getElementById('rooms');
		switch(selectedType) {
			case 1:
				if(roomList.selectedIndex!=0) {
					map.setZoom(18);
					selectLocation(roomList.options[roomList.selectedIndex].value,true);
				}
				break;
			case 2:
				var roomInfo = JSON.parse(roomList.options[roomList.selectedIndex].value);
				generateFloorplan(campusCode,roomInfo.floor,roomInfo.floorText,roomInfo.roomCode,roomInfo.roomText);
				break;
			case 3:
			case 4:
				if(roomList.selectedIndex==0) {
					selectAmenityGroup(selectedAmenityType);
				}
				else {
					selectAmenity(selectedAmenityType,roomList.selectedIndex-1,false);
				}
		}
	});
	document.getElementById('close-floorplan').addEventListener('click', function(){
		outerContainer.classList.remove('show-floorplan');
        document.getElementById('rooms').focus();
	});
	// Hide 404 images
	var buildingImg = document.getElementById('building-image');
	buildingImg.onerror = function () {
		switch(selectedType) {
			case 2:
				buildingImg.src = locations[selectedLocationIndex].type=='parking' ? placeholderParking : placeholderBuilding;
				break;
			case 3:
			case 4:
				buildingImg.src = 'img/' + selectedAmenityType + '-placeholder.svg';
				break;
			default:
				buildingImg.src = placeholderBuilding;
		}
	}
}

/**
	This is the callback function called when a keyup event is fired on the search filter. It checks whether the key pressed was a tab, and if not will call
	updateLocationResults() to filter the search results according to the query.
*/
function filterKeyup(e) {
	if(e.keyCode!=9) {
		updateLocationResults();
	}
}

/**
	This function closes the information box for the selected item. It is the event handler for the click event on the search bar clear button.
*/
function closeInfo() {
	var buildingImg = document.getElementById('building-image');
	outerContainer.classList.remove('show-building-info');
	document.getElementById('filter-locations').value = '';
    document.getElementById('filter-locations').focus();
	var buildings = document.querySelectorAll('.building');
	for(var i=0;i<buildings.length;++i) {
		buildings[i].classList.remove('hidden');
	}
    document.getElementById('rooms').classList.add('hidden');
	unselectItems();
	selectedAmenityType = null;
	selectedAmenityIndex = null;
	repaintAmenities();
}

// Accepts a path identifier parameter, then toggles that path's visibility on the map. If the path is currently visible, it is removed from the map, and vice versa. This call
// merely changes the value of the display property of the particular path, then simply calls renderPath() to actually perform the functionality of making the path visible/invisible.
function togglePathVisibility(path) {
	paths[path].display = !paths[path].display;
	renderPath(path);
}

// Accepts a path identifier parameter and a boolean, then sets that path to be visible or invisible based on the value of the boolean. This call
// merely changes the value of the display property of the particular path, then simply calls renderPath() to actually perform the functionality of making the path visible/invisible.
function changePathVisibility(path,option) {
	paths[path].display = option;
	renderPath(path);
}

function renderPath(path) {
	paths[path].path.setMap(map.getZoom()>=15 && paths[path].display ? map : null);
	for(var i=0;i<paths[path].points.length;++i) {
		paths[path].points[i].setIcon(encodeSvg(map.getZoom()>=15 && paths[path].display ? getPathpointIcon(path,paths[path].points[i].text) : null));
	}
}

function toggleAmenity(type,mode) {
    if(amenities.hasOwnProperty(type)) {
		if(typeof mode === 'boolean') {
			amenityOptions[type].display = mode;
		}
		else {
			amenityOptions[type].display = !amenityOptions[type].display;
		}
		for(var i=0;i<amenities[type].length;++i) {
			amenities[type][i].marker.setMap(amenityOptions[type].display ? map : null);
		}
	}
}

function openDrawer() {
    outerContainer.classList.add('open-drawer');
}

function closeDrawer() {
    outerContainer.classList.remove('open-drawer');
}

function displayGroupInfo(group) {
	document.getElementById('filter-locations').value = groups[group].text;
	updateLocationResults();
	var buildingImg = document.getElementById('building-image');
	buildingImg.src = placeholderBuilding;
//    buildingImg.src = ''; // NEED TO HAVE AN IMAGE URL FOR GROUPS!!!
	buildingImg.alt = groups[group].text;
    buildingImg.classList.remove('hidden');
	var roomList = document.getElementById('rooms');
	while(roomList.lastChild) {
		roomList.removeChild(roomList.lastChild);
	}
	roomList.insertAdjacentHTML('afterBegin','<option>Select specific area</option>');
	for(var i=0;i<groups[group].locations.length;++i) {
		var index = groups[group].locations[i];
		roomList.insertAdjacentHTML('beforeEnd','<option value="'+index+'">'+locations[index].name+'</option>');
	}
	if(scroll) {
		document.getElementById('location-list').scrollTop = document.getElementById(group).offsetTop - 124;
	}
	openDrawer();
	outerContainer.classList.add('show-building-info');
}

function displayLocationInfo(locationIndex,scroll) {
	var location = locations[locationIndex];
	document.getElementById('filter-locations').value = location.name;
	updateLocationResults();
	var buildingImg = document.getElementById('building-image');
	buildingImg.src = placeholderBuilding;
    buildingImg.src = 'http://www.latrobe.edu.au/apps/floormap/images/'+location.code+'-thumb.jpg';
	buildingImg.alt = location.code;
    buildingImg.classList.remove('hidden');
	var roomList = document.getElementById('rooms');
	while(roomList.lastChild) {
		roomList.removeChild(roomList.lastChild);
	}
	if (location.marker.type!=='parking') {
		roomList.insertAdjacentHTML('afterBegin','<option>Select room</option>');
		for(var floor in retrievedLocations[campusCode][location.code]) {
			if(retrievedLocations[campusCode][location.code].hasOwnProperty(floor)) {
				var floorCode = retrievedLocations[campusCode][location.code][floor]['number'];
				var floorName = retrievedLocations[campusCode][location.code][floor]['name'];
				for(var i=0;i<retrievedLocations[campusCode][location.code][floor]['rooms'].length;++i) {
					var room = retrievedLocations[campusCode][location.code][floor]['rooms'][i];
					var roomCode = room['number'];
					var roomName = room['name'];
					var floorText = /^\d+$/.test(floorCode) ? 'Floor '+floorCode : floorName;
					var roomText = roomName.length ? (roomCode+' ('+roomName+')') : roomCode;
					var value = JSON.stringify({"floor":floorCode,"floorText":floorText,"roomCode":roomCode,"roomText":roomText});
					roomList.insertAdjacentHTML('beforeend','<option class="get-floorplan" value=\''+value+'\'>' + floorText + ' - ' + roomText + '</option>');
					roomList.classList.remove('hidden');
				}
			}
		}
	}
	else {
		roomList.classList.add('hidden');
	}
	if(roomList.options.length<2) {
		roomList.classList.add('hidden');
	}
	if(scroll) {
		document.getElementById('location-list').scrollTop = document.getElementById(location.type+locationIndex).offsetTop - 124;
	}
	openDrawer();
	outerContainer.classList.add('show-building-info');
}

function initialiseCurrentCampusMap(mapElement,showOverlay) {
	if(typeof showOverlay==='undefined') {
		showOverlay = false;
	}
	initialiseMap(mapElement,showOverlay,detectUserCampus());
}

function initialiseDefaultCampusMap(showOverlay) {
	if(typeof showOverlay==='undefined') {
		showOverlay = false;
	}
	initialiseMap(mapElement,showOverlay,'BU');
}

function changeCampus(campus) {
	campusCode = campus;
	getCampusData(campusCode,loadCampusFromGeojson);
}

function generateFloorplan(campusCode,floorId,floorText,roomCode,roomText,locationName,locationCode) {
	var errorContent = '<p>Error rendering floor plan: failed to retrieve floor plan data.</p>';
	outerContainer.classList.add('show-floorplan');
	if(!locationName) {
		locationName=locations[selectedLocationIndex].name;
	}
	if(!locationCode) {
		locationCode=locations[selectedLocationIndex].code;
	}
	document.getElementById('floorplan-header').innerHTML = locationName + ': ' + floorText + ', Room ' + roomText;
	document.getElementById('floorplan-header').focus();
	var div = document.getElementById('floorplan-content');
	while(div.hasChildNodes()) {
		div.removeChild(div.lastChild);
	}
	xhr('GET','text',apiEndpoint+'floorplan/room/'+campusCode+'/'+locationCode+'/'+roomCode,
		function(data) {
			var domParser = new DOMParser();
			if(domParser.parseFromString(data, 'text/xml').documentElement.nodeName=='svg') {
				div.insertAdjacentHTML('beforeend',data);
			}
			else {
				div.insertAdjacentHTML('beforeend',errorContent);
			}
		},
		function() {
			div.insertAdjacentHTML('beforeend',errorContent);
		}
	);
}

function detectUserCampus() {
	return 'BU';
}

function getCampusData(campusCode,callback) {
	if(!campuses.hasOwnProperty(campusCode)) {
		console.log('Error rendering campus overlay: invalid campus code.');
		return false;
	}
	if(campuses[campusCode].loaded) {
		callback(campuses[campusCode].geojson);
	}
	else {
		xhr('GET','json','location/geoJSON/'+campusCode,callback, function() {
			console.log('Error rendering campus overlay: failed to retrieve campus data.');
		});
	}
}

function xhr(method,responseType,url,success,failure) {
	var endpoint = url.substring(0,2)==='//' ? url : apiEndpoint + url;
	var xhr = new XMLHttpRequest();
	if("withCredentials" in xhr) {
		xhr.open(method, endpoint, true);
	}
	else {
		failure();
		return false;
	}
	xhr.onload = function() {
		if(responseType=='json') {
			success(JSON.parse(xhr.responseText));
		}
		else {
			success(xhr.responseText);
		}
	};
	xhr.onerror = failure;
	xhr.send();
}

function clearMap() {
	for(var i = 0; i < locations.length; i++ ) {
		locations[i].marker.setMap(null);
	}
	for(amenity in amenities) {
		if(amenities.hasOwnProperty(amenity)) {
			for(var i=0;i<amenities[amenity].length;++i) {
				amenities[amenity][i].marker.setMap(null);
			}
			amenities[amenity] = [];
		}
	}
	for(group in groups) {
		if(groups.hasOwnProperty(group)) {
			groups[group].marker.setMap(null);
		}
	}
	for(path in paths) {
		if(paths.hasOwnProperty(path)) {
			changePathVisibility(path,false);
		}
	}
	for(var i=0;i<constructions.length;++i) {
		constructions[i].zone.setMap(null);
	}
	groups = [];
	locations = [];
	paths = {};
	constructions = [];
	selectedLocationIndex = null;
	selectedAmenityIndex = null;
	selectedAmenityType = null;
}

function loadCampusFromGeojson(data) {
	map.setZoom(17);
	campuses[campusCode].geojson = data;
	campuses[campusCode].loaded = true;
	if(overlayLoaded && currentCampus==campusCode) {
		return false;
	}
	currentCampus = null;
	overlayLoaded = false;
	clearMap();
	firstLabel = true;
	mapLat = data.centreCoordinates[1];
	mapLng = data.centreCoordinates[0];
	campusMarker = new google.maps.LatLng(mapLat, mapLng);
	map.panTo(campusMarker);
	var marker;
	for(var i=0;i<data.features.length; ++i) {
		var feature = data.features[i];
		if (typeof feature.properties !== 'undefined' && typeof feature.geometry !== 'undefined') {
			var properties = feature.properties;
			var geometry = feature.geometry;
			if(['Point','LineString'].indexOf(geometry.type)!=-1) {
				var group = typeof properties.group !== 'undefined' ? properties.group : null;
				if (typeof properties.type !== 'undefined') {
					if(properties.type=='Path') {
						var pathCoords = [];
						for(var j=0;j<geometry.coordinates.length;++j) {
							pathCoords.push({lat: geometry.coordinates[j][1], lng: geometry.coordinates[j][0]});
						}
						var path = new google.maps.Polyline({
							map: map,
							path: pathCoords,
							geodesic: true,
							strokeColor: '#d52b1e',
							strokeOpacity: 1.0,
							strokeWeight: 4
						});
						paths[properties.name] = {text: properties.text, display: false, path: path, points: []};
					}
					else if(properties.type=='Pathpoint') {
						paths[properties.path].points.push(
							new google.maps.Marker({
								position: {lat: parseFloat(geometry.coordinates[1]), lng: parseFloat(geometry.coordinates[0])},
								map: map,
								text: properties.index
							})
						);
						if(isIE) {
							paths[properties.path].points[paths[properties.path].points.length-1].setOptions({optimized: false});
						}
					}
					else if(properties.type=='group') {
						marker = new google.maps.Marker({
							position: {lat: parseFloat(geometry.coordinates[1]), lng: parseFloat(geometry.coordinates[0])},
							icon: encodeSvg(getTextSvg('group',false,false,properties.text,properties.text)),
						});
						if(isIE) {
							marker.setOptions({optimized: false});
						}
						groups[group] = {marker: marker, text: properties.text, locations: []};
					}
					else if(colours.hasOwnProperty(properties.type)) {
						marker = new google.maps.Marker({
							position: {lat: parseFloat(geometry.coordinates[1]), lng: parseFloat(geometry.coordinates[0])},
							map: map
						});
						if(isIE) {
							marker.setOptions({optimized: false});
						}
						if(!properties.code.length) {
							properties.code = emptyItemIdentifier+i;
						}
						locations.push({marker: marker, type: properties.type, name: properties.name, code: properties.code, group: group, construction: properties.construction});
						if(group!=null) {
							groups[group].locations.push(locations.length-1);
						}
					}
					else if(amenities.hasOwnProperty(properties.type)) {
						marker = new google.maps.Marker({
							icon: amenityOptions[properties.type].svg,
							position: {lat: parseFloat(geometry.coordinates[1]), lng: parseFloat(geometry.coordinates[0])}
						});
						marker.setOptions({optimized: false});
						amenities[properties.type].push({marker: marker, id: properties.id, text: properties.name});
						amenities[properties.type][amenities[properties.type].length-1].marker.addListener('click',amenityMarkerClick(properties.type,amenities[properties.type].length-1));
					}
				}
			}
			else if(['Polygon','Circle'].indexOf(geometry.type)!=-1) {
				if (typeof properties.type !== 'undefined') {
					if(properties.type=='Construction') {
						if(geometry.type=='Polygon') {
							constructions.push({
												type: 1,
												zone: new google.maps.Polygon({
													map: map,
													paths: geometry.coordinates,
													fillColor: colours['construction'].fillColor,
													fillOpacity: colours['construction'].fillOpacity,
													strokeColor: colours['construction'].strokeColor
												})
							});
						}
						else if(geometry.type=='Circle') {
							constructions.push({
												type: 2,
												zone: new google.maps.Circle({
													map: map,
													position: geometry.coordinates,
													radius: properties.radius,
													fillColor: colours['construction'].fillColor,
													fillOpacity: colours['construction'].fillOpacity,
													strokeColor: colours['construction'].strokeColor
												})
							});
						}
					}
				}
			}
		}
	}
	generateSearchablesList();
	repaintSearchables();
	retrievedLocations[campusCode] = {};
	currentCampus = campusCode;
	overlayLoaded = true;
	for(group in groups) {
		if(groups.hasOwnProperty(group)) {
			groups[group].marker.addListener('mouseover',mouse(true,'group',group));
			groups[group].marker.addListener('mouseout',mouse(false,'group',group));
			groups[group].marker.addListener('click',showInformation('group',group));
		}
	}
	for(var i=0;i<locations.length;++i) {
		var type = locations[i].type;
		if(colours.hasOwnProperty(type)) {
			locations[i].marker.addListener('mouseover',mouse(true,type,i));
			locations[i].marker.addListener('mouseout',mouse(false,type,i));
			locations[i].marker.addListener('click',showInformation(type,i));
		}
		locationPointers[locations[i].code] = i;
	}
	for(var amenity in amenities) {
		if(amenities.hasOwnProperty(amenity)) {
			for (var i = 0; i < amenities[amenity].length; ++i) {
				amenities[amenity][i].marker.addListener('mouseover', mouse(true, amenity, i));
				amenities[amenity][i].marker.addListener('mouseover', mouse(true, amenity, i));
				amenities[amenity][i].marker.addListener('click', showInformation(amenity, i));
			}
		}
	}
	zoomChanged();
	if(onloadedAction) {
		onloadedAction();
	}
}

function amenityMarkerClick(type,index) {
	return function() {
		if(selectedAmenityType!=type && selectedAmenityIndex!=index) {
			selectAmenity(type,index,true);
		}
	}
}

function selectAmenityGroup(type) {
	unselectItems();
	selectedAmenityType = type;
	selectedAmenityIndex = null;
	selectedPath = null;
	selectedType = 3;
	document.getElementById('filter-locations').value = amenityOptions[type].text + ' (All)';
	updateLocationResults();
	outerContainer.classList.add('show-building-info');
	var buildingImg = document.getElementById('building-image');
	buildingImg.src = placeholderBuilding;
	buildingImg.src = 'img/' + type + '-placeholder.svg';
	buildingImg.alt = amenityOptions[selectedAmenityType].text;
	buildingImg.classList.remove('hidden');
	populateAmenityDropdown();
	repaintAmenities();
}

function unselectItems() {
	if(selectedGroup!=null) {
		groups[selectedGroup].marker.setIcon(encodeSvg(getTextSvg('group',mousedGroup==selectedGroup,false,groups[selectedGroup].text,groups[selectedGroup].text)));
	}
	if(selectedLocationIndex!=null) {
		var parentGroup = locations[selectedLocationIndex].group;
		if(parentGroup!=null) {
			groups[parentGroup].marker.setIcon(encodeSvg(getTextSvg('group',false,false,groups[parentGroup].text,groups[parentGroup].text)));
			if(map.getZoom()<18) {
				locations[selectedLocationIndex].marker.setIcon(encodeSvg());
			}
			else {
				locations[selectedLocationIndex].marker.setIcon(encodeSvg(getTextSvg(locations[selectedLocationIndex].type,mousedLocationIndex==selectedLocationIndex,false,locations[selectedLocationIndex].name,locations[selectedLocationIndex].code)));
			}
		}
		else {
			locations[selectedLocationIndex].marker.setIcon(encodeSvg(getTextSvg(locations[selectedLocationIndex].type,mousedLocationIndex==selectedLocationIndex,false,locations[selectedLocationIndex].name,locations[selectedLocationIndex].code)));
		}
	}
	if(selectedPath!=null) {
		changePathVisibility(selectedPath,false);
		selectedPath = null;
	}
	selectedGroup = null;
	selectedLocationIndex = null;
}

function populateAmenityDropdown() {
	var newIndex = 0;
	var roomList = document.getElementById('rooms');
	while(roomList.lastChild) {
		roomList.removeChild(roomList.lastChild);
	}
	roomList.insertAdjacentHTML('afterBegin','<option>All</option>');
	for(var i=0;i<amenities[selectedAmenityType].length;++i) {
		if(selectedType==4 && selectedAmenityIndex==i) {
			newIndex = i+1;
		}
		roomList.insertAdjacentHTML('beforeend','<option class="get-floorplan" value="'+i+'">'+amenities[selectedAmenityType][i].text+'</option>');
	}
	roomList.selectedIndex = newIndex;
	roomList.classList.remove('hidden');
}

function selectAmenity(type,index) {
	document.getElementById('filter-locations').value = amenityOptions[type].text+' - '+amenities[type][index].text;
	updateLocationResults();
	outerContainer.classList.add('show-building-info');
	var buildingImg = document.getElementById('building-image');
	buildingImg.src = placeholderBuilding;
//	buildingImg.src = '';
	buildingImg.alt = amenityOptions[type].text;
	buildingImg.classList.remove('hidden');
	if(selectedLocationIndex!=null) {
		locations[selectedLocationIndex].marker.setIcon(encodeSvg(getTextSvg(locations[selectedLocationIndex].type,mousedLocationIndex==selectedLocationIndex,false,locations[selectedLocationIndex].name,locations[selectedLocationIndex].code)));
	}
	selectedLocationIndex = null;
	selectedAmenityType = type;
	selectedAmenityIndex = index;
	selectedPath = null;
	selectedType = 4;
	populateAmenityDropdown();
	repaintAmenities();
	panToMarker(type,index,false);
}

function selectPath(path) {
	selectedLocationIndex = null;
	selectedAmenityType = null;
	selectedAmenityIndex = null;
	selectedPath = path;
	selectedType = 5;
	document.getElementById('filter-locations').value = paths[path].text;
	updateLocationResults();
	outerContainer.classList.add('show-building-info');
	var buildingImg = document.getElementById('building-image');
	buildingImg.src = placeholderBuilding;
//	buildingImg.alt = ;
	buildingImg.classList.remove('hidden');
	togglePathVisibility(path);
}

/**
 * Returns
 * @param highlight
 * @param itemType
 * @param itemIndex
 * @returns {Function}
 */
function mouse(highlight,itemType,itemIndex) {
	if(itemType=='group') {
		return function() {
			if(highlight) {
				mousedGroup = itemIndex;
				if(map.getZoom()<17) {
					return false;
				}
			}
			else {
				mousedGroup = null;
			}
			groups[itemIndex].marker.setIcon(encodeSvg(getTextSvg('group',highlight,itemIndex==selectedGroup,groups[itemIndex].text,groups[itemIndex].text)));
		}
	}
	else {
		return function() {
			if(highlight) {
				mousedLocationIndex = itemIndex;
				if(map.getZoom()<17) {
					return false;
				}
			}
			else {
				mousedLocationIndex = null;
			}
			locations[itemIndex].marker.setIcon(encodeSvg(getTextSvg(locations[itemIndex].type,highlight,itemIndex==selectedLocationIndex,locations[itemIndex].name,locations[itemIndex].code)));
		}
	}
}

/**
 * Takes as a parameter a string representation of an SVG image and returns an encoded image that can be used for a google maps marker icon.
 * @param content
 * @returns {{url: string}}
 */
function encodeSvg(content) {
	if(!content) {
		content = '<svg height="1" width="1"></svg>';
	}
	while(svgDiv.hasChildNodes()) {
		svgDiv.removeChild(svgDiv.lastChild);
	}
	svgDiv.insertAdjacentHTML('beforeend',content);
	var height = svgDiv.firstElementChild.getAttribute('height');
	var width = svgDiv.firstElementChild.getAttribute('width');
	if(isIE) {
		return {
			url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(content),
			scaledSize: new google.maps.Size(width,height),
			origin: new google.maps.Point(0,0)
		};
	}
	else {
		return {
			url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(content)
		};
	}
}

/**
 * Return a string containing the SVG markup for a text label on the map.
 * @param type
 * @param highlight
 * @param selected
 * @param name
 * @param code
 * @returns string
 */
function getTextSvg(type, highlight, selected, name, code) {
	var text = name;
	var initialWidth = (name.length * 8) + 20;
	if(map.getZoom() < 17) {
		if (['CC','CF','SH'].indexOf(campusCode) != -1 && map.getZoom()==16 && firstLabel) {
			firstLabel = false;
			text = code;
		}
		else {
			if(type=='campus') {
				if(map.getZoom() < 10) {
					return false;
				}
			}
			else {
				return false;
			}
		}
	}
	else if(type=='campus') {
		return false;
	}
	else if(map.getZoom() < 19) {
		text = code;
		initialWidth = (code.length * 8) + 20;
	}
	if(text.indexOf(emptyItemIdentifier)!=-1) {
		text = name;
		var initialWidth = (name.length * 8) + 20;
		var increaseWidth = 5;
		var height = 25;
		var fontSize = 16;
	}
	else if(type == 'campus') {
		var increaseWidth = 100;
		var height = 30;
		var fontSize = 25;
	}
	else if(type == 'group') {
		var increaseWidth = 70;
		var height = 29;
		var fontSize = 17;
	}
	else {
		var increaseWidth = 5;
		var height = 25;
		var fontSize = 16;
	}
	if(type=='amenity') {
		return false;
	}
	var parking = '';
	var parkingWidth = 4;
	if(type=='parking') {
		parkingWidth = 28;
		if(map.getZoom() >= 17) {
			parking = '<rect fill="#2E53FF" width="25" height="25"/><g><path fill="#FFFFFF" d="M11.2,17h-2V7h3.4c0.5,0,1,0.1,1.4,0.2c0.4,0.2,0.7,0.4,1,0.7c0.3,0.3,0.5,0.6,0.6,1c0.1,0.4,0.2,0.8,0.2,1.3c0,0.5-0.1,0.9-0.2,1.3c-0.1,0.4-0.4,0.7-0.6,1c-0.3,0.3-0.6,0.5-1,0.6c-0.4,0.1-0.9,0.2-1.4,0.2h-1.4V17zM12.6,11.8c0.2,0,0.4,0,0.5-0.1c0.2-0.1,0.3-0.2,0.4-0.3c0.1-0.1,0.2-0.3,0.2-0.5c0-0.2,0.1-0.4,0.1-0.6s0-0.4-0.1-0.6c0-0.2-0.1-0.4-0.2-0.5c-0.1-0.2-0.2-0.3-0.4-0.4c-0.2-0.1-0.3-0.1-0.5-0.1h-1.4v3.1H12.6z"/></g>';
		}
        if(map.getZoom() >= 19) {
            parkingWidth = 32;
        }
	}
	if(!text.length) {
		return false;
	}
	if(highlight) {
		var bgcolour = colours.highlight.fillColor;
	}
	else {
		var bgcolour = colours.building.fillColor;
	}
	if(selected) {
		var bold = 'font-weight:bold;';
        var filter = '<feFlood flood-color="#ff9e1b" flood-opacity="1"/><feComposite in="SourceGraphic"/>';
	}
	else {
		var bold = '';
        var filter = '<feFlood flood-color="'+bgcolour+'" flood-opacity="0.5"/><feComposite in="SourceGraphic"/>';
	}
	return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (initialWidth + parkingWidth) + '" height="' + height + '">' +
		'<filter id="textbgfilter">'+filter+'</filter>'+
        '<g transform="translate(0,0)">'+parking+
        '<text alignment-baseline="middle" x="'+parkingWidth+'" y="15" style="'+bold+'font-size:' + fontSize + '; font-family: \'Roboto\', sans-serif; fill: #000;" filter="url(#textbgfilter)"> '+text+'</text></g></svg>';
}

/**
 * Responds to a map zoom event by re-rendering all elements on the map.
 */
function zoomChanged() {
	if(!overlayLoaded) {
		return false;
	}
	firstLabel = true;
	repaintMap();
}

/**
 * Re-renders all elements on the map, making those elements visible to the user where appropriate, or changing their icon.
 */
function repaintMap() {
	repaintAmenities();
	repaintPaths();
	repaintLocations();
	repaintGroups();
}

/**
 * Re-render all amenities on the map, displaying currently selected amenities when map zoom is at an appropriate level.
 * @param force
 */
function repaintAmenities(force) {
	for(amenity in amenities) {
		if(amenities.hasOwnProperty(amenity)) {
			for(var i=0;i<amenities[amenity].length;++i) {
				var visible = map.getZoom()>15 && selectedAmenityType==amenity && (selectedAmenityIndex==null || selectedAmenityIndex==i);
				amenities[amenity][i].marker.setMap(visible ? map : null);
			}
		}
	}
}

/**
 * Re-render all paths on the map.
 */
function repaintPaths() {
	for(path in paths) {
		if(paths.hasOwnProperty(path)) {
			renderPath(path);
		}
	}
}

/**
 * Re-render the marker icons of any locations on the map upon zoom of the map.
 */
function repaintLocations() {
	for(var i=0;i<locations.length;++i) {
		if(colours.hasOwnProperty(locations[i].type)) {
			markerContent = getTextSvg(locations[i].type,i==mousedLocationIndex,i==selectedLocationIndex,locations[i].name, locations[i].code);
		}
		locations[i].marker.setIcon(encodeSvg(markerContent));
	}
}

/**
 * Re-render the marker icons of any groups and the locations belonging to those groups upon zoom of the map.
 */
function repaintGroups() {
	for(group in groups) {
		if(groups.hasOwnProperty(group)) {
			groups[group].marker.setMap(map.getZoom()>16 && map.getZoom()<18 ? map : null);
			if(map.getZoom()<18) {
				for(var i=0;i<groups[group].locations.length;++i) {
					var j = groups[group].locations[i];
					locations[j].marker.setIcon(encodeSvg());
					if(j==selectedLocationIndex) {
						groups[group].marker.setIcon(encodeSvg(getTextSvg('group',true,true,groups[group].text,groups[group].text)));
					}
				}
			}
		}
	}
}

/**
 * Return the appropriate pathpoint icon for a particular pathpoint.
 * @returns string
 */
function getPathpointIcon(path,point) {
	if(map.getZoom() < 15) {
		return null;
	}
	else if(map.getZoom() >= 17) {
		var size = 46;
	}
	else {
		var size = 30;
	}
	var colour = paths[path].path.strokeColor;
	return '<svg xmlns="http://www.w3.org/2000/svg" height="'+(size)+'" width="'+(size)+'"><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+(size/3)+'" stroke="black" stroke-width="2" fill="'+colour+'" /><text style="font-family: \'Roboto\', sans-serif;" x="'+(size/2)+'" y="'+(size/2)+'" text-anchor="middle" alignment-baseline="middle" fill="white">'+point+'</text>'+point+'</svg>'
}

/**
 * Returns a polygon representing the geographic area of the non-panning region of the screen, i.e. the inner region of the currently visible map.
 * @returns {google.maps.Polygon}
 */
function getNonPanningRegion() {
	var northEastLat = map.getBounds().getNorthEast().lat();
	var northEastLng = map.getBounds().getNorthEast().lng();
	var southWestLat = map.getBounds().getSouthWest().lat();
	var southWestLng = map.getBounds().getSouthWest().lng();
	var boundsLeft = northEastLat + ((southWestLat - northEastLat) * 0.15);
	var boundsRight = northEastLat + ((southWestLat - northEastLat) * 0.85);
	var boundsTop = southWestLng + ((northEastLng - southWestLng) * 0.15);
	var boundsBottom = southWestLng + ((northEastLng - southWestLng) * 0.85);
	return new google.maps.Polygon({paths: [
		{lat: boundsLeft, lng: boundsTop},
		{lat: boundsRight, lng: boundsTop},
		{lat: boundsRight, lng: boundsBottom},
		{lat: boundsLeft, lng: boundsBottom},
		{lat: boundsLeft, lng: boundsTop}
	]});
}

/**
 * Pans the map's centre position to a marker of a location or group upon selection of such an item, and zooms the map appropriately.
 * If the marker position is inside the main currently visible area of the map and does not fall outside the bounds encompassing this inner region, nothing happens.
 * @param type
 * @param itemIndex
 * @param scroll
 */
function panToMarker(type,itemIndex,scroll) {
	if(type=='group') {
		var marker = groups[itemIndex].marker;
		if(map.getZoom()>17) {
			map.setZoom(17);
		}
	}
	else if(colours.hasOwnProperty(type)) {
		var marker = locations[itemIndex].marker;
	}
	else {
		var marker = amenities[type][itemIndex].marker;
	}
	var nonPanningRegion = getNonPanningRegion();
	if(map.getZoom()<17 || !google.maps.geometry.poly.containsLocation(marker.position, nonPanningRegion)) {
		map.panTo(marker.position);
		if(!scroll && window.innerWidth<=800) {
			map_recenter(marker.position,0,outerContainer.offsetHeight * 0.375);
		}
	}
	if(map.getZoom()<17) {
		map.setZoom(17);
	}
}

/**
 * Returns a function representing the callback function for an event when a location or group has been clicked.
 * @param type
 * @param itemIndex
 * @returns {Function}
 */
function showInformation(type,itemIndex) {
	if(type=='group') {
		return function() {
			selectGroup(itemIndex,true);
		};
	}
	else if(amenityOptions.hasOwnProperty(type)) {
		return function() {
			selectAmenity(type,itemIndex,true);
		};
	}
	else {
		return function() {
			if(['building','parking'].indexOf(type)!=-1) {
				selectLocation(itemIndex,true);
			}
		};
	}
}

/**
 * Recentre the map based on an offset in pixels from a latlng.
 * @param latlng
 * @param offsetx
 * @param offsety
 */
function map_recenter(latlng,offsetx,offsety) {
    var point1 = map.getProjection().fromLatLngToPoint(
        (latlng instanceof google.maps.LatLng) ? latlng : map.getCenter()
    );
    var point2 = new google.maps.Point(
        ( (typeof(offsetx) == 'number' ? offsetx : 0) / Math.pow(2, map.getZoom()) ) || 0,
        ( (typeof(offsety) == 'number' ? offsety : 0) / Math.pow(2, map.getZoom()) ) || 0
    );
    map.setCenter(map.getProjection().fromPointToLatLng(new google.maps.Point(
        point1.x - point2.x,
        point1.y + point2.y
    )));
}
