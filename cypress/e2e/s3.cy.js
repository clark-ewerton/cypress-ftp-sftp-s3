describe('S3 End-to-End Test', () => {
  beforeEach(function () {
    // Skip the test if AWS credentials or bucket are not set
    if (!Cypress.env('AWS_ACCESS_KEY_ID') || !Cypress.env('S3_BUCKET')) {
      cy.log('Skipping S3 test: AWS credentials or S3_BUCKET not provided.');
      this.skip();
    }

    const uniqueId = Date.now();
    this.fileName = `s3-test-${uniqueId}.txt`;
    this.fileContent = `This is a unique S3 test file created at ${uniqueId}`;
    this.localUploadPath = `cypress/fixtures/${this.fileName}`;
    this.localDownloadPath = `cypress/downloads/${this.fileName}`;
  });

  afterEach(function () {
    // Clean up local files if the test was not skipped
    if (this.localUploadPath) {
      cy.task('deleteLocalFile', { filePath: this.localUploadPath }, { log: false });
    }
    if (this.localDownloadPath) {
      cy.task('deleteLocalFile', { filePath: this.localDownloadPath }, { log: false });
    }
  });

  it('should upload, download, verify, and delete an object from S3', function() {
    // 1. Setup - Create a unique file to test with
    cy.writeFile(this.localUploadPath, this.fileContent);

    // 2. Upload the file
    cy.log('**Uploading object to S3...**');
    cy.task('s3Upload', { key: this.fileName, filePath: this.localUploadPath })
      .its('Location').should('include', this.fileName);

    // 3. Download the file
    cy.log('**Downloading object from S3...**');
    cy.task('s3Download', { key: this.fileName, downloadPath: this.localDownloadPath })
      .should('be.true');

    // 4. Verify the content of the downloaded file
    cy.log('**Verifying object content...**');
    cy.readFile(this.localDownloadPath).should('equal', this.fileContent);

    // 5. Clean up - Delete the remote object
    cy.log('**Deleting object from S3...**');
    cy.task('s3Delete', { key: this.fileName })
      .then((result) => {
        expect(result).to.be.empty; // A successful delete returns an empty object
      });
  });
});
