var overlays = {
		"Insitutions and People": {
			"<img src='img/school.png' width='24' height='28'><span style='color: rgba(225, 55, 65,1)'>&nbsp;Formal Education</span>": schools,
			"<img src='img/university.png' width='24' height='28'><span style='color: rgba(121, 158, 210, 1)'>&nbsp;Research</span>": research,
			"<img src='img/museum_science.png' width='24' height='28'><span style='color: rgba(104, 217, 90, 1)'>&nbsp;Informal Education</span>": informal
		},
		"Stewardship and Workkshops": {
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

