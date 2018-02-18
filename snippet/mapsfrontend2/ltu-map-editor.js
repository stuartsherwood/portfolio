var editMode = true;
var clickpoints = [];
var clickline;
var linked;
var line;
var midpoints = [];
var circle = null;
var distance;
var inserted;
var index;
var editPoint = '<svg xmlns="http://www.w3.org/2000/svg" height="12" width="12"><circle cx="6" cy="6" r="4" stroke="black" stroke-width="2" fill="red" /></svg>';
var extendPoint = '<svg xmlns="http://www.w3.org/2000/svg" height="12" width="12"><circle cx="6" cy="6" r="4" stroke="black" stroke-width="2" fill="orange" /></svg>';
var fields = ['Location','Group','AmenityType','AmenityInstance','Path','Pathpoint','Construction'];
var movedAmenityType = null;
var movedAmenityIndex = null;
var originalPositions = {};

var element = document.createElement('script');
element.src = 'ltu-map.js';
map.appendChild(element);

function midpointDrag(e) {
    var j = parseInt(this.text);
    if(!inserted) {
        clickpoints.splice(j,0,this);
        for(var q=j+1;q<clickpoints.length;++q) {
            clickpoints[q].text = q;
        }
        inserted = true;
    }
    clickpoints[j].position = this.position;
    var positions = [];
    for (var b=0;b<clickpoints.length;++b) {
        positions.push(clickpoints[b].position);
    }
    clickline.setMap(null);
    if(index==5) {
        clickline = new google.maps.Polyline({
            map: map,
            path: positions,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    }
    else if(index==7) {
        clickline = new google.maps.Polygon({
            map: map,
            paths: [positions],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.3
        });
    }
}

function polyMousemove(event) {
    if (clickpoints.length) {
        if (line) {
            line.setMap(null);
        }
        line = new google.maps.Polyline({
            map: map,
            path: [clickpoints[clickpoints.length - 1].position, event.latLng],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            clickable: false
        });
    }
}

function circleMousemove(event) {
    if (clickpoints.length) {
        if(circle!=null) {
            circle.setMap(null);
        }
        circle = new google.maps.Circle({
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: map,
            center: clickpoints[0].position,
            radius: google.maps.geometry.spherical.computeDistanceBetween(event.latLng,clickpoints[0].position),
            clickable: false,
            draggable: true
        });
        document.getElementById('new-construction-circle-radius').value = circle.radius;
    }
}

function polylineDrag(e) {
    var i = parseInt(this.text);
    this.setPosition(e.latLng);
    clickpoints[i].setPosition(this.getPosition());
    line.setMap(null);
    clickline.setMap(null);
    var positions = [];
    for (var i = 0; i < clickpoints.length; ++i) {
        positions.push(clickpoints[i].position);
    }
    clickline = new google.maps.Polyline({
        map: map,
        path: positions,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    updateMidpoints(index);
}

function polylineRightclick(e) {
    if(clickpoints.length==2) {
        return false;
    }
    var i = parseInt(this.text);
    clickpoints[i].setMap(null);
    clickpoints.splice(i,1);
    for(var j=i;j<clickpoints.length;++j) {
        clickpoints[j].text = j;
    }
    var positions = [];
    for(var j=0;j<clickpoints.length;++j) {
        positions.push(clickpoints[j].position);
    }
    clickline.setMap(null);
    clickline = new google.maps.Polyline({
        map: map,
        path: positions,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    updateMidpoints(index);
}

function polypointDrag(e) {
    var i = parseInt(this.text);
    this.setPosition(e.latLng);
    if (i == 0 || i == clickpoints.length - 1) {
        clickpoints[0].setPosition(this.getPosition());
        clickpoints[clickpoints.length - 1].setPosition(this.getPosition());
    }
    clickpoints[parseInt(this.text)].setPosition(this.getPosition());
    line.setMap(null);
    clickline.setMap(null);
    var positions = [];
    for (var b=0;b<clickpoints.length;++b) {
        positions.push(clickpoints[b].position);
    }
    if(index==5) {
        clickline = new google.maps.Polyline({
            map: map,
            path: positions,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.3
        });
    }
    else if(index==7) {
        clickline = new google.maps.Polygon({
            map: map,
            paths: [positions],
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.3
        });
    }
    updateMidpoints(index);
}

function polylineKeydown(e) {
    var key = (e.keyCode ? e.keyCode : e.which);
    if(key==27) {
        removeDrawings();
    }
    else if(key==13) {
        if(clickpoints.length>1) {
            var list = document.getElementById('new-path-coordslist');
            while (list.lastChild) {
                list.removeChild(list.lastChild);
            }
            list.insertAdjacentHTML('beforeend', '<p>Edit coordinates using the map interface.</p>');
            for(var i=0;i<clickpoints.length;++i) {
                clickpoints[i].text = i;
                list.insertAdjacentHTML('beforeend', '<p>'+clickpoints[i].position.lat()+','+clickpoints[i].position.lng()+'</p>');
            }
            google.maps.event.clearListeners(map, 'mousemove');
            google.maps.event.clearListeners(map, 'click');
            line.setMap(null);
            for (var k=0;k<clickpoints.length; ++k) {
                clickpoints[k].setDraggable(true);
                clickpoints[k].addListener('drag', polylineDrag);
            }
            updateMidpoints(index);
        }
    }
}

function polygonKeydown(e) {
    var key = (e.keyCode ? e.keyCode : e.which);
    if(key==27) {
        removeDrawings();
    }
}

function initialiseEditor(divElement) {
	var generateHoursList = function(set) {
		var content = '<select id="'+set+'OpeningHours">';
		for(var i=0;i<24;++i) {
			content += '<option>'+i+'</option>';
		}
		content += '</select>';
		return content;
	}
	var generateMinutesList = function(set) {
		var content = '<select id="'+set+'OpeningMinutes">';
		for(var i=0;i<60;++i) {
			content += '<option>'+i+'</option>';
		}
		content += '</select>';
		return content;
	}
	var generateOpeningHoursFields = function(set) {
		var days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
		var content = '';
		for(var i=0;i<days.length;++i) {
			var day = days[i];
			content += '<div>'+day+' > Open: '+generateHoursList(day)+'Close: '+generateMinutesList(day)+'</div>';
		}
		return content;
	}
	var generateTradingHoursContent = function() {
		var sets = [
					{text: 'During semester', id: 'semester'},
					{text: 'Holiday periods', id: 'holidayperiods'},
					{text: 'Public holidays', id: 'publicholidays'}
				   ];
		var content = '';
		for(var i=0;i<sets.length;++i) {
			content += '<div><a onclick="document.getElementById(\''+sets[i].id+'Div\').classList.toggle(\'hidden\')">'+sets[i].text+'</a><div id="'+sets[i].id+'Div" class="hidden">'+generateOpeningHoursFields(sets[i].id)+'</div></div>';
		}
		return content;
	}
    document.getElementById(divElement).insertAdjacentHTML('beforeend',
        '<div id="new-wrapper" style="position: absolute;right:0px;top:0px;">'+
        '<input id="new1" class="icon" type="image" onclick="selectNewItem(1)" src="http://simpleicon.com/wp-content/uploads/map-marker-20.svg" alt="New location" height="48" width="48" />'+
        '<input id="new2" class="icon" type="image" onclick="selectNewItem(2)" src="http://icons.iconarchive.com/icons/martz90/circle-addon2/128/group-icon.png" alt="New group" height="48" width="48" />'+
        '<input id="new3" class="icon" type="image" onclick="selectNewItem(3)" src="http://uxrepo.com/static/icon-sets/ocha/svg/house.svg" alt="New amenity type" height="48" width="48" />'+
        '<input id="new4" class="icon" type="image" onclick="selectNewItem(4)" src="http://uxrepo.com/static/icon-sets/typicons/svg/star.svg" alt="New amenity instance" height="48" width="48" />'+
        '<input id="new4" class="icon" type="image" onclick="selectNewItem(5)" src="https://cdn2.iconfinder.com/data/icons/track/154/road-way-arrow-vector-track-128.png" alt="New path" height="48" width="48" />'+
        '<input id="new4" class="icon" type="image" onclick="selectNewItem(6)" src="https://testdrive-archive.azurewebsites.net/Graphics/SpaceInvader/backgrounds/crosshair.svg" alt="New path point" height="48" width="48" />'+
        '<input id="new7" class="icon" type="image" onclick="selectNewItem(7)" src="http://findicons.com/files/icons/2711/free_icons_for_windows8_metro/128/under_construction.png" alt="New construction area" height="48" width="48" />'+
        '</div>'
    );
    document.getElementsByClassName('building-info')[0].insertAdjacentHTML('beforeend',
        '<div id="new-item-wrapper">'+
        '<div>Type: <select class="map-select" id="new-type" onchange="selectNewItem(this.selectedIndex)">'+
        '<option>Select one</option>'+
        '<option>Location</option>'+
        '<option>Group</option>'+
        '<option>Amenity type</option>'+
        '<option>Amenity instance</option>'+
        '<option>Path</option>'+
        '<option>Pathpoint</option>'+
        '<option>Construction</option>'+
        '</select></div>' +
        '<div id="newItemLocation"><form method="post" action="'+apiEndpoint+'saveitem">'+
        '<div>Building code: <input type="text" id="new-location-code" name="new-location-name" /></div>' +
        '<div>Name: <input type="text" id="new-location-name" /></div>' +
        '<div>Lat: <input type="text" id="new-location-lat" /></div>' +
        '<div>Lng: <input type="text" id="new-location-lng" /></div>' +
        '<div>Under construction: <select id="new-location-construction"><option value="0">No</option><option value="1">Yes</option></select></div>' +
        '<div>Group: <select id="new-location-group"></select></div>' +
        '<input type="button" value="Save" onclick="submitnewLocation();" /></form></div>'+
        '<div id="newItemGroup">'+
        '<div>ID: <input type="text" id="new-group-id" /></div>' +
        '<div>Name: <input type="text" id="new-group-name" /></div>' +
        '<div>Lat: <input type="text" id="new-group-lat" /></div>' +
        '<div>Lng: <input type="text" id="new-group-lng" /></div>' +
        '</div>'+
        '<div id="newItemAmenityType">'+
        '<div>Id: <input type="text" id="new-amenitytype-id" /></div>' +
        '<div>Text: <input type="text" id="new-amenitytype-text" /></div>' +
        '<div>Display by default: <select id="new-amenitytype-display"><option value="0">No</option><option value="1">Yes</option></select></div>' +
        '<div>Colour: <input type="text" id="new-amenitytype-colour" /></div>' +
        '<div>Svg: <textarea id="new-amenitytype-svg"></textarea></div>' +
        '</div>'+
        '<div id="newItemAmenityInstance">'+
        '<div>Type: <select id="new-ai-type"></select></div>' +
        '<div>Text: <input type="text" id="new-ai-text" /></div>' +
        '<div>Lat: <input type="text" id="new-ai-lat" /></div>' +
        '<div>Lng: <input type="text" id="new-ai-lng" /></div>' +
		'<div>Trading hours'+generateTradingHoursContent()+'</div>'+
        '</div>'+
        '<div id="newItemPath">'+
        '<div>ID: <input type="text" id="new-path-id" /></div>' +
        '<div>Name: <input type="text" id="new-path-name" /></div>' +
        '<div>Coords: <div id="new-path-coordslist"></div></div>' +
        '</div>'+
        '<div id="newItemPathpoint">'+
        '<div>Path: <select id="new-pathpoint-path" onchange="changePathpointPath()"></select></div>' +
        '<div>Index: <input type="text" id="new-pathpoint-index" /></div>' +
        '<div>Lat: <input type="text" id="new-pathpoint-lat" /></div>' +
        '<div>Lng: <input type="text" id="new-pathpoint-lng" /></div>' +
        '</div>'+
        '<div id="newItemConstruction">'+
        '<div>Shape: <select id="new-construction-shape" onchange="changeConstructionShape(this.selectedIndex)"><option value="Polygon">Polygon</option><option value="Circle">Circle</option></select></div>' +
        '<div>Construction: <input type="text" id="new-construction-name" /></div>' +
        '<div id="new-construction-polygon">'+
            '<div>Path: <textarea id="new-construction-path"></textarea></div>' +
        '</div>'+
        '<div id="new-construction-circle">'+
            '<div>Centre lat: <input type="text" id="new-construction-circle-lat" onchange="changeCentre()" /></div>' +
            '<div>Centre lng: <input type="text" id="new-construction-circle-lng" onchange="changeCentre()" /></div>' +
            '<div>Radius (metres): <input type="text" id="new-construction-circle-radius" onchange="changeRadius(this.value)" /></div>' +
        '</div>'+
        '</div>'+
        '<input type="button" value="Add" onclick="addItem()" /></div>'
    );
    document.getElementsByClassName('building-info')[0].insertAdjacentHTML('beforeend',
        '<div id="edit-item-wrapper">'+
        '<div id="editItemLocation">'+
        '<div>Building code: <input type="text" id="edit-location-code" /></div>' +
        '<div>Name: <input type="text" id="edit-location-name" /></div>' +
        '<div>Lat: <input type="text" id="edit-location-lat" /></div>' +
        '<div>Lng: <input type="text" id="edit-location-lng" /></div>' +
        '<div>Under construction: <select id="edit-location-construction"><option value="0">No</option><option value="1">Yes</option></select></div>' +
        '<div>Group: <select id="edit-location-group"></select></div>' +
        '</div>'+
        '<div id="editItemGroup">'+
        '<div>ID: <input type="text" id="edit-group-id" /></div>' +
        '<div>Name: <input type="text" id="edit-group-name" /></div>' +
        '<div>Lat: <input type="text" id="edit-group-lat" /></div>' +
        '<div>Lng: <input type="text" id="edit-group-lng" /></div>' +
        '</div>'+
        '<div id="editItemAmenityType">'+
        '<div>Id: <input type="text" id="edit-amenitytype-id" /></div>' +
        '<div>Text: <input type="text" id="edit-amenitytype-text" /></div>' +
        '<div>Display by default: <select id="edit-amenitytype-display"><option value="0">No</option><option value="1">Yes</option></select></div>' +
        '<div>Colour: <input type="text" id="edit-amenitytype-colour" /></div>' +
        '<div>Svg: <textarea id="edit-amenitytype-svg"></textarea></div>' +
        '</div>'+
        '<div id="editItemAmenityInstance">'+
        '<div>Type: <select id="edit-ai-type"></select></div>' +
        '<div>Text: <input type="text" id="edit-ai-text" /></div>' +
        '<div>Lat: <input type="text" id="edit-ai-lat" /></div>' +
        '<div>Lng: <input type="text" id="edit-ai-lng" /></div>' +
        '</div>'+
        '<div id="editItemPath">'+
        '<div>ID: <input type="text" id="edit-path-id" /></div>' +
        '<div>Name: <input type="text" id="edit-path-name" /></div>' +
        '<div>Coords: <div id="edit-path-coordslist"></div></div>' +
        '</div>'+
        '<div id="editItemPathpoint">'+
        '<div>Path: <select id="edit-pathpoint-path" onchange="changePathpointPath()"></select></div>' +
        '<div>Index: <input type="text" id="edit-pathpoint-index" /></div>' +
        '<div>Lat: <input type="text" id="edit-pathpoint-lat" /></div>' +
        '<div>Lng: <input type="text" id="edit-pathpoint-lng" /></div>' +
        '</div>'+
        '<div id="editItemConstruction">'+
        '<div>Construction: <input type="text" id="edit-construction-name" /></div>' +
        '<div>Path: <textarea id="edit-construction-path"></textarea></div>' +
        '</div>'+
        '<input type="button" value="Save changes" onclick="" /><input type="button" value="Delete" onclick="deleteItem()" /></div>'
    );
    newItemChangeCategory(1);
    var loadCampusFromGeojsonOld = loadCampusFromGeojson;
    loadCampusFromGeojson = function(data) {
        loadCampusFromGeojsonOld(data);
        for(amenity in amenities) {
            if(amenities.hasOwnProperty(amenity)) {
                originalPositions[amenity] = [];
                for(var i=0;i<amenities[amenity].length;++i) {
                    originalPositions[amenity].push(amenities[amenity][i].marker.position);
                }
            }
        }
    }
    var closeInfoOld = closeInfo;
    closeInfo = function() {
        closeInfoOld();
        removeDrawings();
    }
    var closeInfoElement = document.getElementById('close-info');
    document.removeEventListener('click',closeInfoElement);
    closeInfoElement.addEventListener('click', closeInfo);
    var repaintSearchablesOld = repaintSearchables;
    repaintSearchables = function() {
        repaintSearchablesOld();
        var locationList = document.getElementById('location-list');
        locationList.insertAdjacentHTML('afterBegin','<li id="NEW_ITEM" class="building"'
            + 'onclick="selectNewItem(1)">'
            + '<button class="building-title">New item</button>'
            + '<div id="NEW_ITEM-info" class="building-content hidden"><img class="building-image" id="NEW_ITEM-photo" />'
            + '</div>'
            + '</li>');
    };
    var selectLocationOld = selectLocation;
    selectLocation = function(locationIndex,scroll) {
        selectLocationOld(locationIndex,scroll);
        overrideEdit(1);
    };
    var selectAmenityGroupOld = selectAmenityGroup;
    selectAmenityGroup = function(type) {
        resetAmenityInstance();
        selectAmenityGroupOld(type);
        overrideEdit(3);
    };
    var selectAmenityOld = selectAmenity;
    selectAmenity = function(type,index) {
        resetAmenityInstance();
        selectAmenityOld(type,index);
        overrideEdit(4);
    };
    var selectPathOld = selectPath;
    selectPath = function(path) {
        selectPathOld(path);
        changePathVisibility(path,false);
        overrideEdit(5);
        index = 5;
        var positions = paths[path].path.getPath().getArray();
        for(var i=0;i<positions.length;++i) {
            clickpoints.push(new google.maps.Marker({
                map: map,
                position: positions[i],
                icon: encodeSvg(editPoint),
                draggable: true,
                text: i
            }));
            clickpoints[i].addListener('drag',polylineDrag);
            clickpoints[i].addListener('rightclick',polylineRightclick);
        }
        clickline = new google.maps.Polyline({
            map: map,
            path: positions,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        updateMidpoints(5);
    };
    clickline = new google.maps.Polyline({});
    line = new google.maps.Polyline({});
}

function changeRadius(radius) {
    if(circle!=null&&clickpoints.length>1) {
        circle.setRadius(parseFloat(radius));
        clickpoints[1].setPosition(offsetCoordinates(clickpoints[0].position,radius,0));
        distance = google.maps.geometry.spherical.computeDistanceBetween(clickpoints[1].position,clickpoints[0].position);
    }
}

function changeCentre() {
    if(clickpoints.length) {
        clickpoints[0].setPosition({lat: parseFloat(document.getElementById('new-construction-circle-lat').value), lng:parseFloat(document.getElementById('new-construction-circle-lng').value)});
        if(circle!=null && clickpoints.length>1) {
            clickpoints[1].setPosition(offsetCoordinates(clickpoints[0].position,circle.radius,0));
            distance = google.maps.geometry.spherical.computeDistanceBetween(clickpoints[1].position,clickpoints[0].position);
            circle.setMap(null);
            circle = new google.maps.Circle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35,
                map: map,
                center: clickpoints[0].position,
                radius: distance,
                clickable: false,
                draggable: true
            });
        }
    }
}

function addItem() {
	switch(index) {
		case 1:
			var code = document.getElementById('new-location-code').value;
			var name = document.getElementById('new-location-name').value;
			var lat = document.getElementById('new-location-lat').value;
			var lng = document.getElementById('new-location-lng').value;
			var campus = {"id": 8, "campusCode":"BU","siteId":"BUNDOORA","campusName":"Bundoora","campusLatitude":"-37.720727","campusLongitude":"145.048395"};
			var data = {"code": code, "name": name, "latitude": lat, "longitude": lng, "campus": campus};//construction and group
			var apiCall = 'location';
			break;
		case 2:
			break;
	}
	console.log(index);
    var postdata = JSON.stringify(data);
	var xhr = new XMLHttpRequest();
	if("withCredentials" in xhr) {
		xhr.open('POST', apiEndpoint+apiCall, true);
	}
	else {
		console.log('fail 1');
		return false;
	}
	xhr.onload = function() {
		console.log('success');
		console.log(xhr.responseText);
	};
	xhr.onerror = function() {console.log('fail 2');};
	xhr.send(postdata);
}

function changeConstructionShape(index) {
    clearListeners();
    removeDrawings();
    if(index==0) {
        constructionModePolygon(index);
    }
    else {
        constructionModeCircle(index);
    }
}

function resetAmenityInstance() {
    if(movedAmenityType!=null && movedAmenityIndex!=null) {
        amenities[movedAmenityType][movedAmenityIndex].marker.position = originalPositions[movedAmenityType][movedAmenityIndex];
        google.maps.event.clearListeners(amenities[movedAmenityType][movedAmenityIndex].marker, 'drag');
        amenities[movedAmenityType][movedAmenityIndex].marker.setDraggable(false);
        amenityMoved = false;
    }
}
function changePathpointPath(path) {
    if(document.getElementById('new-pathpoint-path').selectedIndex==0) {
        document.getElementById('new-pathpoint-index').value = 1;
    }
    else {
        var path = document.getElementById('new-pathpoint-path').value;
        document.getElementById('new-pathpoint-index').value = paths[path].points.length+1;
        changePathVisibility(path,true);
    }
}

function overrideEdit(index) {
    document.getElementById('new-item-wrapper').classList.add('hidden');
    document.getElementById('edit-item-wrapper').classList.remove('hidden');
    map.setOptions({ draggableCursor: 'hand' });
    clearListeners();
    removeDrawings();
    for(var i=0;i<fields.length;++i) {
        document.getElementById('editItem'+fields[i]).classList.toggle('hidden',index!=(i+1));
    }
    switch(index) {
        case 1:
            document.getElementById('edit-location-code').value = locations[selectedLocationIndex].code;
            document.getElementById('edit-location-name').value = locations[selectedLocationIndex].name;
            document.getElementById('edit-location-lat').value = locations[selectedLocationIndex].marker.position.lat();
            document.getElementById('edit-location-lng').value = locations[selectedLocationIndex].marker.position.lng();
            document.getElementById('edit-location-construction').selectedIndex = locations[selectedLocationIndex].construction ? 1 : 0;
            fillGroupsDropdown('edit-location-group');
            document.getElementById('edit-location-group').selectedIndex = getDropdownIndex('edit-location-group',locations[selectedLocationIndex].group);
            break;
        case 2:
            break;
        case 3:
            document.getElementById('edit-amenitytype-id').value = selectedAmenityType;
            document.getElementById('edit-amenitytype-text').value = amenityOptions[selectedAmenityType].text;
            document.getElementById('edit-amenitytype-display').selectedIndex = amenityOptions[selectedAmenityType].display ? 1 : 0;
            document.getElementById('edit-amenitytype-colour').value = amenityOptions[selectedAmenityType].colour;
            document.getElementById('edit-amenitytype-svg').value = amenityOptions[selectedAmenityType].placesvg;
            break;
        case 4:
            fillAmenityTypesDropdown('edit-ai-type');
            document.getElementById('edit-ai-type').selectedIndex = getDropdownIndex('edit-ai-type',selectedAmenityType);
            document.getElementById('edit-ai-text').value = amenities[selectedAmenityType][selectedAmenityIndex].text;
            document.getElementById('edit-ai-lat').value = amenities[selectedAmenityType][selectedAmenityIndex].marker.position.lat();
            document.getElementById('edit-ai-lng').value = amenities[selectedAmenityType][selectedAmenityIndex].marker.position.lng();
            amenities[selectedAmenityType][selectedAmenityIndex].marker.setDraggable(true);
                amenities[selectedAmenityType][selectedAmenityIndex].marker.addListener('drag', function() {
                    movedAmenityType = selectedAmenityType;
                    movedAmenityIndex = selectedAmenityIndex;
                    document.getElementById('edit-ai-lat').value = this.position.lat();
                    document.getElementById('edit-ai-lng').value = this.position.lng();
            });
            break;
        case 5:
            break;
        case 6:
            break;
        case 7:
            document.getElementById('new-construction-shape').selectedIndex = 0;
    }
}

function getDropdownIndex(element,search) {
    var dropdown = document.getElementById(element);
    var groupIndex = 0;
    for(var i=0;i<dropdown.options.length;++i) {
        if(search==dropdown.options[i].value) {
            groupIndex = i;
        }
    }
    return groupIndex;
}

function fillGroupsDropdown(element) {
    var list = document.getElementById(element);
    while (list.lastChild) {
        list.removeChild(list.lastChild);
    }
    list.insertAdjacentHTML('beforeend', '<option value="0">None</option>');
    for (group in groups) {
        if (groups.hasOwnProperty(group)) {
            list.insertAdjacentHTML('beforeend', '<option value="' + group + '">' + groups[group].text + '</option>');
        }
    }
}

function fillAmenityTypesDropdown(element) {
    var list = document.getElementById(element);
    while (list.lastChild) {
        list.removeChild(list.lastChild);
    }
    list.insertAdjacentHTML('beforeend', '<option value="0">Select amenity type</option>');
    for (amenity in amenityOptions) {
        if (amenityOptions.hasOwnProperty(amenity)) {
            list.insertAdjacentHTML('beforeend', '<option value="' + amenity + '">' + amenityOptions[amenity].text + '</option>');
        }
    }
}

function clearListeners() {
    google.maps.event.clearListeners(map, 'click');
    google.maps.event.clearListeners(map, 'drag');
    google.maps.event.clearListeners(map, 'dragend');
    google.maps.event.clearListeners(map, 'mousemove');
    google.maps.event.clearListeners(map, 'rightclick');
    document.removeEventListener('keydown',polylineKeydown);
    document.removeEventListener('keydown',polygonKeydown);
}

function removeDrawings() {
    if(clickpoints.length) {
        clickline.setMap(null);
        line.setMap(null);
        for(var i=0;i<clickpoints.length;++i) {
            clickpoints[i].setMap(null);
        }
        clickpoints = [];
        updateMidpoints(7);
        if(circle!=null) {
            circle.setMap(null);
            circle = null;
        }
    }
}

function selectNewItem(typeIndex) {
    if(selectedLocationIndex!=null) {
        locations[selectedLocationIndex].marker.setIcon(encodeSvg(getTextSvg(locations[selectedLocationIndex].type,mousedLocationIndex==selectedLocationIndex,false,locations[selectedLocationIndex].name,locations[selectedLocationIndex].code)));
        selectedLocationIndex = null;
    }
    if(selectedAmenityType!=null || selectedAmenityIndex!=null) {
        toggleAmenity(selectedAmenityType,false);
        selectedAmenityType = null;
        selectedAmenityIndex = null;
    }
    index = typeIndex;
    document.getElementById('filter-locations').value = 'New item';
    updateLocationResults();
    outerContainer.classList.add('show-building-info');
    map.setOptions({ draggableCursor: 'crosshair' });
    selectedType = 0;
    if(selectedLocationIndex!=null) {
        locations[selectedLocationIndex].marker.setIcon(encodeSvg(getTextSvg(locations[selectedLocationIndex].type,mousedLocationIndex==selectedLocationIndex,false,locations[selectedLocationIndex].name,locations[selectedLocationIndex].code)));
    }
    outerContainer.classList.add('show-building-info');
    document.getElementById('building-image').src = placeholderBuilding;
    document.getElementById('rooms').classList.add('hidden');
    document.getElementById('new-item-wrapper').classList.remove('hidden');
    document.getElementById('edit-item-wrapper').classList.add('hidden');
    document.getElementById('new-type').selectedIndex = index;
    newItemChangeCategory();
    openDrawer();
}

function newItemChangeCategory() {
    clearListeners();
    removeDrawings();
    switch(index) {
        case 0:
            return false;
        case 1:
            document.getElementById('new-location-code').value = '';
            document.getElementById('new-location-name').value = '';
            document.getElementById('new-location-lat').value = '';
            document.getElementById('new-location-lng').value = '';
            document.getElementById('new-location-construction').selectedIndex = 0;
            fillGroupsDropdown('new-location-group');
            map.addListener('click', function (event) {
                document.getElementById('new-location-lat').value = event.latLng.lat();
                document.getElementById('new-location-lng').value = event.latLng.lng();
            });
            break;
        case 2:
            document.getElementById('new-group-id').value = '';
            document.getElementById('new-group-name').value = '';
            document.getElementById('new-group-lat').value = '';
            document.getElementById('new-group-lng').value = '';
            map.addListener('click', function (event) {
                document.getElementById('new-group-lat').value = event.latLng.lat();
                document.getElementById('new-group-lng').value = event.latLng.lng();
            });
            break;
        case 3:
            document.getElementById('new-amenitytype-id').value = '';
            document.getElementById('new-amenitytype-text').value = '';
            document.getElementById('new-amenitytype-display').selectedIndex = 0;
            document.getElementById('new-amenitytype-colour').value = '';
            document.getElementById('new-amenitytype-svg').innerHTML = '';
            map.setOptions({ draggableCursor: 'hand' });
            break;
        case 4:
            fillAmenityTypesDropdown('new-ai-type');
            var list = document.getElementById('new-ai-type');
            if(list.options.length) {
                document.getElementById('new-ai-text').value = '';
                document.getElementById('new-ai-lat').value = '';
                document.getElementById('new-ai-lng').value = '';
                map.addListener('click', function (event) {
                    document.getElementById('new-ai-lat').value = event.latLng.lat();
                    document.getElementById('new-ai-lng').value = event.latLng.lng();
                });
            }
            else {
                alert('You must define an amenity type before you can define an instance of it.');
                selectNewItem(3);
                return false;
            }
            break;
        case 5:
            document.getElementById('new-path-id').value = '';
            document.getElementById('new-path-name').value = '';
            var list = document.getElementById('new-path-coordslist');
            while (list.lastChild) {
                list.removeChild(list.lastChild);
            }
            list.insertAdjacentHTML('beforeend','<p>Define a set of points by clicking on the map.</p>');
            clickpoints = [];
            map.addListener('mousemove', polyMousemove);
            map.addListener('click', function (event) {
                if(clickpoints.length>0) {
                    var list = document.getElementById('new-path-coordslist');
                    while (list.lastChild) {
                        list.removeChild(list.lastChild);
                    }
                    list.insertAdjacentHTML('beforeend','<p>Press enter to select this path, or escape to cancel.</p>');
                }
                clickpoints.push(
                    new google.maps.Marker({
                        map: map,
                        position: event.latLng,
                        icon: encodeSvg(editPoint),
                        text: clickpoints.length
                    })
                );
                clickpoints[clickpoints.length-1].addListener('rightclick', polylineRightclick);
                var positions = [];
                for(var i=0;i<clickpoints.length;++i) {
                    positions.push(clickpoints[i].position);
                }
                if(clickpoints.length==1) {
                    document.addEventListener('keydown',polylineKeydown);
                }
                if(clickpoints.length>1) {
                    clickline.setMap(null);
                }
                clickline = new google.maps.Polyline({
                    map: map,
                    path: positions,
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    clickable: false
                });
            });
            break;
        case 6:
            var list = document.getElementById('new-pathpoint-path');
            while (list.lastChild) {
                list.removeChild(list.lastChild);
            }
            list.insertAdjacentHTML('beforeend', '<option value="0">Select path</option>');
            for (path in paths) {
                if (paths.hasOwnProperty(path)) {
                    list.insertAdjacentHTML('beforeend', '<option value="' + path + '">' + paths[path].text + '</option>');
                }
            }
            if(list.options.length) {
                var indexElement = document.getElementById('new-pathpoint-index');
                indexElement.disabled = true;
                indexElement.value = 1;
                map.addListener('click', function (event) {
                    document.getElementById('new-pathpoint-lat').value = event.latLng.lat();
                    document.getElementById('new-pathpoint-lng').value = event.latLng.lng();
                });
            }
            else {
                alert('You must define a path before you can define a pathpoint for it.');
                selectNewItem(5);
                return false;
            }
            break;
        case 7:
            if(document.getElementById('new-construction-shape').selectedIndex==0) {
                constructionModePolygon(index);
            }
            else {
                constructionModeCircle(index);
            }
            break;
    }
    for(var i=0;i<fields.length;++i) {
        document.getElementById('newItem'+fields[i]).classList.toggle('hidden',index!=(i+1));
    }
}

function constructionModeCircle(index) {
    document.getElementById('new-construction-polygon').classList.add('hidden');
    document.getElementById('new-construction-circle').classList.remove('hidden');
    map.addListener('click', function(event) {
        switch(clickpoints.length) {
            case 0:
                clickpoints.push(
                    new google.maps.Marker({
                        position: event.latLng,
                        map: map,
                        icon: encodeSvg(editPoint),
                        draggable: true,
                        text: clickpoints.length
                    })
                );
                document.getElementById('new-construction-circle-lat').value = event.latLng.lat();
                document.getElementById('new-construction-circle-lng').value = event.latLng.lng();
                map.addListener('mousemove', circleMousemove);
                clickpoints[0].addListener('drag',function(e) {
                    this.setPosition(e.latLng);
                    circle.setCenter(this.position);
                    clickpoints[1].setPosition(offsetCoordinates(this.position,distance,0));
                    document.getElementById('new-construction-circle-lat').value = e.latLng.lat();
                    document.getElementById('new-construction-circle-lng').value = e.latLng.lng();
                    document.getElementById('new-construction-circle-radius').value = circle.radius;
                });
                break;
            case 1:
                clearListeners();
                distance = google.maps.geometry.spherical.computeDistanceBetween(event.latLng,clickpoints[0].position);
                clickpoints.push(
                    new google.maps.Marker({
                        position: offsetCoordinates(clickpoints[0].position,distance,0),
                        map: map,
                        icon: encodeSvg(extendPoint),
                        draggable: true
                    })
                );
                clickpoints[1].addListener('drag',function(e) {
                    this.setPosition(e.latLng);
                    distance = google.maps.geometry.spherical.computeDistanceBetween(this.position,clickpoints[0].position);
                    circle.setRadius(distance);
                    document.getElementById('new-construction-circle-radius').value = distance;
                });
                break;
        }
    });
}

function offsetCoordinates(initial,offsetHorizontal,offsetVertical) {
    var earthRadius = 6378137;
    dLat = offsetVertical/earthRadius;
    dLon = offsetHorizontal/(earthRadius*Math.cos(Math.PI* initial.lat()/180));
    latO = initial.lat() + dLat * 180/Math.PI;
    lngO = initial.lng() + dLon * 180/Math.PI;
    return {lat:latO,lng:lngO};
}

function constructionModePolygon(index) {
    document.getElementById('new-construction-polygon').classList.remove('hidden');
    document.getElementById('new-construction-circle').classList.add('hidden');
    inserted = false;
    newm = new google.maps.Marker();
    var list = document.getElementById('new-construction-path');
    while (list.lastChild) {
        list.removeChild(list.lastChild);
    }
    clickpoints = [];
    map.addListener('mousemove', polyMousemove);
    map.addListener('click', function (event) {
        linked = true;
        var clickmarker = new google.maps.Marker({
            position: event.latLng,
            map: map,
            icon: encodeSvg(editPoint),
            draggable: false,
            text: clickpoints.length
        });
        if (!clickpoints.length) {
            document.addEventListener('keydown',polygonKeydown);
            clickmarker.addListener('click', function () {
                linked = false;
                clickpoints.push(clickmarker);
                if (clickpoints.length > 2) {
                    var points = [];
                    for (var i = 0; i < clickpoints.length; ++i) {
                        points.push(clickpoints[i].position);
                    }
                    document.getElementById('new-construction-path').innerHTML = JSON.stringify(points);
                    google.maps.event.clearListeners(map, 'mousemove');
                    google.maps.event.clearListeners(map, 'click');
                    clickline.setMap(null);
                    line.setMap(null);
                    for (var k=0;k<clickpoints.length;++k) {
                        clickpoints[k].setDraggable(true);
                        clickpoints[k].addListener('drag', function (e) {
                            var i = parseInt(this.text);
                            this.setPosition(e.latLng);
                            if (i == 0 || i == clickpoints.length - 1) {
                                clickpoints[0].setPosition(this.getPosition());
                                clickpoints[clickpoints.length - 1].setPosition(this.getPosition());
                            }
                            clickpoints[i].setPosition(this.getPosition());
                            line.setMap(null);
                            clickline.setMap(null);
                            var positions = [];
                            for (var i = 0; i < clickpoints.length; ++i) {
                                positions.push(clickpoints[i].position);
                            }
                            clickline = new google.maps.Polygon({
                                map: map,
                                paths: [positions],
                                geodesic: true,
                                strokeColor: '#FF0000',
                                strokeOpacity: 1.0,
                                strokeWeight: 2,
                                fillColor: '#FF0000',
                                fillOpacity: 0.3
                            });
                            updateMidpoints(index);
                        });
                    }
                }
                var positions = [];
                for (var i = 0; i < clickpoints.length; ++i) {
                    positions.push(clickpoints[i].position);
                }
                line.setMap(null);
                clickline.setMap(null);
                clickline = new google.maps.Polygon({
                    map: map,
                    paths: [positions],
                    geodesic: true,
                    strokeColor: '#FF0000',
                    strokeOpacity: 1.0,
                    strokeWeight: 2,
                    fillColor: '#FF0000',
                    fillOpacity: 0.3
                });
                updateMidpoints(index);
            });
        }
        else {
            clickline.setMap(null);
        }
        if (linked) {
            clickpoints.push(clickmarker);
            c = true;
        }
        var positions = [];
        for (var b=0;b<clickpoints.length;++b) {
            positions.push(clickpoints[b].position);
        }
        clickline = new google.maps.Polyline({
            map: map,
            path: positions,
            geodesic: true,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
    });
}

function updateMidpoints(index) {
    for(var i=0;i<midpoints.length;++i) {
        midpoints[i].setMap(null);
    }
    midpoints = [];
    for(var i=0;i<clickpoints.length;++i) {
        if((i+1)<=clickpoints.length-1) {
            var midpoint = new google.maps.Marker({
                map: map,
                position: middle(clickpoints[i].position,clickpoints[i+1].position),
                icon: encodeSvg(extendPoint),
                text: i+1,
                draggable: true
            });
            midpoint.addListener('dragend', function(event) {
                inserted = false;
                updateMidpoints(index);
                var j = parseInt(this.text);
                clickpoints[j] = new google.maps.Marker({
                    map: map,
                    icon: encodeSvg(editPoint),
                    position: this.position,
                    draggable: true,
                    text: j
                });
                clickpoints[j].addListener('rightclick', function(e) {
                    if(clickpoints.length==2) {
                        return false;
                    }
                    var k = parseInt(this.text);
                    clickpoints[k].setMap(null);
                    clickpoints.splice(k,1);
                    for(var b=k+1;b<clickpoints.length;++b) {
                        clickpoints[b].text = b;
                    }
                    var positions = [];
                    for(var b=0;b<clickpoints.length;++b) {
                        positions.push(clickpoints[b].position);
                    }
                    clickline.setMap(null);
                    if(index==5) {
                        clickline = new google.maps.Polyline({
                            map: map,
                            path: positions,
                            geodesic: true,
                            strokeColor: '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: 2
                        });
                    }
                    else if(index==7) {
                        clickline = new google.maps.Polygon({
                            map: map,
                            paths: [positions],
                            geodesic: true,
                            strokeColor: '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: 2,
                            fillColor: '#FFFF00',
                            fillOpacity: 0.3
                        });
                    }
                    updateMidpoints(index);
                });
                clickpoints[j].addListener('drag', polypointDrag);
            });
            midpoint.addListener('drag', midpointDrag);
            midpoints.push(midpoint);
        }
    }
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

function middle(p1,p2) {
    var dLon = degreesToRadians(p2.lng() - p1.lng());
    var lat1 = degreesToRadians(p1.lat());
    var lat2 = degreesToRadians(p2.lat());
    var lon1 = degreesToRadians(p1.lng());
    var Bx = Math.cos(lat2) * Math.cos(dLon);
    var By = Math.cos(lat2) * Math.sin(dLon);
    var lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
    var lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
    return {lat: radiansToDegrees(lat3), lng:radiansToDegrees(lon3)};
}

function deleteItem() {
	var success = function(data) {
		switch(selectedType) {
			case 1:
				//group
				break;
			case 2:
				alert('Location deleted successfully.');
				locations[selectedLocationIndex].marker.setMap(null);
				locations.splice(selectedLocationIndex,1);
				outerContainer.classList.remove('show-building-info');
				generateSearchablesList();
				for(group in groups) {
					if(groups.hasOwnProperty(group)) {
						for(var i=0;i<groups[group].locations.length;++i) {
							var j = groups[group].locations[i];
							if(j==selectedLocationIndex) {
								groups[group].locations.splice(j,1);
							}
							else if(j>selectedLocationIndex) {
								j -= 1;
							}
							groups[group].locations[i] = j;
						}
					}
				}
				repaintSearchables();
				document.getElementById('filter-locations').value = '';
				updateLocationResults();
				break;
			case 3:
				alert('Amenity type deleted successfully.');
				delete amenities[selectedAmenityType];
				delete amenityOptions[selectedAmenityType];
				outerContainer.classList.remove('show-building-info');
				generateSearchablesList();
				repaintSearchables();
				document.getElementById('filter-locations').value = '';
				updateLocationResults();
				break;
			case 4:
				alert('Amenity deleted successfully.');
				amenities[selectedAmenityType][selectedAmenityIndex].marker.setMap(null);
				amenities[selectedAmenityType].splice(selectedAmenityIndex,1);
				outerContainer.classList.remove('show-building-info');
				generateSearchablesList();
				repaintSearchables();
				document.getElementById('filter-locations').value = '';
				updateLocationResults();
				break;
			case 5:
				alert('Path deleted successfully.');
				paths[itemIndex].display = !paths[itemIndex].display;
				renderPath(itemIndex);
				for(var i=0;i<paths[itemIndex].points.length;++i) {
					paths[itemIndex].points[i].setMap(null);
				}
				paths[itemIndex].path.setMap(null);
				delete paths[itemIndex];
				outerContainer.classList.remove('show-building-info');
				generateSearchablesList();
				repaintSearchables();
				document.getElementById('filter-locations').value = '';
				updateLocationResults();
				break;
		}
	}
	var failure = function() {console.log('fail 2');};
	if(selectedType==2) {
	//	if(amenities[selectedAmenityType].length) {
	//		alert('Amenities of this type still exist: please delete them first.');
	//		return false;
	//	}
	//This check should be done at the server.
	}
    var confirmed = confirm('Delete this item?');
    if(confirmed) {
        var itemIndex = 0;
		var apiPath;
        switch(selectedType) {
            case 1:
				break;
			case 2:
                itemIndex = locations[selectedLocationIndex].id;
				apiPath = 'location';
                break;
            case 3:
                itemIndex = selectedAmenityType;
				apiPath = 'category';
                break;
            case 4:
                itemIndex = amenities[selectedAmenityType][selectedAmenityIndex].id;
				apiPath = 'location';
                break;
            case 5:
                itemIndex = selectedPath;
				apiPath = '';//something goes here
                break;
		}
		xhr('DELETE','json',apiEndpoint+apiPath+'/'+itemIndex,success,failure);
	}
}