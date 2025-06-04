// File upload handling
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Functions = require('./functions');

class Upload {
    constructor() {
        this.uploadDir = './public/uploads';
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        this.ensureUploadDirectories();
    }

    // Ensure upload directories exist
    ensureUploadDirectories() {
        const directories = [
            `${this.uploadDir}/products`,
            `${this.uploadDir}/users`,
            `${this.uploadDir}/temp`
        ];

        directories.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    // Configure multer for product images
    getProductImageStorage() {
        return multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, `${this.uploadDir}/products/`);
            },
            filename: (req, file, cb) => {
                const fileName = Functions.generateFileName(file.originalname);
                cb(null, fileName);
            }
        });
    }

    // Configure multer for user avatars
    getUserAvatarStorage() {
        return multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, `${this.uploadDir}/users/`);
            },
            filename: (req, file, cb) => {
                const fileName = Functions.generateFileName(file.originalname);
                cb(null, fileName);
            }
        });
    }

    // File filter for images
    imageFileFilter(req, file, cb) {
        if (this.allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'), false);
        }
    }

    // Create product image upload middleware
    createProductImageUpload() {
        return multer({
            storage: this.getProductImageStorage(),
            limits: {
                fileSize: this.maxFileSize
            },
            fileFilter: this.imageFileFilter.bind(this)
        }).single('image');
    }

    // Create user avatar upload middleware
    createUserAvatarUpload() {
        return multer({
            storage: this.getUserAvatarStorage(),
            limits: {
                fileSize: this.maxFileSize
            },
            fileFilter: this.imageFileFilter.bind(this)
        }).single('avatar');
    }

    // Create multiple file upload middleware
    createMultipleUpload(fieldName, maxCount = 5) {
        return multer({
            storage: multer.diskStorage({
                destination: (req, file, cb) => {
                    cb(null, `${this.uploadDir}/temp/`);
                },
                filename: (req, file, cb) => {
                    const fileName = Functions.generateFileName(file.originalname);
                    cb(null, fileName);
                }
            }),
            limits: {
                fileSize: this.maxFileSize
            },
            fileFilter: this.imageFileFilter.bind(this)
        }).array(fieldName, maxCount);
    }

    // Handle upload errors
    handleUploadError(error, req, res, next) {
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 5MB.'
                });
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Maximum 5 files allowed.'
                });
            }
        }

        if (error.message.includes('Invalid file type')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }

    // Delete file
    deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            const fullPath = path.join(this.uploadDir, filePath);
            
            fs.unlink(fullPath, (err) => {
                if (err) {
                    // File doesn't exist or other error, but don't fail the operation
                    console.log(`Warning: Could not delete file ${fullPath}:`, err.message);
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Move file from temp to permanent location
    moveFile(tempPath, permanentPath) {
        return new Promise((resolve, reject) => {
            const sourcePath = path.join(this.uploadDir, 'temp', tempPath);
            const destPath = path.join(this.uploadDir, permanentPath);

            fs.rename(sourcePath, destPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    // Get file info
    getFileInfo(filePath) {
        return new Promise((resolve, reject) => {
            const fullPath = path.join(this.uploadDir, filePath);
            
            fs.stat(fullPath, (err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        size: stats.size,
                        created: stats.birthtime,
                        modified: stats.mtime,
                        isFile: stats.isFile(),
                        isDirectory: stats.isDirectory()
                    });
                }
            });
        });
    }

    // Clean up old temp files
    cleanupTempFiles(maxAge = 24) { // hours
        const tempDir = path.join(this.uploadDir, 'temp');
        const maxAgeMs = maxAge * 60 * 60 * 1000;
        const now = Date.now();

        fs.readdir(tempDir, (err, files) => {
            if (err) {
                console.log('Error reading temp directory:', err.message);
                return;
            }

            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    
                    if (now - stats.mtime.getTime() > maxAgeMs) {
                        fs.unlink(filePath, (err) => {
                            if (!err) {
                                console.log(`Cleaned up old temp file: ${file}`);
                            }
                        });
                    }
                });
            });
        });
    }

    // Validate and process uploaded file
    async processUploadedFile(file, type = 'product') {
        if (!file) {
            return { success: false, message: 'No file uploaded' };
        }

        // Validate file
        const validation = Functions.validateImageUpload(file);
        if (!validation.valid) {
            await this.deleteFile(file.path);
            return { success: false, message: validation.error };
        }

        // Generate new filename if needed
        const newFileName = Functions.generateFileName(file.originalname);
        
        return {
            success: true,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            path: file.path
        };
    }
}

module.exports = Upload;
