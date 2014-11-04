function createDropdown(account_input, sql_input, type){
	
	//var sql_input = 'SELECT DISTINCT location from institution order by location';
	if (type == 'people'){
		$.ajax({ 
		async: false, 
		url: 'http://' + account_input + '.cartodb.com/api/v2/sql/?q=' + sql_input, 
		dataType: "json", 
		success: function(data) {

			$.each(data.rows, function(index, val) {
				//console.log(val.location);

				$('#peopleDropdown').append('<li><a href="#" class="locationPeople">' + val.location + '</a></li>');

			});
		} 
	});
	} else if (type == 'workshop') {
		$.ajax({ 
		async: false, 
		url: 'http://' + account_input + '.cartodb.com/api/v2/sql/?q=' + sql_input, 
		dataType: "json", 
		success: function(data) {

			$.each(data.rows, function(index, val) {
				//console.log(val.location);

				$('#workshopDropdown').append('<li><a href="#" class="locationWorkshops">' + val.location + '</a></li>');

			});
		} 
	});
	}
	
}

function contentByLocation(account_input, place){
	
	//var sql_input = "SELECT people.* FROM people FULL OUTER JOIN institution ON institution.name = people.institutionname WHERE location = 'Duluth, MN'";
	var sql_input = "SELECT ST_AsGeoJSON(institution.the_geom) as geom, people.photolink, people.email, people.subject, people.firstname, people.lastname, people.link, people.linkdescription , institution.category, people.institutionname, level, location, name FROM institution FULL OUTER JOIN people on institution.name = people.institutionname WHERE institution.location = '" + place +"'";
	$.ajax({ 
		async: false, 
		url: 'http://' + account_input + '.cartodb.com/api/v2/sql/?q=' + sql_input, 
		dataType: "json", 
		success: function(data) {
			
			var peopleList = [];
			var institutionList = [];
			
			$.each(data.rows, function(index, val) {

				//Institution Details
				var category = val.category;
				var name = val.name;
				var level = val.level;
				var location = val.location;
				var link = val.link;
				var linkdescription = val.linkdescription;

				//People Details
				var firstname = val.firstname;
				var lastname = val.lastname;
				var email = val.email;
				var institutionname = val.institutionname;
				var subject = val.subject;
				var photolink = val.photolink;

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
			locationModal(institutionList,peopleList);
			

		} 
	});
}

function locationModal(institution, peopleList){

	var contentString = "";
	var locationList = [];

	for (var i = institution.length - 1; i >= 0; i--) {
		
		var inst = institution[i];
		var person = [];

		for (var j = peopleList.length - 1; j >= 0; j--) {

			if (inst.name == peopleList[j].institutionname){

				person.push(peopleList[j]);

			} else {
				//ERROR
			}
		}

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

					var contentEmail;
					if (personA.email){
						contentEmail = '<p><a href="mailto:' + personA.email + '">' + personA.email + '</a></p>';
					} else {
						contentEmail = '';
					}
					
					var contentLink;
					if (personA.link){

						if (personA.linkdescription){
							contentLink = '<p><a href="' + personA.link + '" target="_blank">Web link:</a><small> ' + personA.linkdescription + ' </small></p>';
						} else {
							contentLink = '<p><a href="' + personA.link + '" target="_blank">More info</a></p>';
						}

					} else {
						contentLink = '';
					}

					string += '<div class="row" style="margin-left:10px;padding-top:10px;margin-right:15px;"><div class="col-md-9 col-xs-12"><p class="text-info"><strong>' + personA.firstname + ' ' + personA.lastname + '</strong>' + contentSubject + contentEmail + contentLink + '</div><div class="col-md-3 hidden-xs">' + contentPhoto + '</div></div>';
					
				};
				return string;
			} else {
				var string = "";
				return string;
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

			var content = '<h4><span class="text-muted"><img src="img/school.png">School:</span> ' + inst.name + '</h4><div class="row" style="margin-left:10px;padding-top:10px;"><p>Grade Level: ' + level + '</p><p>Location: ' + inst.location + '</p></div><div class="peopleIndent"><h4>Teachers:</h4>' + peopleIterate(person) + '</div>';
			contentString += content;
			locationList.push([inst.lat,inst.lng]);


		} else if (inst.category == 'RESEARCH INSTITUTION'){
			
			var content = '<h4><span class="text-muted"><img src="img/university.png">Research Institution:</span> ' + inst.name + '</h4><div class="row" style="margin-left:10px;padding-top:10px;"><p>Location: ' + inst.location + '</p></div><div class="peopleIndent"><h4>Researcher(s):</h4>' + peopleIterate(person) + '</div>';
			contentString += content;
			locationList.push([inst.lat,inst.lng]);
		

		} else if (inst.category == 'INFORMAL RESEARCH'){
			content = '<h4><span class="text-muted"><img src="img/museum_science.png">CGLL Partner Institution:</span> ' + inst.name + '</h4>' + '<div class="row" style="margin-left:10px;padding-top:10px"><p>Location: ' + inst.location + '</p></div><div class="peopleIndent"><h4>Contact(s):</h4>' + peopleIterate(person) + '</div>';
			contentString += content;
			locationList.push([inst.lat,inst.lng]);
			
		} else {
			console.log('Error: Incorrect category name for this record');
		}
	}
	map.setView(locationList[0],12);
	$('#modal-body').html(contentString);
	$('#myModal').modal();
	

}

function workshopsByLocation(account_input, place){
	var sql_input = "SELECT ST_AsGeoJSON(workshops.the_geom) as geom, title, description, date, url, location, photolink FROM workshops WHERE location = '" + place + "'";
	console.log(account_input, place);
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

			console.log(workshopList);

			//Function call that passes all the query content to a new function for marker construction
			createWorkshopModal(workshopList);

		}
	});		
}

function createWorkshopModal(workshop){

	var contentList = "";

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
			var contentString = '<div><h4>Workshop</h4><div style="margin-left:10px;margin-top:20px;"><h5>' + point.title + '</h5><p>' + point.location + '</p><p>' + point.date + '</p><p>' + point.description + '</p><p>' + contentLink + '</p><p>' + contentPhoto + '</p></div></div>';
			
			contentList += contentString;

			// var marker = new L.marker([point.lat, point.lng],{icon:workshopsIcon})
			// 	.bindPopup(contentString)
			// 	.bindLabel(point.title)
			// 	.on('click',function(e){
			// 		//$('#info').html(e.target._popup._content);
			// 		$('#modal-body').html(e.target._popup._content);
			// 		$('#myModal').modal();

			// 	});
			// workshopLayer.addLayer(marker);

		};
		$('#modal-body').html(contentList);
		$('#myModal').modal();
}