/**
 * jQuery HTML5 GeoLocation LookUp Plugin. This Plugin will perform geocoder lookups on
 * elements in the page, and will calulate distance based on visitor geo location.
 *
 * @option              apiKey          Google API key to use, for loading google maps
 * @option              geodata         Selector / Element for geodata
 * @option              notification    Selector / Element for notification elements
 * @option              recheck         Selector / Element for recheck element
 * @option              distance        Selector / Element for distance element
 * @option              geoAdr          Selector / Element for .adr element containing location data
 * @option              listElement     Selector / Element for the element(s) containing location data
 *
 *
 *
 * @method              location        Run plugin with optional parameters
 * @method              version         Output plugin version
 *
 *
 * @note
 * 		this plugin requires jquery library, along with google api + google maps api.
 *
 *		if google api is not already loaded;
 *		Provide your google api key, and this plugin will attempt to load the google apis dynamically
 *		The jquery library should be loaded within your html, if using this plugin to load google apis.
 *
 * @usage
 *
 *      $('#location_container').location();
 *
 *      or
 *
 *      $('#locations').location( { apiKey: 'YOUR_API_KEY_HERE', geodata: '#geodata', notification: '.notification' } );
 *
 *
 * @example HTML Markup
 *
 *
 *			data-latitude & data-longitude are optional, plugin will attempt to look up
 *			 postal address values
 *
 *  		<div class="adr" data-latitude="##.######" data-longitude="##.######">
 *				<span class="street-address">Street Address Value</span>
 *				<span class="locality">City Name Value</span>,
 *				<span class="region">State Value</span>
 *				<span class="postal-code">Postal Code Value</span>
 *				<span class="country-name">Country Value</span>
 *			 </div>
 *
 *
 *
 * Copyright (c) 2010 Christopher Schmitt
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *
 * @author				Christopher Schmitt <http://christopherschmitt.com/>
 * @author				Ryon Labaw <rlabaw@gmail.com>
 * @author				Kyle Simpson <http://getify.com>
 * @author				Marc Grabanski <http://marcgrabanski.com/>
 *
 * @version             1.0.0
 *
 * @changelog
 *      + 1.0.0         First release
 *
 *
 */



if (typeof(jQuery) == 'undefined')
{
	alert('jquery library was not found.');
}

(function( $ ){

	$.fn.extend($.fn, {

	loadGoogle: function ( ) {

		if (typeof(google) != 'undefined' && typeof(google.load) != 'undefined') {
			google.load("maps", "3",{"other_params":"sensor=true", callback: 
				function(){
					$(this).location(options);
				}});
			return;
		}

		$.getScript('http://www.google.com/jsapi?key='+options.apiKey,
		function() {
			$(this).location(options);
		});
	},

	runApp : function( ) {

     	i = 0;
	     $(options.selector+" "+options.notification).show();
		num_locations = $(options.selector+" "+options.listElement).length;
	     xlocations = $(options.selector+" "+options.listElement).detach();

	     if (!tc)
	     {
	      	$(this).getGeo();
	     }

     },

     getGeo : function ( ) {

		 if (!tc)
		 {
		 	// timeout geolocation request, fallback on loader.ClientLocation
		 	setTimeout(function(){tc++;  $(this).getGeo();},500);
		 }

	      if (!tc && navigator.geolocation)
		 {
       		navigator.geolocation.getCurrentPosition(
					function (position) {
						tc++;
						if (position && typeof(position.coords) != 'undefined')
						{
			 				$(this).updateMyLocation( position.coords.latitude,position.coords.longitude );

						     $(this).sortLocations( position.coords.latitude, position.coords.longitude );
   						}
					},$(this).getGeo); //,{enableHighAccuracy:true});

	      } else if (tc < 2) {
				if ((typeof google == 'object') && google.loader && google.loader.ClientLocation) {
					$(this).updateMyLocation( google.loader.ClientLocation.latitude,google.loader.ClientLocation.longitude );
			          $(this).sortLocations( google.loader.ClientLocation.latitude, google.loader.ClientLocation.longitude );
		        	}
	      }
	},
	sortLocations : function ( lat, lng ) {

		i		= 0;
		point 	= new google.maps.LatLng(lat, lng);

		addresses = $(xlocations).map(function(){
			var $adr = $(this).find(options.geoAdr), latLng = null, lat, lng;
			latLng = ((lat = $adr.attr("data-latitude")) && (lng = $adr.attr("data-longitude")))?new google.maps.LatLng(lat,lng):null;
			return { "text": $adr.find('.street-address').text() +' , '+ $adr.find('.locality').text() +' , '+ $adr.find('.region').text() +' '+$adr.find('.postal-code').text(), "latLng":latLng, "div": $(this) };
		});

		$(addresses).each( function( i, el ) {
			var dest = el.latLng || el.text;
			directions.route({ "origin": point, "destination": dest, "travelMode": google.maps.DirectionsTravelMode.DRIVING },
				function ( result, status ) {
					if (typeof(addresses[i]) != 'undefined')
					{
						addresses[i].distance = (status == "OK")?result.routes[0].legs[0].distance.value:'unknown';
						$(this).count();
					}
			});
		});
	},

	count : function ( ) {
		i++;
		if (i === num_locations) {
			$(this).sortItems();
		}
	},

	sortItems : function ( ) {
		addresses.sort(function(a,b){ return a.distance - b.distance; });
		$(addresses).each(function(i, address){
		  	$(address.div).find(options.distance).text($(this).formatDistance(address.distance));
			$(options.selector+" ol").append( address.div );
		});
		$(options.selector+" "+options.notification).hide();
		$(this).showRecheckControl();
	},

	formatDistance : function ( distance ) {
		var dist = distance, meters_to_mile = 1609.344;
		if (dist > (meters_to_mile/10)) {
			dist = (Math.round((dist/meters_to_mile)*10) / 10) +" miles";
		} else {
			dist = (parseFloat(dist) == dist)? dist+" meters" : dist = "unknown";
		}
		return dist;
	},

	updateMyLocation : function ( lat, lng )	{
		var myloc = new google.maps.LatLng(lat,lng);
	  	var req = {latLng:myloc} ;

		geocoder.geocode(req,function(responses,status){
		  	if (status == "OK") {
				var geoloc = responses[0].formatted_address;
				$(options.geodata).text(geoloc);
			} else {
				//error
			}
		});

	},

	showRecheckControl : function ( ) {
		$(options.recheck).show().click(function(evt){
			$(this).unbind("click").hide();
			$(this).runApp();
			evt.preventDefault();
			return false;
		});
	},
	version: function ( ) {
		return (typeof(options)!='undefined')?options.version:'1.0.0';
	},
  	location : function ( opts ) {

		var defaults 		= {
						apiKey   			: '',
						selector 			: '#locations',
						geodata 			: '#geodata',
						notification  		: '.notification',
						recheck 			: '#recheck',
						distance 			: '.distance',
						geoAdr  			: '.adr',
						listElement   		: 'li',
						version 			: ''
						};

		options 			= $.extend(defaults, opts);
		options.version	= '1.0.0';
		addresses 		= {};
		xlocations 		= {};
		num_locations 		= 0;
		tc 				= 0;
		i 				= 0;

		if ((typeof(google) == 'undefined') || (typeof(google.load) == 'undefined') || (typeof(google.maps) == 'undefined')) {
			$(this).loadGoogle();
			return;
		}

		directions	= new google.maps.DirectionsService();
		geocoder 		= new google.maps.Geocoder();
		

		return this.each(function() {
			$(this).runApp();
		});

	}

	});

})( jQuery );

