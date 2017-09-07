var PRTGServerUrl = "";

function getTicketStatus(status_raw) {
    switch (status_raw) {
        case 1:
            return "Open"
        case 2:
            return "Completed"
        case 3:
            return "Closed"
        default:
            return "Unknown"
    }
}

// This function will create the table containing the related tickets
// Requires that we pass the list of tickets from the API call
function addTicketsToRelatedTicketsTable(listOfTickets){

    // Get the element where our table will be added to.
    var relatedTicketSection = document.getElementById('relatedTicketSection');

    // We'll be create an HTML string here, I know its nasty, but it felt faster than creating elements individually
    // and having to create attributes and adding them and blehhh.. Anyways
    // The CSS will be set to match the CSS in other tables found in PRTG for UX consitancy.
    // What this string is doing is creating the table, the headers, and starts the table body (aka where the tickest will be added.)
    ticketSectionInnerHtml = "<table id='relatedTicketsTable' class='tablehasmenu table hoverable tickets'><thead class='tabletitle'><tr>Previous Tickets</tr></thead><thead class='headerswithlinks'><tr><th>Ticket#</th><th>Status</th><th>Priotity</th><th>Last Modified</th><th>Assigned to</th><th>Subject</th></tr></thead><tbody class='ui-selectable selectable-initialized'>"

    // Now we are going to go through each ticket and create a rows in the table body.
    listOfTickets.forEach(function(item){

        // The ticket status is just the icon, so I modified it to make it more readable
        // This will contain the icon
        var statusIcon = item.status

        // This will grab the raw(numeric) status and convert it into the name 
        var status = getTicketStatus(item.status_raw);

        // Add each property to the table columns, nothing fancy about this.
        ticketSectionInnerHtml += "<tr class='relatedTicketItem'>"
        ticketSectionInnerHtml += "<td><a href=" + PRTGServerUrl + item.parentid_raw + ">" + item.parentid_raw + "</a></td>";
        ticketSectionInnerHtml += "<td>" + statusIcon + " " + status + "</td>";
        ticketSectionInnerHtml += "<td><a class='favstar'></a>" + item.priority + "</td>";
        ticketSectionInnerHtml += "<td>" + item.datetime + "</td>";
        ticketSectionInnerHtml += "<td>" + item.user + "</td>";
        ticketSectionInnerHtml += "<td>" + item.message_raw + "</td>";
        ticketSectionInnerHtml += "</tr>"
    });

    // Close out the table body and the table object in the string
    ticketSectionInnerHtml += "</tbody></table>"

    // Add the string to the innerHtml of our div element
    relatedTicketSection.innerHTML = ticketSectionInnerHtml;

    // Now we are going to take the list and make it into pages, so that we don't have a nasty scroll bar in our div.
    // Get our ticket elements
    ticketItemElements = $('.relatedTicketItem')

    // Check if we have more than 5 tickets
    if(ticketItemElements.length > 5){
        // If we have more than 5 tickets then we are going to add a footer to our table, that will contain our page numbers for navigation.
        // The CSS will be set to match the CSS in other tables found in PRTG for UX consitancy.
        $('#relatedTicketsTable tbody').after("<tfoot id='ticketNav' class='pagenaviation'<tr><th colspan='9'><span class='tablenavigation'></span><th></tr></tfoot>")
        
        var rowsShown = 4; // Number of rows that will be shown
        var rowsTotal = ticketItemElements.length; // How many total rows there are
        var numPages = rowsTotal / rowsShown; // Number of pages that we will have

        // Foreach page that we will have we'll add a number to our table footer, and make it a link.
        for (var x = 0; x < numPages; x++) {
            var pageNum = x + 1;
            $('#ticketNav span').append('<a href="#" rel="' + x + '">  ' + pageNum + '  </a>');
        }

        // We are going to hide all of the table rows.
        $('#relatedTicketsTable tbody tr').hide();
        // The we will split them out from 0 to the number of rows we want to show
        $('#relatedTicketsTable tbody tr').slice(0, rowsShown).show();
        // Last we'll mark the first page as active.
        $('#ticketNav span:first').addClass('active');

        // Now we'll bind a click function to each one of the page number
        $('#ticketNav span a').bind('click', function(){

            // When we click a page number we'll remove the class active from all of them
            $('#ticketNav span a').removeClass('active');
            // and add it to the number that we clicked.
            $(this).addClass('active');

            // Next we'll get the attribute rel from the a element we clicked (aka the page number)
            var currPage = $(this).attr('rel');
            // Do a little math to determine the next tickets we'll be showing
            var startItem = currPage * rowsShown;
            var endItem = startItem + rowsShown;
            // Change the CSS on each item that should be shown to show, and animate it a little
            $('#relatedTicketsTable tbody tr').css('opacity','0.0').hide().slice(startItem, endItem).css('display','table-row').animate({opacity:1}, 300);
        });
    }
}

// This function will make an API call to PRTG to get the tickets
function getTicketsFromPRTG(){

    // Create the http request object
    var ticketsRequest = new XMLHttpRequest();
    // Make the API call to get all tickets
    // Format: JSON
    // Filters: 
        // Max number of tickets : 10,000
        // Age: Up to 6 months old
    // Properties: 
        // objid -- sensor ID
        // datetime -- last time modified
        // parentid -- ticket number
        // message -- subject   
    ticketsRequest.open("GET", "http://" + PRTGServerUrl + "/api/table.json?content=tickets&output=json&columns=objid,datetime,priority,parentid,message,user,status&count=10000&sortby=-datetime&filter_drel=6months", true);
    // Not sure what this is, but it was in the documentation, so i guess i had to add it /shrug
    ticketsRequest.send("null");

    // This event will be called when the api call is finished.
    ticketsRequest.onload = function() {

        // This will check if the request came back successful or not.
        if (ticketsRequest.status >= 200 && ticketsRequest.status < 400) { 

            // This array will be used to store the tickets that belong to sensor we are on. (aka current page)
            var sensorTickets = [];

            // Parse the data into JASON and save it in our ticketData variable.
            var ticketData = JSON.parse(ticketsRequest.responseText);

            // Check if we are on a device page. If we are then we want to get the tickets for all of the sensors associated with the device. 
            if((window.location.href).match("device.htm")){ 
                
                // Variable that will be used to store the sensor Ids.
                var sensorIDs = [];

                // Get the sensors associated with the device
                var sensors = $('table#table_devicesensortable a[class^=sensorid]')
                
                for (var x = 0; x < sensors.length; x++) {

                    // Loop through each of the A elements with the class sensorid* as these are assigned the sensor id as its element id
                    sensorIDs.push(sensors[x].id);
                }

                // Run through each one of the sensors to get the tickets assosicated with it. 
                sensorIDs.forEach(function(sensorIDItem){

                    // Run through each ticket.
                    ticketData.tickets.forEach(function(item){

                        // If the current ticket matches our current sensor.
                        if(item.objid == sensorIDItem){

                            // add it to the sensorTickets array.
                            sensorTickets.push(item);
                        }
                    });
                });                
            }

            // Check if we are on a sensor page. If we are then we want to get the related tickets associated with the sensor page we are in. 
            if((window.location.href).match("sensor.htm")){ 

                // Get the current sensor id from the URL. ( I haven't found a time where this doesn't work, but I can see how it could be an issue if the format changes )
                var currentSensorID = window.location.href.substring(window.location.href.indexOf("id=")+3, window.location.href.indexOf('&'))

                // Run through each ticket.
                ticketData.tickets.forEach(function(item){

                    // If the current ticket matches our current sensor.
                    if(item.objid == currentSensorID){

                        // add it to the sensorTickets array.
                        sensorTickets.push(item);
                    }
                });
            }

            // Check if we are on a ticket page. If we are then we want to get the related tickets associated with the sensor the ticket is for. 
            if((window.location.href).match("ticket.htm")){ 

                // Get the sensor from the link that links to the sensor page.
                var currentSensorID = $('a.sensormenu')[0].id

                // Run through each ticket.
                ticketData.tickets.forEach(function(item){

                    // If the current ticket matches our current sensor.
                    if(item.objid == currentSensorID){

                        // add it to the sensorTickets array.
                        sensorTickets.push(item);
                    }
                });
            }

            // Sort the tickets by date
            sensorTickets.sort(function(a,b){

                return (new Date(b.datetime) - new Date(a.datetime))
            });


            // Once we have our list of tickets we call the function to create the table and add it to the container.
            // I would of normally called this on the createRelatedTickeetsTable function, but because of the way that JavaScript
            // handles API calls it is impossible to return data back to the calling function.
            addTicketsToRelatedTicketsTable(sensorTickets);
        } 
    };
}

// This function will create the span and div elements where the tickets table will be. 
function createRelatedTicketsTable(){
    // Create the container where the tickets table will be displayed.
    var relatedTicketsContainer = document.createElement("span");
        // Create the id attribute to add to the span element.
        var relatedTicketsContainerId = document.createAttribute("id");
        relatedTicketsContainerId.value = "relatedTicketsContainer";
        // Create the class attribute to add to the span element.
        var relatedTicketsContainerClass = document.createAttribute("class");
        // The class values are set to match the area under the sensor, so its not green. 
        relatedTicketsContainerClass.value = "sensoroverview prtg-plugin-initialized";

    // Add the attributes to the new span element
    relatedTicketsContainer.setAttributeNode(relatedTicketsContainerId);
    relatedTicketsContainer.setAttributeNode(relatedTicketsContainerClass);

    // create the div area where the tickets table be displayed.
    var relatedTicketsTable = document.createElement("div");
        // Create the class attribute to add to the div element.
        var relatedTicketsTableClass = document.createAttribute("class");
        // The class values are set to match the area under the sensor, so its not green. 
        relatedTicketsTableClass.value = "overviewsmalldata";
        // Create the id attribute to add to the div element.
        var relatedTicketsTableId = document.createAttribute("id");
        relatedTicketsTableId.value = "relatedTicketSection";
    // Add the attribute to the new div object.
    relatedTicketsTable.setAttributeNode(relatedTicketsTableId);
    relatedTicketsTable.setAttributeNode(relatedTicketsTableClass);

    // Add the div element to the span element.
    relatedTicketsContainer.appendChild(relatedTicketsTable);

    // Check if we are on a ticket page
    if(window.location.href.match("ticket.htm")){

        // Create a new class attribute to replace in the div element.
        var relatedTicketsTableClass = document.createAttribute("class");
        // The class values are set to match the area under the sensor so its the right size.  
        relatedTicketsTableClass.value = "limitedcontentwidth";

        // Add the attribute to the div element and replace its current class.
        relatedTicketsTable.setAttributeNode(relatedTicketsTableClass);

        // Add the element in the ticket page. This will add it under the buttons, but above the Last update area.
        var overviewSensorContainer = $('#tickethistory')[0]; 
        overviewSensorContainer.insertBefore(relatedTicketsContainer, $('#tickethistory h2')[0]);
    }

    // Check if we are on a sensor or device page.
    if(((window.location.href).match("sensor.htm")) || ((window.location.href).match("device.htm"))){
        // Add the span element to the ticket section holder
        // Get the main area that holds the overview_ area. 
        var overviewSensorContainer = document.getElementById("loadedcontent").children.item("div")
        //var overviewSensorContainer = document.getElementById("overview_sensor");
        // Get the sensor status container, the green "Last Message OK" one
        var sensorStatusContainer = overviewSensorContainer.children.item("span")

        // Add our block before the sensor status container
        overviewSensorContainer.insertBefore(relatedTicketsContainer, sensorStatusContainer);
    }
    
    // Call the function to get the tickets from PRTG and add them to the container.
    getTicketsFromPRTG();   
};

// Related Tickets tab on click function
function showRelatedTicketsTab() {

    // Get the tickets block element we created.
    var relatedTicketsContainer = document.getElementById('relatedTicketsContainer');

    // Check if our ticket block element was found.
    if(relatedTicketsContainer){

        // Check the showing state and toggle it.
        if(relatedTicketsContainer.style.display === 'none') {
            relatedTicketsContainer.style.display = 'block';
        }
        else {
            relatedTicketsContainer.style.display = 'none';
        }
    }
    else {

        // If the element does not exist then we create it. 
        // This will only be the case if the tab has not been clicked before.
        createRelatedTicketsTable();
    }
    
}

function createRelatedTicketsTab(){
    
    // Select the navBar html element. This is where the tab will be added to.
    var navBar = document.getElementsByClassName("nav-tabs")[0]; 

    // Create an Li element. This will be the new tab.
    var navTab = document.createElement("li");
        // Create a class attribute that will be added to the li element.
        var classAttribute = document.createAttribute("class");
            // The class values are set to match the settings, this will separate the tab from the Log tab, and also make 
            // it darker and more noticible.
            classAttribute.value = 'tab-spacing tab-dark';

        // Create tabid attribute that will be added to the li element.
        var tabidAttribute = document.createAttribute("tabid");
            // The value of tabid will be the number of already existing tabs+1.
            tabidAttribute.value = navBar.children.length+1;
        // Create an id attribute that will be added to the li element.
        var idAttribute = document.createAttribute("id");
            // Assign a value to the ID. 
            idAttribute.value = "relatedTicketsTabElement";
    // Add the created attributes to the new Li element.
    navTab.setAttributeNode(tabidAttribute);
    navTab.setAttributeNode(classAttribute);
    navTab.setAttributeNode(idAttribute);

    // Create an a element. This will be added to the created li element.
    var ticketTabUrl = document.createElement("a");
        // Create the class attribute that will be added to the a element.
        var ticketTabClass = document.createAttribute("class");
        // The class value is set to match the other tabs. 
        ticketTabClass.value = "nohjax";
        // Create the onclick attribute that will be added to the a element.
        var ticketTabAction = document.createAttribute("onclick");
        // The value of the onclick attribute will be the function that will display the ticket's container.
        ticketTabAction.value = "showRelatedTicketsTab()";
        // Add text to a element's innerText.
        ticketTabUrl.innerText = "Related tickets";
    // Add the created attributes to the new a element.
    ticketTabUrl.setAttributeNode(ticketTabClass);
    ticketTabUrl.setAttributeNode(ticketTabAction);

    // Add the newly created a element to new li element.
    navTab.appendChild(ticketTabUrl);

    // Add the created Li element to the navBar element.
    for(var x = 0 ; x <= navBar.children.length-1; x++){

        // Get all the li elements that belong to the Nav-Bar element, and select their name.
        var currentChild = navBar.children[x].children.item("a").innerText;

        // We are looking through the Tabs and looking for the Settings tab. 
        if(currentChild === "Settings"){ 
            
            // We select the settings tab.
            var settingsTab = navBar.children[x];
        }
    }

    // Add the related tickets tab before the settings tab.
    navBar.insertBefore(navTab, settingsTab);
}

// Perform this action everytime there is an ajax call
$(document).ajaxComplete(function(event, xhr, settings ){

    // If the AJAX call is coming from the sensoroverview URL then we'll want to add the related tickets tab.
    if((settings.url.match("sensoroverview")) || ((settings.url.match("deviceoverview.htm")))){

        // Ensure we are on a sensor to add the tab.
        if(((window.location.href).match("sensor.htm")) || ((window.location.href).match("device.htm"))){ 

            // Because the AJAX calls might be done multiple times we 
            // make sure the element doesn't already exist.
            if(!(document.getElementById('relatedTicketsTabElement'))){

                // Call the function to create the ticket's tab.
                createRelatedTicketsTab();
            }            
        }
    }

    // Check if we are on a ticket page, and that the correct AJAX event happened
    if(((settings.url.match("sensortypesinuse.json")) || (settings.url.match("tickethistory.htm")) || (settings.url.match("ticket.htm"))) && window.location.href.match("ticket.htm")) {

        // Check that the element doesn't already exist before attempting to create it. 
        if(!(document.getElementById('relatedTicketsTabElement'))){

            // Call the function to create the ticket's tab.
            $('div p').append('<a class="actionbutton" href="#" onclick="showRelatedTicketsTab()"><span class="icon ui-icon ui-icon-note"></span>Related Tickets</a>')
        }
    }
});