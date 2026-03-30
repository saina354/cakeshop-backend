const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// @route POST /api/upload/:type
router.post('/:type', protect, authorize('admin', 'staff'), (req, res, next) => {
  const uploader = upload.array('images', 10);
  uploader(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const urls = req.files.map(f => `/uploads/${req.params.type}/${f.filename}`);
    res.json({ success: true, data: urls, message: `${req.files.length} file(s) uploaded successfully` });
  });
});

// @route DELETE /api/upload
router.delete('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { filepath } = req.body;
    if (!filepath) return res.status(400).json({ success: false, message: 'filepath required' });
    const fullPath = path.join(__dirname, '..', filepath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
