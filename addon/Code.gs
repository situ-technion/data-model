// -- Global Variables --
var doc = DocumentApp.getActiveDocument();
var body = doc.getBody();
var strippedUser = Session.getTemporaryActiveUserKey().replaceAll(/\s+/g, '-').replaceAll('+', '-');
var hebrewEnglishPattern = /[^a-zA-Z\u0590-\u05FF\u200f\u200e\n/n\r\.\, ]/g; // Only Hebrew and English, no special chars
// ----------------------

function onInstall(e) {
  onOpen(e);
  openDoc();
}

function onOpen(e){
    var triggers = getProjectTriggersByName('openDoc');  
    if (triggers.length == 0) {
      ScriptApp.newTrigger('openDoc')
          .forDocument(doc)
          .onOpen()
          .create();
    }
}

function getProjectTriggersByName(name) {
    return ScriptApp.getProjectTriggers().filter(
        function(s) {return s.getHandlerFunction() === name;}
    );
}

function openDoc() {
  clearDocBackground();
  refresh();
  initUI();
  main();
}

function refresh() {
  sendDataToDB();
  calculateModel();
}

function sendDataToDB(){    
    var cleanbody = body.getText().replace(hebrewEnglishPattern, '');
    var myData = {
        'documentId': doc.getId(),
        'timestamp' : new Date(),
        'hashedUserId' : strippedUser,
        'text' : cleanbody
        //'comments' : getComments()
    };

    var options = {
        'method' : 'POST',
        'contentType' : 'application/json',
        'payload' : JSON.stringify(myData),
        'muteHttpExceptions': false
    };
    
    var url = "https://webhooks.mongodb-realm.com/api/client/v2.0/app/situ-xkfcm/service/situ/incoming_webhook/insert_doc";

    count = 0;
    while (count < 3) {
      try {
          Logger.log("Send data to DB #" + count);
          UrlFetchApp.fetch(url, options);
          count = 3;
      } catch(e) {
          Utilities.sleep(500);
          count = count + 1;
          Logger.log("error" + e);
      }
    }
}

function calculateModel(){
    var options = {
        'method' : 'GET',
        'muteHttpExceptions': false
    };
    var url = "https://situ-technion.herokuapp.com/model/" + doc.getId();

    count = 0;
    while (count < 3) {
      try {
        Logger.log("calculate model #" + count);
        UrlFetchApp.fetch(url, options);
        count = 3;
      } catch(e) {
        Utilities.sleep(500);
        count = count + 1;
        Logger.log("error" + e);
      }
    }
}

function initUI() {
  DocumentApp.getUi()
        .createMenu('SITU')
        .addItem('Open dashboard','main')
        .addToUi();
}

function main() {
  displayWindowPage("index");
}

function getDisplayData() {
  var url = "https://webhooks.mongodb-realm.com/api/client/v2.0/app/situ-xkfcm/service/situ/incoming_webhook/get_model?docId=" + doc.getId() + "&userId=" + strippedUser;
  var response;
  var jsonData;

  count = 0;
  while (count < 3) {
    try {
        Logger.log("display data #" + count);
        response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': false });
        count = 3;
        if (response != false) {
          jsonData = JSON.parse(response.getContentText());
        } else {
          throw new Error("Empty response"); 
        }
    } catch(e) {
        Utilities.sleep(500);
        count = count + 1;
        Logger.log("error" + e);
    }
  }
  
  // Wordcloud list structure: topic, font-size, [[start end]...
  var wordcloudArr = [];
  var chartdatasetsArr = [];
  var relativeWordcloudArr = [];
  var relativeWchartdatasetsArr = [];
  var timestamp = [];
  var major = [];

  try {
      var current_topic = jsonData["current_version"]["current_version_topic"];
      var user_topic = jsonData[strippedUser]["withstanding_topics"];
      Object.entries(user_topic).forEach(
        function([key, value]) {
          var topic_location = [];
          var key_list = jsonData["current_version"]["current_version_topics_locations"][key];
          if (typeof key_list !== "undefined") {
            jsonData["current_version"]["current_version_topics_locations"][key].forEach(
            function([keyInner, valueInner]) {
              topic_location.push([keyInner['$numberInt'], valueInner['$numberInt']]);
            });
            relativeWordcloudArr.push([key, calcWordSize(parseFloat(Object.entries(value)[0][1])), [topic_location]])
        }
      });

      Object.entries(current_topic).forEach(
        function([key, value]) {
          var topic_location = [];
          jsonData["current_version"]["current_version_topics_locations"][key].forEach(
          function([keyInner, valueInner]) {
            topic_location.push([keyInner['$numberInt'], valueInner['$numberInt']]);
          });
          wordcloudArr.push([key, calcWordSize(parseFloat(Object.entries(value)[0][1])), [topic_location]])
      });


      graphData(timestamp, major);

      chartdatasetsArr = [{ 
                  data: major,
                  label: "You",
                  //borderColor: stringToColour("Topic2"),
                  fill: true
              }];

      relativeWchartdatasetsArr = [{ 
                  data: major,
                  label: "You",
                  //borderColor: stringToColour("Topic2"),
                  fill: true
              }];

      var data = {
          normal: { 
            wordcloud: wordcloudArr,
            chartdatasets: chartdatasetsArr,
            graphx: timestamp
          },
          relative: {
            wordcloud: relativeWordcloudArr,
            chartdatasets: relativeWchartdatasetsArr,
            graphx: timestamp
          }
      };
  } catch(e) {
      Logger.log("Display data parsing error" + e);
  }
  return JSON.stringify(data);
}

 //   Format: [{
  //   "_id": {
  //     "$oid": "61727e59c5d7081bfb598a0f"
  //   },
  //   "timestamp": {
  //     "$numberDouble": "1634893401.21035"
  //   },
  //   "APrZferNGXg8aVAn9bSVNFt0pVZQ0uStt8OEhnUEq2i5osRwCVeS1jnKHi0Y/T0WeryBTki3lmSK": {
  //     "major_revisions_count": {
  //       "$numberInt": "0"
  //     }
  //   }
  // }]
function graphData(timestamp, major) {
      var url = "https://webhooks.mongodb-realm.com/api/client/v2.0/app/situ-xkfcm/service/situ/incoming_webhook/get_graph?docId=" + doc.getId() + "&userId=" + strippedUser;
      var response;
      var jsonDataGraph;

      count = 0;
      while (count < 3) {
        try {
            Logger.log("Graph data #" + count);
            response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': false });
            count = 3;
            if (response != false) {
              jsonDataGraph = JSON.parse(response.getContentText());
            } else {
              throw new Error("Empty response"); 
            }
        } catch(e) {
            Utilities.sleep(500);
            count = count + 1;
            Logger.log("error" + e);
        }
      }
      
      Object.entries(jsonDataGraph).forEach( 
        function([key, value]) {
          timestamp.push(new Date(value.timestamp['$numberDouble']*1000).toISOString().replace("T", ' ').replace(/:[^:]*$/,''));
          major.push(value[strippedUser]["major_revisions_count"]['$numberInt'] + value[strippedUser]["minor_revisions_count"]['$numberInt']);
      });
}

// // --- Functionallity ---

function displayWindowPage(page) {
  var template = HtmlService.createTemplateFromFile(page);
  template.data = getDisplayData();
  DocumentApp.getUi().showSidebar(template.evaluate().setTitle("SITU - collaborative writing"));
}

function highlightText(topic) {
  bgcolor = stringToColour(topic);
  foundElement = DocumentApp.getActiveDocument().getBody().findText(topic);
  var position = doc.newPosition(foundElement.getElement(), foundElement.getStartOffset());
  doc.setCursor(position);

  while (foundElement != null) {
    if (foundElement.getElement().asText().getBackgroundColor() != null) {
      bgcolor = null;
    }
    foundElement.getElement().asText().setBackgroundColor(bgcolor);
    foundElement = DocumentApp.getActiveDocument().getBody().findText(topic, foundElement);
  }
}

function stringToColour(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

function calcWordSize(wordWeight) {
  return (wordWeight > 0)? wordWeight * 20: 20;
}

function clearDocBackground() {
  content_length = body.editAsText().getText().length - 1;
  body.editAsText().asText().setBackgroundColor(0 ,content_length, null);
}

// function sendClickDataToDB(eventType, targetId){
//     var myData = {
//         'documentId': doc.getId() ,
//         'hashedUserId' : strippedUser,
//         'timestamp' : new Date(),
//         'eventType ' : eventType,
//         'targetId ' : targetId
//     };

//     var options = {
//         'method' : 'POST',
//         'contentType' : 'application/json',
//         'payload' : JSON.stringify(myData)
//     };

//   var url = "https://webhooks.mongodb-realm.com/api/client/v2.0/app/situ-xkfcm/service/situ/incoming_webhook/insert_event";
//   // Disabled until functionallity is needed
//   //UrlFetchApp.fetch(url, options);
// }

// function getComments(){
  // Disabled until functionallity is needed
  // var document_id = DocumentApp.getActiveDocument().getId();
  // var comments = Drive.Comments.list(document_id);
  // return comments;
// }
// Incase we need to find word.
// if (body.findText(text).getElement().asText().getBackgroundColor() != null) {
//   bgcolor = null;
// } 
// body.findText(text).getElement().asText().setBackgroundColor(bgcolor);
  
// function sendTableToMail(tableHtml) {
//   MailApp.sendEmail({
//   //  to: "dvir.levanon@gmail.com",
//     to: doc.getEditors(),
//     subject: "Update from SITU",
//     htmlBody: tableHtml,
//     replyTo: "no-reply@gmail.com"
//   });
// }

//  function callLibraryFunction(func, args){
//     var arr = func.split(".");
//     var libName = arr[0];
//     var libFunc = arr[1];
//     args = args || [];
//    return this[libName][libFunc].apply(this, args);
// }
