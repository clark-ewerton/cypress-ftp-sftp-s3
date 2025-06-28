const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    retries: {
      runMode: 2, // Will retry up to 2 times when running via `cypress run`
      openMode: 1, // Will retry up to 1 time when running via `cypress open`
    },
    setupNodeEvents(on, config) {
      require('dotenv').config();

      // Pass AWS credentials from Node's process.env to Cypress's config.env
      // This makes them accessible via Cypress.env() in the test files.
      config.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
      config.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
      config.env.AWS_REGION = process.env.AWS_REGION;
      config.env.S3_BUCKET = process.env.S3_BUCKET;

      const FtpClient = require('ftp');
      const SftpClient = require('ssh2').Client;
      const fs = require('fs');
      const path = require('path');
      const AWS = require('aws-sdk');

      on('task', {
        ftpConnect() {
          return new Promise((resolve, reject) => {
            const client = new FtpClient();
            client.on('ready', () => {
              resolve(true);
              client.end();
            });
            client.on('error', (err) => {
              console.error('FTP Connection Error:', err);
              reject(err);
            });
            client.connect({
              host: process.env.FTP_HOST,
              user: process.env.FTP_USER,
              password: process.env.FTP_PASSWORD,
              debug: console.log
            });
          });
        },

        ftpUpload({ localFile, remotePath }) {
          console.log('--- FTP Upload Task ---');

          return new Promise((resolve, reject) => {
            const client = new FtpClient();
            client.on('ready', () => {
              client.put(localFile, remotePath, (err) => {
                if (err) {
                  console.error('FTP Upload Error:', err);
                  client.end();
                  return reject(err);
                }
                client.end();
                resolve(true);
              });
            });
            client.on('error', (err) => {
              console.error('FTP Connection Error (Upload Task):', err);
              reject(err);
            });
            client.connect({
              host: process.env.FTP_HOST,
              user: process.env.FTP_USER,
              password: process.env.FTP_PASSWORD,
              debug: console.log
            });
          });
        },

        ftpDownload({ localPath, remoteFile }) {
          console.log('--- FTP Download Task ---');
          fs.mkdirSync(path.dirname(localPath), { recursive: true });
          return new Promise((resolve, reject) => {
            const client = new FtpClient();
            client.on('ready', () => {
              client.get(remoteFile, (err, stream) => {
                if (err) {
                  console.error('FTP Download Error:', err);
                  client.end();
                  return reject(err);
                }
                stream.once('close', () => {
                  client.end();
                  resolve(true);
                });
                stream.pipe(fs.createWriteStream(localPath));
              });
            });
            client.on('error', (err) => {
              console.error('FTP Connection Error (Download Task):', err);
              reject(err);
            });
            client.connect({
              host: process.env.FTP_HOST,
              user: process.env.FTP_USER,
              password: process.env.FTP_PASSWORD,
              debug: console.log
            });
          });
        },

        sftpUpload({ localFile, remotePath }) {
          const client = new SftpClient();
          const credentials = {
            host: process.env.SFTP_HOST,
            port: process.env.SFTP_PORT,
            username: process.env.SFTP_USER,
            password: process.env.SFTP_PASSWORD,
          };
          return new Promise((resolve, reject) => {
            client.on('ready', () => {
              client.sftp((err, sftp) => {
                if (err) return reject(err);
                const readStream = fs.createReadStream(localFile);
                const writeStream = sftp.createWriteStream(remotePath);
                writeStream.on('close', () => client.end()); // Use 'close' event for reliability
                writeStream.on('error', (err) => reject(err));
                readStream.pipe(writeStream);
              });
            })
            .on('hostkey', (key, type, hash, callback) => callback(true)) // Auto-accept host key
            .on('error', (err) => reject(err))
            .on('close', () => resolve(true))
            .connect(credentials);
          });
        },

        sftpDownload({ localPath, remoteFile }) {
          fs.mkdirSync(path.dirname(localPath), { recursive: true });
          const client = new SftpClient();
          const credentials = {
            host: process.env.SFTP_HOST,
            port: process.env.SFTP_PORT,
            username: process.env.SFTP_USER,
            password: process.env.SFTP_PASSWORD,
          };
          return new Promise((resolve, reject) => {
            client.on('ready', () => {
              client.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.fastGet(remoteFile, localPath, (err) => {
                  if (err) return reject(err);
                  client.end();
                });
              });
            })
            .on('hostkey', (key, type, hash, callback) => callback(true)) // Auto-accept host key
            .on('error', (err) => reject(err))
            .on('close', () => resolve(true))
            .connect(credentials);
          });
        },

        sftpDelete({ remotePath }) {
          const client = new SftpClient();
          const credentials = {
            host: process.env.SFTP_HOST,
            port: process.env.SFTP_PORT,
            username: process.env.SFTP_USER,
            password: process.env.SFTP_PASSWORD,
          };
          return new Promise((resolve, reject) => {
            client.on('ready', () => {
              client.sftp((err, sftp) => {
                if (err) return reject(err);
                sftp.unlink(remotePath, (err) => {
                  if (err) return reject(err);
                  client.end();
                });
              });
            })
            .on('hostkey', (key, type, hash, callback) => callback(true)) // Auto-accept host key
            .on('error', (err) => reject(err))
            .on('close', () => resolve(true))
            .connect(credentials);
          });
        },



        s3Upload({ key, filePath }) {
          const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
          });
          const fileContent = fs.readFileSync(filePath);
          const params = {
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: fileContent
          };
          return s3.upload(params).promise();
        },

        s3Download({ key, downloadPath }) {
          const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
          });
          const params = {
            Bucket: process.env.S3_BUCKET,
            Key: key
          };
          return new Promise((resolve, reject) => {
            fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
            const file = fs.createWriteStream(downloadPath);
            s3.getObject(params).createReadStream()
              .on('end', () => resolve(true))
              .on('error', (error) => reject(error))
              .pipe(file);
          });
        },

        ftpDelete(remotePath) {
          const credentials = {
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            debug: console.log
          };
          return new Promise((resolve, reject) => {
            const client = new FtpClient();
            client.on('ready', () => {
              client.delete(remotePath, (err) => {
                if (err) {
                  client.end();
                  return reject(err);
                }
                client.end();
                resolve(true);
              });
            });
            client.on('error', (err) => reject(err));
            client.connect(credentials);
          });
        },

        s3Delete({ key }) {
          const s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
          });
          const params = {
            Bucket: process.env.S3_BUCKET,
            Key: key
          };
          return s3.deleteObject(params).promise();
        },

        deleteLocalFile({ filePath }) {
          return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
              if (err) {
                // If the file doesn't exist, that's fine, just resolve
                if (err.code === 'ENOENT') {
                  return resolve(true);
                }
                return reject(err);
              }
              resolve(true);
            });
          });
        }
      });

      // Make sure to return the config object as it might have been modified by plugins.
      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
  },
})
