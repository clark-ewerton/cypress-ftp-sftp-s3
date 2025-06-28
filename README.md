# Cypress FTP/SFTP/S3 Automation

This project provides automation tests for FTP, SFTP, and S3 operations using Cypress.

## Features

- FTP file operations (upload/download/delete)
- SFTP file operations (upload/download). *Note: The public test server does not support deletion.*
- S3 bucket operations (upload/download/delete)
- Configurable credentials through a `.env` file
- Robust, self-contained tests that clean up after themselves

## Prerequisites

- Node.js (v16 or higher)

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the root directory by copying the `.env.example` file:

```bash
cp .env.example .env
```

Then, fill in the required values in the newly created `.env` file. The public FTP/SFTP credentials are pre-filled, but you must provide your own for AWS S3. 

### Public Test Servers

#### FTP (`ftp.dlptest.com`)
This server allows standard upload, download, and delete operations.

#### SFTP (`demo.wftpserver.com`)
This server has specific rules that the test suite accommodates:
- **Uploads**: Must be sent to the `/upload/` directory.
- **Downloads**: The test downloads a sample file from the `/download/` directory.
- **Deletes**: File deletion is **not permitted** on this server.



### S3 Configuration

To run the S3 tests, you must provide your own AWS credentials and an existing S3 bucket name in the `.env` file.

## Running the Tests

There are two ways to run the tests:

### Interactively (Recommended)

1. Open the Cypress Test Runner:
   ```bash
   npm run open
   ```
2. From the Cypress interface, choose the spec file you want to run (`ftp.cy.js`, `sftp.cy.js`, or `s3.cy.js`).

### Headless Mode

To run all tests in the terminal without opening the browser:
```bash
npm run test
```

## Continuous Integration

This project uses GitHub Actions to automatically run the entire test suite on every push and pull request to the `main` branch.

The workflow is defined in `.github/workflows/ci.yml`.

The public FTP/SFTP credentials are included directly in the workflow. However, for the S3 tests to run, you must configure your AWS credentials as secrets in your GitHub repository settings under **Settings > Secrets and variables > Actions**.

The required secrets are:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `S3_BUCKET`

## Allure Reports

This project uses Allure to generate detailed and interactive test reports.

After each run in the GitHub Actions pipeline, a report is automatically generated and deployed to GitHub Pages. You can view the latest report by navigating to the **Environments** section on the main page of the repository and clicking on **github-pages**.

## Test Files

- `ftp.cy.js`: FTP operations tests
- `sftp.cy.js`: SFTP operations tests
- `s3.cy.js`: S3 operations tests

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
