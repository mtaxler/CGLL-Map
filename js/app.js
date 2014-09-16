var map;

$(document).ready(function(){
	$('#mapRefresh').click(function(){
		document.location.reload(true);
	});

	map = L.map('map').setView([45.403108, -84.672363], 6);
	var mapquest = new MQ.mapLayer();
	mapquest.addTo(map);

	$(window).on("resize", function() {
		$("#map")
		.height($(window).height() - ($('nav').height()+17))
		.width($(window).width());
		map.invalidateSize();
	}).trigger("resize");

	//CONFIG
	var account_name = 'cgll';
	var dropdownTypes = ['people','workshop'];
	var people_query = 'SELECT DISTINCT location from institution order by location';
	var workshop_query = 'SELECT DISTINCT location from workshops order by location';
	createDropdown(account_name, people_query, dropdownTypes[0]);
	createDropdown(account_name, workshop_query, dropdownTypes[1]);
	
	//Icon Set
	var institutionIcon = L.Icon.extend({
		options: {
			//iconSize: [32, 37]
			iconSize: [25,30]
		}
	});

	$('.locationPeople').click(function(){
		var location = this.innerHTML;
		contentByLocation(account_name, location);

	});
	$('.locationWorkshops').click(function(){
		var location = this.innerHTML;
		workshopsByLocation(account_name, location);
	});

	var schoolIcon = new institutionIcon({iconUrl: 'img/school.png'}),
	universityIcon = new institutionIcon({iconUrl: 'img/university.png'}),
	restorationIcon = new institutionIcon({iconUrl: 'img/restoration.png'}),
	informalIcon = new institutionIcon({iconUrl: 'img/museum_science.png'}),
	workshopsIcon = new institutionIcon({iconUrl: 'img/workshop.png'}),
	staffIcon = new institutionIcon({iconUrl: 'img/staff.png'});


	//Map Overlays

	var schools = new L.MarkerClusterGroup({
		iconCreateFunction: function(cluster){
			var childCount = cluster.getChildCount();
			return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster marker-cluster-schools', iconSize: new L.Point(40, 40) });
			}
	}).addTo(map);
	var research = new L.MarkerClusterGroup({
		iconCreateFunction: function(cluster){
			var childCount = cluster.getChildCount();
			return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster marker-cluster-research', iconSize: new L.Point(40, 40) });
			}
	}).addTo(map);
	var informal = new L.MarkerClusterGroup({
		iconCreateFunction: function(cluster){
			var childCount = cluster.getChildCount();
			return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster marker-cluster-informal', iconSize: new L.Point(40, 40) });
			}
	}).addTo(map);
	var stewardshipLayer = new L.MarkerClusterGroup({
		iconCreateFunction: function(cluster){
			var childCount = cluster.getChildCount();
			return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster marker-cluster-stewardship', iconSize: new L.Point(40, 40) });
			}
	}).addTo(map);
	var workshopLayer = new L.MarkerClusterGroup({
		iconCreateFunction: function(cluster){
			var childCount = cluster.getChildCount();
			return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster marker-cluster-workshop', iconSize: new L.Point(40, 40) });
			}
	}).addTo(map);
	var staff = new L.MarkerClusterGroup({
		iconCreateFunction: function(cluster){
			var childCount = cluster.getChildCount();
			return new L.DivIcon({ html: '<div><span>' + childCount + '</span></div>', className: 'marker-cluster marker-cluster-staff', iconSize: new L.Point(40, 40) });
			}
	}).addTo(map);

	var overlays = {
		"<b>Insitutions and People</b>": {
			"<img src='img/school.png' width='24' height='28'><span style='color: rgba(225, 55, 65,1)'>&nbsp;Formal Education</span>": schools,
			"<img src='img/university.png' width='24' height='28'><span style='color: rgba(121, 158, 210, 1)'>&nbsp;Research</span>": research,
			"<img src='img/museum_science.png' width='24' height='28'><span style='color: rgba(104, 217, 90, 1)'>&nbsp;Informal Education</span>": informal,
			"<img src='img/staff.png' width='24' height='28'><span style='color: rgba(164, 54, 94, 1)'>&nbsp;CGLL Staff</span>": staff
		},
		"<b>Stewardship and Workshops</b>": {
			"<img src='img/restoration.png' width='24' height='28'><span style='color: rgba(23, 126, 61, 1)'>&nbsp;Stewardship/Monitoring</span>": stewardshipLayer,
			"<img src='img/workshop.png' width='24' height='28'><span style='color: rgba(198, 175, 34, 1)'>&nbsp;Workshops</span>": workshopLayer
		}
	}
	//Layer Control
	var layerControlOptions = {
		position: 'topright',
		collapsed: false
	}
	L.control.groupedLayers(null, overlays, layerControlOptions).addTo(map);

	populateMap(account_name);


	function populateMap(account){  //Adds initial content to the map
		var sql_institution = "SELECT ST_AsGeoJSON(institution.the_geom) as geom, people.photolink, people.email, people.subject, people.firstname, people.lastname, people.link, people.linkdescription, institution.category, people.institutionname, level, location, name FROM institution FULL OUTER JOIN people on institution.name = people.institutionname";
		var sql_stewardship = "SELECT ST_AsGeoJSON(stewardship.the_geom) as geom, name, description, location, photolink FROM stewardship";
		var sql_workshops = "SELECT ST_AsGeoJSON(workshops.the_geom) as geom, title, description, date, url, location, photolink FROM workshops";
		var sql_staff = "SELECT ST_AsGeoJSON(staff.the_geom) as geom, firstname, lastname, email, link, linkdescription, photolink, subject, institutionname FROM staff";
		runSQL(sql_institution, account, "institution");
		runSQL(sql_stewardship, account, "stewardship");
		runSQL(sql_workshops, account, "workshops");
		runSQL(sql_staff, account, "staff");
	}

	function runSQL(sql_input, account_input, type){  //Constructs AJAX query (synchronous) passing account name and a specified sql function
		//var rslt = false;
		if (type == "institution"){
			$.ajax({
				async: false,
				url: 'http://' + account_input + '.cartodb.com/api/v2/sql/?q=' + sql_input,
				dataType: "json",
				success: function(data) {
					var peopleList = [];
					var institutionList = [];

					//###### ADD CHECK FUNCTION TO MAKE SURE GEOMETRY EXISTS BEFORE PASSING DATA TO LATER FUNCTIONS
					$.each(data.rows, function(index, val) {
						//Institution Details
						var category = val.category;
						var name = val.name;
						var level = val.level;
						var location = val.location;

						//People Details
						var firstname = val.firstname;
						var lastname = val.lastname;
						var email = val.email;
						var institutionname = val.institutionname;
						var subject = val.subject;
						var photolink = val.photolink;
						var link = val.link;
						var linkdescription = val.linkdescription;

						//Object with all queried people
						var person = {
							firstname: firstname,
							lastname: lastname,
							email: email,
							institutionname: institutionname,
							subject: subject,
							photolink: photolink,
							link: link,
							linkdescription: linkdescription
						}

						peopleList.push(person);

						//Geometry Creation
						var geom = JSON.parse(val.geom);
						var lat = geom.coordinates[1];
						var lng = geom.coordinates[0];

						//Object with all queried institutions
						var institution = {
							name:name,
							category:category,
							level:level,
							location:location,
							lat:lat,
							lng:lng
						}

						institutionList.push(institution);
					});
					//Function call that passes all the query content to a new function for marker construction
					createMarkers(institutionList,peopleList);
				}
			});
		} else if (type == "stewardship"){

			$.ajax({
				async: false,
				url: 'http://' + account_input + '.cartodb.com/api/v2/sql/?q=' + sql_input,
				dataType: "json",
				success: function(data) {
					if (data == true) {
						rslt = true;
					}

					var stewardshipList = [];

					$.each(data.rows, function(index, val) {

						//Stewardship Location Details
						var name = val.name;
						var location = val.location;
						var description = val.description;
						var photolink = val.photolink;

						//Geometry Creation
						var geom = JSON.parse(val.geom);
						var lat = geom.coordinates[1];
						var lng = geom.coordinates[0];

						//Object with all queried places
						var stewardshipPlace = {
							name: name,
							location: location,
							description: description,
							photolink: photolink,
							lat: lat,
							lng: lng
						}
						stewardshipList.push(stewardshipPlace);
					});

					//Function call that passes all the query content to a new function for marker construction
					createStewardshipMarkers(stewardshipList);
				}
			});

		} else if (type == "workshops"){

			$.ajax({
				async: false,
				url: 'http://' + account_input + '.cartodb.com/api/v2/sql/?q=' + sql_input,
				dataType: "json",
				success: function(data) {
					if (data == true) {
						rslt = true;
					}
					var workshopList = [];

					$.each(data.rows, function(index, val) {
						
						//Stewardship Location Details
						var title = val.title;
						var location = val.location;
						var description = val.description;
						var photolink = val.photolink;
						var url = val.url;
						var date = val.date;

						//Geometry Creation
						var geom = JSON.parse(val.geom);
						var lat = geom.coordinates[1];
						var lng = geom.coordinates[0];

						//Object with all queried places
						var workshopPlace = {
							title: title,
							location: location,
							description: description,
							photolink: photolink,
							url: url,
							date: date,
							lat: lat,
							lng: lng
						}

						workshopList.push(workshopPlace);

					});

					//Function call that passes all the query content to a new function for marker construction
					createWorkshopMarkers(workshopList);
				}
			});

		} else if (type = "staff"){
			$.ajax({
				async: false,
				url: 'http://' + account_input + '.cartodb.com/api/v2/sql/?q=' + sql_input,
				dataType: "json",
				success: function(data) {
					if (data == true) {
						rslt = true;
					}
					var staffList = [];

					$.each(data.rows, function(index, val) {
						
						//Stewardship Location Details
						var email = val.email;
						var firstname = val.firstname;
						var institutionname = val.institutionname;
						var lastname = val.lastname;
						var link = val.link;
						var linkdescription = val.linkdescription;
						var photolink = val.photolink;
						var subject = val.subject;

						//Geometry Creation
						var geom = JSON.parse(val.geom);
						var lat = geom.coordinates[1];
						var lng = geom.coordinates[0];

						//Object with all queried places
						var staffMember = {
							email: email,
							firstname: firstname,
							lastname: lastname,
							link: link,
							linkdescription: linkdescription,
							photolink: photolink,
							subject: subject,
							lat: lat,
							lng: lng
						}

						staffList.push(staffMember);

					});

					//Function call that passes all the query content to a new function for marker construction
					createStaffMarkers(staffList);
				}
			});

		}

	}

	function createStewardshipMarkers(stewardship){
		for (var i = stewardship.length - 1; i >= 0; i--) {
			var point = stewardship[i];
			var contentPhoto = '<img class="img-thumbnail img-responsive" style="width:300px;" src="' + point.photolink + '">';
			var contentString = '<h4>Stewardship in Action</h4><div style="margin-left:10px;margin-top:20px;"><h5>' + point.name + '</h5><p>' + point.location + '</p><p>' + point.description + '</p><p>' + contentPhoto + '</p></div>';
			var marker = new L.marker([point.lat, point.lng],{icon:restorationIcon})
				.bindPopup(contentString)
				.bindLabel(point.name)
				.on('click',function(e){
					//$('#info').html(e.target._popup._content);
					$('#modal-body').html(e.target._popup._content);
					$('#myModal').modal();

				});
			stewardshipLayer.addLayer(marker);
		};
	}

	function createWorkshopMarkers(workshop){
		for (var i = workshop.length - 1; i >= 0; i--) {

			var point = workshop[i];
			var contentPhoto;
			if (point.photolink){
				contentPhoto = '<img class="img-thumbnail img-responsive" style="width:250px;" src="' + point.photolink + '">';
			} else {
				contentPhoto = '';
			}
			var contentLink;
			if (point.url){
				contentLink = '<p><a href="' + point.url + '" target="_blank">' + point.url + '</p>';
			} else {
				contentLink = '';
			}
			var contentString = '<h4>Workshop</h4><div style="margin-left:10px;margin-top:20px;"><h5>' + point.title + '</h5><p>' + point.location + '</p><p>' + point.date + '</p><p>' + point.description + '</p><p>' + contentLink + '</p><p>' + contentPhoto + '</p></div>';
			var marker = new L.marker([point.lat, point.lng],{icon:workshopsIcon})
				.bindPopup(contentString)
				.bindLabel(point.title)
				.on('click',function(e){
					$('#modal-body').html(e.target._popup._content);
					$('#myModal').modal();

				});
			workshopLayer.addLayer(marker);
		};
	}

	function createStaffMarkers(staffMembers){
		for (var i = staffMembers.length - 1; i >= 0; i--) {



			var point = staffMembers[i];
			console.log(point);
			var contentPhoto;

			if (point.photolink){
				contentPhoto = '<img class="img-thumbnail img-responsive" style="width:100px; float: right; margin-bottom: 20px;" src="' + point.photolink + '">';
			} else {
				contentPhoto = '';
			}
			var contentLink;
			if (point.link){
				contentLink = '<p><a href="' + point.link + '" target="_blank">' + point.link + "</a>" + " - " + point.linkdescription + '</p>';
			} else {
				contentLink = '';
			}

			
			var contentString = '<h4>CGLL Staff Member</h4><div style="margin-left:10px;margin-top:20px;">' + contentPhoto + '<h5>' + point.firstname + " " + point.lastname + '</h5><p>' + point.subject + '</p><p>' + point.email + '</p><p>' + contentLink + '</p></div>';
			var marker = new L.marker([point.lat, point.lng],{icon:staffIcon})
				.bindPopup(contentString)
				.bindLabel(point.firstname + " " + point.lastname)
				.on('click',function(e){
					$('#modal-body').html(e.target._popup._content);
					$('#myModal').modal();

				});
			staff.addLayer(marker);
		};
	}

	function createMarkers(institution, peopleList){

		unique(institution);
		for (var i = institution.length - 1; i >= 0; i--) {
			var inst = institution[i];  //Look at institutions one at a time
			var person = []; //creates a list of people for each institution called 'person'

			for (var j = peopleList.length - 1; j >= 0; j--) {

				if (inst.name == peopleList[j].institutionname){
					person.push(peopleList[j]); //run the institution name against the current institution name 
				} else {
						//console.log('no match');
				}
			}

			//Marker creation differs depending on the institution category
			if (inst.category == 'SCHOOL'){
				var level = "";
				switch (inst.level){
					case "ELEMENTARY":
						level = "Elementary School";
						break;
					case "MIDDLE":
						level = "Middle School";
						break;
					case "HIGH":
						level = "High School";
						break;
					default:
						level = "School level not listed...";

				}

				var contentString = '<h4><span class="text-muted"><img src="img/school.png">School:</span> ' + inst.name + '</h4><div class="row" style="margin-left:10px;padding-top:10px;"><p>Grade Level: ' + level + '</p><p>Location: ' + inst.location + '</p></div><div class="peopleIndent"><h4>Teachers:</h4>' + peopleIterate(person) + '</div>';
				var marker = new L.marker([inst.lat, inst.lng],{icon:schoolIcon})
					.bindPopup(contentString)
					.bindLabel(inst.name)
					.on('click',function(e){
						//$('#info').html(e.target._popup._content);
						//var zoom = map.getZoom();
						//map.setView([inst.lat, inst.lng],12);
						
						$('#modal-body').html(e.target._popup._content);
						$('#myModal').modal();

					});
				schools.addLayer(marker);

			} else if (inst.category == 'RESEARCH INSTITUTION'){

				var contentString = '<h4><span class="text-muted"><img src="img/university.png">Research Institution:</span> ' + inst.name + '</h4><div class="row" style="margin-left:10px;padding-top:10px;"><p>Location: ' + inst.location + '</p></div><div class="peopleIndent"><h4>Researcher(s):</h4>' + peopleIterate(person) + '</div>';
				var marker = new L.marker([inst.lat, inst.lng],{icon:universityIcon})
				.bindPopup(contentString)
				.bindLabel(inst.name)
				.on('click',function(e){
					$('#modal-body').html(e.target._popup._content);
					$('#myModal').modal();
				});
				research.addLayer(marker);

			} else if (inst.category == 'INFORMAL RESEARCH'){
				var contentString = '<h4><span class="text-muted"><img src="img/museum_science.png">Informal Research Institution:</span> ' + inst.name + '</h4>' + '<div class="row" style="margin-left:10px;padding-top:10px"><p>Location: ' + inst.location + '</p></div><div class="peopleIndent"><h4>Contact(s):</h4>' + peopleIterate(person) + '</div>';
				var marker = new L.marker([inst.lat, inst.lng],{icon:informalIcon})
				.bindPopup(contentString)
				.bindLabel(inst.name)
				.on('click',function(e){
					$('#modal-body').html(e.target._popup._content);
					$('#myModal').modal();
				});
				informal.addLayer(marker);
			} else {
				console.log('Error: Incorrect category name for this record');
			}
		}
	}
});

//Simplifies popup construction for schools or institutions with multiple people
function peopleIterate(person){
	if(person.length > 0){
		var string = "";
		for (var i = person.length - 1; i >= 0; i--) {

			var personA = person[i];
			var contentSubject;
			if (personA.subject){
				contentSubject = '<p>Content area: ' + personA.subject + '</p>';
			} else {
				contentSubject = '';
			}

			var contentPhoto;
			if (personA.photolink){
				contentPhoto = '<img class="img-thumbnail img-responsive" style="height:100px;" src="' + personA.photolink + '">';
			} else {
				contentPhoto = '';
			}

			var contentLink;
			if (personA.link){

				if (personA.linkdescription){
					contentLink = '<p><a href="' + personA.link + '" target="_blank">More info</a> - ' + personA.linkdescription + '</p>';
				} else {
					contentLink = '<p><a href="' + personA.link + '" target="_blank">More info</a></p>';
				}

			} else {
				contentLink = '';
			}
			string += '<div class="row" style="margin-left:10px;padding-top:10px;margin-right:15px;"><div class="col-md-9 col-xs-12"><p class="text-info"><strong>' + personA.firstname + ' ' + personA.lastname + '</strong>' + contentSubject + '<p><a href="mailto:' + personA.email + '">' + personA.email + '</a></p>' + contentLink + '</div><div class="col-md-3 hidden-xs">' + contentPhoto + '</div></div>';

		};
		return string;
	} else {
		var string = "";
		return string;
	}
}
//Remove repeat institutions
function unique(a){
	a.sort();
	for(var i = 1; i < a.length; ){
	    if(a[i-1].lat == a[i].lat){
	        a.splice(i, 1);
	    } else {
	        i++;
	    }
	}
	return a;
}
