const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Database } = require('./includes/database');
const { Functions } = require('./includes/functions');
const { Session } = require('./includes/session');
const { Upload } = require('./includes/upload');

const db = new Database();
const functions = new Functions();
const session = new Session();
const upload = new Upload();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/products/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// GET /api/media - Get all media files
router.get('/', async (req, res) => {
  try {
    // Check user permission level (equivalent to page_require_level(2))
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all media files (equivalent to find_all('media'))
    const query = 'SELECT * FROM media ORDER BY id DESC';
    const mediaFiles = await db.query(query);
    
    res.json({
      success: true,
      media: mediaFiles,
      message: session.getMsg()
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching media files' 
    });
  }
});

// GET /api/media/:id - Get single media file
router.get('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const mediaId = parseInt(req.params.id);
    const query = 'SELECT * FROM media WHERE id = ?';
    const mediaFiles = await db.query(query, [mediaId]);
    
    if (mediaFiles.length === 0) {
      return res.status(404).json({ success: false, message: 'Media file not found' });
    }
    
    res.json({
      success: true,
      media: mediaFiles[0]
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching media file' 
    });
  }
});

// POST /api/media/upload - Upload new media file
router.post('/upload', uploadMiddleware.single('file'), async (req, res) => {
  try {
    // Check user permission level
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const file = req.file;
    const fileName = file.filename;
    const fileType = file.mimetype;
    const fileSize = file.size;
    const uploadDate = functions.makeDate();

    // Save file information to database
    const query = `
      INSERT INTO media (file_name, file_type, file_size, upload_date)
      VALUES (?, ?, ?, ?)
    `;
    
    const result = await db.query(query, [fileName, fileType, fileSize, uploadDate]);
    
    session.setMsg('s', 'Photo has been uploaded successfully');
    res.json({
      success: true,
      message: 'File uploaded successfully',
      media: {
        id: result.insertId,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        upload_date: uploadDate
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up uploaded file if database insert failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    session.setMsg('d', 'Failed to upload file');
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading file' 
    });
  }
});

// POST /api/media/upload-multiple - Upload multiple media files
router.post('/upload-multiple', uploadMiddleware.array('files', 10), async (req, res) => {
  try {
    // Check user permission level
    if (!req.user || req.user.user_level < 2) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    const uploadedFiles = [];
    const uploadDate = functions.makeDate();

    for (const file of req.files) {
      const fileName = file.filename;
      const fileType = file.mimetype;
      const fileSize = file.size;

      // Save file information to database
      const query = `
        INSERT INTO media (file_name, file_type, file_size, upload_date)
        VALUES (?, ?, ?, ?)
      `;
      
      try {
        const result = await db.query(query, [fileName, fileType, fileSize, uploadDate]);
        uploadedFiles.push({
          id: result.insertId,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
          upload_date: uploadDate
        });
      } catch (dbError) {
        console.error('Error saving file to database:', dbError);
        // Clean up uploaded file if database insert failed
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
    }
    
    session.setMsg('s', `${uploadedFiles.length} photo(s) uploaded successfully`);
    res.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      media: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
    }
    
    session.setMsg('d', 'Failed to upload files');
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading files' 
    });
  }
});

// DELETE /api/media/:id - Delete media file
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user || req.user.user_level < 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const mediaId = parseInt(req.params.id);
    
    // Get media file information
    const mediaFile = await db.query('SELECT * FROM media WHERE id = ?', [mediaId]);
    if (mediaFile.length === 0) {
      return res.status(404).json({ success: false, message: 'Media file not found' });
    }
    
    // Check if media is being used by products
    const productsUsingMedia = await db.query('SELECT id FROM products WHERE media_id = ?', [mediaId]);
    if (productsUsingMedia.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete media - it is being used by products' 
      });
    }
    
    // Delete physical file
    const filePath = path.join('uploads/products', mediaFile[0].file_name);
    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting physical file:', fileError);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete from database
    await db.query('DELETE FROM media WHERE id = ?', [mediaId]);
    
    session.setMsg('s', 'Media file deleted successfully');
    res.json({
      success: true,
      message: 'Media file deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    session.setMsg('d', 'Sorry, failed to delete media file');
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting media file' 
    });
  }
});

// GET /api/media/file/:filename - Serve media file
router.get('/file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('uploads/products', filename);
    
    // Check if file exists
    res.sendFile(path.resolve(filePath), (err) => {
      if (err) {
        console.error('Error serving file:', err);
        res.status(404).json({ 
          success: false, 
          message: 'File not found' 
        });
      }
    });
  } catch (error) {
    console.error('Error serving media file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error serving file' 
    });
  }
});

module.exports = router;
