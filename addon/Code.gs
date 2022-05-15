

var readinessIcons = ['https://situ-technion.herokuapp.com/statics/red64x64.png',
'https://situ-technion.herokuapp.com/statics/yellow64x64.png',
'https://situ-technion.herokuapp.com/statics/green64x64.png'];

var IMAGE_ID = 'IMAGE_ID', WORKED_ON = 'WORKED_ON', TODO = 'TODO', TASKLIST = 'TASK_LIST', HISTORYLIST = 'HISTORY_LIST';

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

function addPRIcon(imageId) {

  Logger.log('SITU addPRIcon image id ' + imageId);
  var blob = UrlFetchApp.fetch(readinessIcons[imageId]).getBlob()
   
  var elementInParagraph = getSelectedElement();
  
  var paragraph = getParagraphFromElement(elementInParagraph);

  removePositionsImagesFromParagraph(paragraph);

  if (paragraph) {
    
    // Add the PositionedImage with offsets (in points).
    var posImage = paragraph.addPositionedImage(blob)
      .setTopOffset(0)
      .setLeftOffset(450) // 0 or page width for RTL
      .setWidth(32)
      .setHeight(32)
      .setLayout(DocumentApp.PositionedLayout.WRAP_TEXT);


    console.log('SITU addPRIcon adding readiness image ' +  posImage);

    return posImage.getId();
  }

}

function removePositionsImagesFromParagraph(paragraph) {
  if (paragraph == null) return;

  var documentProperties = PropertiesService.getDocumentProperties();

  // Remove previous image
    var positionedImages = paragraph.getPositionedImages();
    for(var i=0; i<positionedImages.length; i++) {
      paragraph.removePositionedImage( positionedImages[i].getId());
      documentProperties.deleteProperty(positionedImages[i].getId());
    }

}

function getSelectedElement() {

  var elementInParagraph = null;
  var doc = DocumentApp.getActiveDocument();
  if (doc != null) {
  
    var cursor = doc.getCursor();
    console.log('SITU getSelectedElement cursor ' +  cursor);
    if (cursor) {
      elementInParagraph = cursor.getElement();
      console.log('SITU getSelectedElement element from cursor ' +  elementInParagraph);
    }

    var selection = doc.getSelection();
    console.log('SITU getSelectedElement selection ' +  selection);
    if (selection) {
      var elements = selection.getSelectedElements();
      if (elements.length > 0) {
        elementInParagraph = elements[0].getElement();
      }
    }
  }
  console.log('SITU getSelectedElement element selected ' +  elementInParagraph);

  return elementInParagraph;
}

function getParagraphFromElement(element) {

  var paragraph = element;
  while (paragraph != null && paragraph.getType() != DocumentApp.ElementType.PARAGRAPH) {
    paragraph = paragraph.getParent();
  } 

  console.log('SITU getParagraphFromElement ' +  paragraph);
  return paragraph;
}

function savePR(imageId, workedOn, todo, taskList, historyList) {
  var elementInParagraph = getSelectedElement();
  
  var paragraph = getParagraphFromElement(elementInParagraph);
  if (paragraph != null) {
    var positionedImages = paragraph.getPositionedImages();
    var posImageId = null;
    if (positionedImages.length > 0) {
      posImageId = positionedImages[0].getId();
    }

    if (posImageId != null) {
      var params = {};
      params[IMAGE_ID] = imageId;
      params[WORKED_ON] = workedOn;
      params[TODO] = todo;
      params[TASKLIST] = taskList;
      params[HISTORYLIST] = historyList;

      var metaData = JSON.stringify(params);
      var documentProperties = PropertiesService.getDocumentProperties();
      documentProperties.setProperty(posImageId, metaData);

      Logger.log('SITU savePR add metaData ID:' + posImageId + ' value: ' + metaData);
      return posImageId;
    }
  }
}

function loadPR() {

  var elementInParagraph = getSelectedElement();
  
  var paragraph = getParagraphFromElement(elementInParagraph);

  if (paragraph) {
    var positionedImages = paragraph.getPositionedImages();
    if (positionedImages.length > 0) {
      var documentProperties = PropertiesService.getDocumentProperties();

      var metaData = documentProperties.getProperty(positionedImages[0].getId());
      metaDataObj = JSON.parse(metaData);
      return metaDataObj;
    }
  }
}

function displayWindowPage(page) {
  var template = HtmlService.createTemplateFromFile(page);
  DocumentApp.getUi().showSidebar(template.evaluate().setTitle("SITU - collaborative writing"));
}

