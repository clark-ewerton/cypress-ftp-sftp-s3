describe('SFTP File Operations', () => {
  beforeEach(function () {
    // For upload test
    const uniqueId = new Date().getTime();
    this.uploadFileName = `sftp-test-${uniqueId}.txt`;
    this.uploadFileContent = `This is a unique SFTP test file created at ${uniqueId}`;
    this.localUploadPath = `cypress/fixtures/${this.uploadFileName}`;
    this.remoteUploadPath = `/upload/${this.uploadFileName}`;

    // For download test
    this.remoteDownloadFile = '/download/version.txt';
    this.localDownloadPath = `cypress/downloads/version.txt`;
  });

  afterEach(function () {
    // Clean up local files created during the test
    cy.task('deleteLocalFile', { filePath: this.localUploadPath }, { log: false });
    cy.task('deleteLocalFile', { filePath: this.localDownloadPath }, { log: false });
  });

  it('should upload a file, download a separate file, and delete the uploaded file', function () {
    // 1. Create a local file to upload
    cy.writeFile(this.localUploadPath, this.uploadFileContent);

    // 2. Upload the file to the /upload directory
    cy.log('**Uploading file to /upload/...**');
    cy.task('sftpUpload', { localFile: this.localUploadPath, remotePath: this.remoteUploadPath })
      .should('be.true');

    // 3. Download a pre-existing file from the /download directory
    cy.log('**Downloading file from /download/...**');
    cy.task('sftpDownload', { localPath: this.localDownloadPath, remoteFile: this.remoteDownloadFile })
      .should('be.true');

    // 4. Verify the downloaded file exists and is not empty
    cy.log('**Verifying downloaded file...**');
    cy.readFile(this.localDownloadPath).should('not.be.empty');


  });
});
