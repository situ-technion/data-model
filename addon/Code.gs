function openDoc(){
  tempActiveUser = Session.getTemporaryActiveUserKey();
  strippedUser = tempActiveUser.replaceAll(/\s+/g, '-').replaceAll('+', '-');
  displayWindowPage("paragraphReadiness");
 // loadIcons();
}

function onInstall(e) {
  createDocOpenTrigger();
}

function createDocOpenTrigger(){
  var triggers = ScriptApp.getProjectTriggers().filter(
        function(s) {return s.getHandlerFunction() === 'openDoc';}
    );

  if (triggers.length == 0) {
    ScriptApp.newTrigger('openDoc')
        .forDocument(DocumentApp.getActiveDocument())
        .onOpen()
        .create();
  }
}

var readinessIcons = [];

function loadIcons() {
  readinessIcons[0] = UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/red64x64.png').getBlob().copyBlob();
  readinessIcons[1] = UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/yellow64x64.png').getBlob().copyBlob();
  readinessIcons[2] = UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/green64x64.png').getBlob().copyBlob();
}

function addPRIconLow() {
  Logger.log('SITULib addPRIconLow');
  //addWiFiIcon(UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/red64x64.png').getBlob());
  /*Logger.log('SITULib addPRIconLow cache ' + readinessIcons[0]);
  if (readinessIcons[0] == null) {
    readinessIcons[0] = UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/red64x64.png').getBlob();
    Logger.log('SITULib addPRIconLow adding ' + readinessIcons[0]);
  }*/
  addPRIcon(UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/red64x64.png').getBlob());
}

function addPRIconMed() {
  Logger.log('SITULib addPRIconMed');
  addPRIcon(UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/yellow64x64.png').getBlob());
}
function addPRIconHigh() {
  Logger.log('SITULib addPRIconHigh');
  addPRIcon(UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/green64x64.png').getBlob());
}

function addPRIcon(blob) {
  Logger.log('SITU image blob ' + blob);
  var doc = DocumentApp.getActiveDocument();
  if (doc == null) return;
   
  var elementInParagraph;
  var cursor = doc.getCursor();
  console.log('SITU cursor ' +  cursor);
  if (cursor) {
    elementInParagraph = cursor.getElement();
    console.log('SITU element from cursor ' +  elementInParagraph);
  }

  var selection = doc.getSelection();
  console.log('SITU selection ' +  selection);
  if (selection) {
    var elements = selection.getSelectedElements();
    if (elements.length > 0) {
      elementInParagraph = elements[0].getElement();
    }
  }

  console.log('SITU element selected ' +  elementInParagraph);
  if (elementInParagraph) {
    var paragraph = getParagraphFromElement(elementInParagraph);
    console.log('SITU paragraph from element ' +  paragraph);
    if (paragraph) {
      // Remove previous image
      var positionedImages = paragraph.getPositionedImages();
      for(var i=0; i<positionedImages.length; i++) {
        paragraph.removePositionedImage( positionedImages[i].getId());
      }
      // Add the PositionedImage with offsets (in points).
      var posImage = paragraph.addPositionedImage(blob)
        .setTopOffset(0)
        .setLeftOffset(450) // 0 or page width for RTL
        .setWidth(32)
        .setHeight(32)
        .setLayout(DocumentApp.PositionedLayout.WRAP_TEXT);

        console.log('SITU adding readiness image ' +  posImage);
        //Logger.log('SITU image blob after positioning ' + blob);
    }
  }
}

function getParagraphFromElement(element) {

  var paragraph = element;
  while (paragraph != null && paragraph.getType() != DocumentApp.ElementType.PARAGRAPH) {
    paragraph = paragraph.getParent();
  } 

  return paragraph;
}

function displayWindowPage(page) {
  var template = HtmlService.createTemplateFromFile(page);
/*
  if (page == "index") {
    template.data = getDisplayData();
  }

  var blob = UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/red64x64.png').getBlob();
    console.log('SITU blob ' +  blob);

  readinessIcons[0]= UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/red64x64.png').getBlob();
  console.log('SITU adding readiness image to array ' +  readinessIcons[0]);

  readinessIcons[1]= UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/yellow64x64.png').getBlob();
  readinessIcons[2]= UrlFetchApp.fetch('https://situ-technion.herokuapp.com/statics/green64x64.png').getBlob();
*/
  DocumentApp.getUi().showSidebar(template.evaluate().setTitle("SITU - collaborative writing"));
}
/*
function openFloatingWindow() {
  var htmlOutput = HtmlService.createHtmlOutputFromFile('paragraphReadiness')
    //.createHtmlOutput('<p>A change of speed, a change of style...</p>')
    .setWidth(250)
    .setHeight(300);
DocumentApp.getUi().showModelessDialog(htmlOutput, 'Paragraph readiness');
}*/
