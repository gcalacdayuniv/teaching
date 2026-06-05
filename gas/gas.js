function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    
    // Target folder ID where all files will be saved
    var targetFolder = DriveApp.getFolderById('1-2oCSYs2GRuVqYVAjTbSmadO1vxK3hV0');
    var file, newUrl;
    
    if (body.type === 'create_doc') {
      var doc = DocumentApp.create(body.title);
      file = DriveApp.getFileById(doc.getId());
      file.moveTo(targetFolder);
      newUrl = doc.getUrl();
    } else if (body.type === 'create_sheet') {
      var sheet = SpreadsheetApp.create(body.title);
      file = DriveApp.getFileById(sheet.getId());
      file.moveTo(targetFolder);
      newUrl = sheet.getUrl();
    } else if (body.type === 'create_slide') {
      var slide = SlidesApp.create(body.title);
      file = DriveApp.getFileById(slide.getId());
      file.moveTo(targetFolder);
      newUrl = slide.getUrl();
    } else if (body.type === 'duplicate') {
      var fileIdMatch = body.url.match(/[-\w]{25,}/);
      if (!fileIdMatch) throw new Error("Invalid Google Drive URL provided for duplication.");
      var original = DriveApp.getFileById(fileIdMatch[0]);
      // Duplicate directly into the target folder
      file = original.makeCopy(body.title, targetFolder);
      newUrl = file.getUrl();
    } else {
      throw new Error("Invalid resource type");
    }
    
    // Apply public editable permissions
    if (file) {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
      return ContentService.createTextOutput(JSON.stringify({ url: newUrl })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
