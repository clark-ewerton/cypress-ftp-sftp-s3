describe('FTP End-to-End Test', () => {
  let uniqueId;
  let fileName;
  let fileContent;
  let localUploadPath;
  let localDownloadPath;
  let remotePath;

  beforeEach(function () {
    uniqueId = Date.now();
    fileName = `test-file-${uniqueId}.txt`;
    fileContent = `This is a unique test file created at ${uniqueId}`;
    localUploadPath = `cypress/fixtures/${fileName}`;
    localDownloadPath = `cypress/downloads/${fileName}`;
    remotePath = `/${fileName}`; // dlptest uploads to the root directory
  });

  afterEach(function () {
    // Clean up local files
    cy.task('deleteLocalFile', { filePath: localUploadPath }, { log: false });
    cy.task('deleteLocalFile', { filePath: localDownloadPath }, { log: false });
  });

  it('should upload, download, verify, and delete a file from the FTP server', () => {
    // 1. Setup - Create a unique file to test with
    cy.writeFile(localUploadPath, fileContent);

    // 2. Upload the file
    cy.log('**Uploading file...**');
    cy.task('ftpUpload', { localFile: localUploadPath, remotePath })
      .should('be.true');

    // 3. Download the file
    cy.log('**Downloading file...**');
    cy.task('ftpDownload', { localPath: localDownloadPath, remoteFile: remotePath })
      .should('be.true');

    // 4. Verify the content of the downloaded file
    cy.log('**Verifying file content...**');
    cy.readFile(localDownloadPath).should('equal', fileContent);

    // 5. Clean up - Delete the remote file
    cy.log('**Deleting remote file...**');
    cy.task('ftpDelete', remotePath).should('be.true');
  });
});
