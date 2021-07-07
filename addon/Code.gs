// Global variables
var doc = DocumentApp.getActiveDocument();
var body = doc.getBody();

function onOpen(e) {
  sendDataToDB();
  calculateModel();
  initUI();
  main();
}

function sendDataToDB(){
    var myData = {
        'documentId': doc.getId() ,
        'timestamp' : new Date(),
        'hashedUserId' : Session.getTemporaryActiveUserKey(),
        'text' : body.getText(),
        'comments' : getComments()
    };

    var options = {
        'method' : 'POST',
        'contentType' : 'application/json',
        'payload' : JSON.stringify(myData)
    };

  var url = "https://webhooks.mongodb-realm.com/api/client/v2.0/app/situ-xkfcm/service/situ/incoming_webhook/insert_doc";
  UrlFetchApp.fetch(url, options);
}

function calculateModel(){
    var options = {
        'method' : 'GET',
    };

    var url = "https://situ-technion.herokuapp.com/model/" + doc.getId();
    UrlFetchApp.fetch(url, options);
}

function sendClickDataToDB(eventType, targetId){
    var myData = {
        'documentId': doc.getId() ,
        'hashedUserId' : Session.getTemporaryActiveUserKey(),
        'timestamp' : new Date(),
        'eventType ' : eventType,
        'targetId ' : targetId
    };

    var options = {
        'method' : 'POST',
        'contentType' : 'application/json',
        'payload' : JSON.stringify(myData)
    };

  var url = "https://webhooks.mongodb-realm.com/api/client/v2.0/app/situ-xkfcm/service/situ/incoming_webhook/insert_event";
  // Disabled until functionallity is needed
  //UrlFetchApp.fetch(url, options);
}

function getComments(){
  // Disabled until functionallity is needed
  // var document_id = DocumentApp.getActiveDocument().getId();
  // var comments = Drive.Comments.list(document_id);
  // return comments;
  return "Not implemented";
}

function initUI() {
  DocumentApp.getUi()
        .createMenu('SITU')
        .addItem('Open dashboard','main')
        .addItem('Uninstall request','uninstallRequest')
        .addToUi();
}

function main() {
  displayWindowPage("index");
}

function uninstallRequest() {
  displayWindowPage("uninstallRequest");
}

function getDisplayData() {
  var url = "https://webhooks.mongodb-realm.com/api/client/v2.0/app/situ-xkfcm/service/situ/incoming_webhook/get_model?docId=" + doc.getId() + "&userId=" + Session.getTemporaryActiveUserKey();
  var response = UrlFetchApp.fetch(url, { 'muteHttpExceptions': false });
  if (response != false) {
    var jsonData = JSON.parse(response.getContentText());
  }
  
  // Wordcloud list structure: topic, font-size, [[start end]...
  var wordcloudArr = [];
  var chartdatasetsArr = [];
  var relativeWordcloudArr = [];
  var relativeWchartdatasetsArr = [];
  var current_topic = jsonData["current version"]["current_version_topic"];
  var user_topic = jsonData[Session.getTemporaryActiveUserKey()]["withstanding_topics"];

  Object.entries(user_topic).forEach(
    function([key, value]) {
      var topic_location = [];
      var key_list = jsonData["current version"]["current_version_topics_locations"][key];
      if (typeof key_list !== "undefined") {
        jsonData["current version"]["current_version_topics_locations"][key].forEach(
        function([keyInner, valueInner]) {
          topic_location.push([keyInner['$numberInt'], valueInner['$numberInt']]);
        });
        relativeWordcloudArr.push([key, parseInt(Object.entries(value)[0][1])*20, [topic_location]])
     }
  });

  Object.entries(current_topic).forEach(
    function([key, value]) {
      var topic_location = [];
      jsonData["current version"]["current_version_topics_locations"][key].forEach(
      function([keyInner, valueInner]) {
        topic_location.push([keyInner['$numberInt'], valueInner['$numberInt']]);
      });
      wordcloudArr.push([key, parseInt(Object.entries(value)[0][1])*20, [topic_location]])
  });

  chartdatasetsArr = [{ 
              data: [1100,1600,1700,1750,1800,1850,1900,1950,1999,2050],
              label: "Topic2 - Dvir.levanon@gmail.com",
              borderColor: stringToColour("Topic2"),
              fill: false
          }, { 
              data: [1100,1600,1750,1800,1850,1900,1950,1999,2050],
              label: "Topic3 - Dvir.levanon@gmail.com",
              borderColor: stringToColour("Topic3"),
              fill: false
          },{ 
              data: [1700,1750,1800,1850,1900,1950,1999,2050],
              label: "Topic5 - Dvir.levanon@gmail.com",
              borderColor: stringToColour("Topic5"),
              fill: false
          }];

  relativeWchartdatasetsArr = [{ 
              data: [1100,1600,1700,1750,1800,1850,1900,1950,1999,2050],
              label: "Topic2 - Dvir.levanon@gmail.com",
              borderColor: stringToColour("Topic2"),
              fill: false
          }, { 
              data: [1100,1600,1750,1800,1850,1900,1950,1999,2050],
              label: "Topic3 - Dvir.levanon@gmail.com",
              borderColor: stringToColour("Topic3"),
              fill: false
          },{ 
              data: [1700,1750,1800,1850,1900,1950,1999,2050],
              label: "Topic5 - Dvir.levanon@gmail.com",
              borderColor: stringToColour("Topic5"),
              fill: false
          }];

  var data = {
      normal: { 
          wordcloud: wordcloudArr,
          chartdatasets: chartdatasetsArr
      },
      relative: {
        wordcloud: relativeWordcloudArr,
        chartdatasets: relativeWchartdatasetsArr
      }
  };
  console.log(data);
  return data;
}

// // --- Functionallity ---

function displayWindowPage(page) {
  var template = HtmlService.createTemplateFromFile(page);
  template.docName = doc.getName();
  template.editors = doc.getEditors();
  
  DocumentApp.getUi().showSidebar(template.evaluate().setTitle("situ - collaborative writing"));
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

function highlightText(position_lst, topic) {
  position_lst = position_lst.flat(3);
  bgcolor = stringToColour(topic);
  if (body.editAsText().getBackgroundColor(position_lst[0]) != null) {
      bgcolor = null;
  }
  for (var i = 0; i < position_lst.length; i+=2) {
    body.editAsText().setBackgroundColor(position_lst[i], position_lst[i+1], bgcolor);
  }
}


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
