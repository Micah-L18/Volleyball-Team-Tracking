const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../models/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  }
});

// Upload video
router.post('/upload', authMiddleware, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { filename, originalname, size, mimetype, path: filePath } = req.file;

    const result = await pool.query(`
      INSERT INTO video_attachments (file_name, file_path, file_size, mime_type, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [originalname, filePath, size, mimetype, req.coach.id]);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Attach video to note
router.post('/attach', authMiddleware, async (req, res) => {
  try {
    const { player_id, video_id, note_type, reference_id, description } = req.body;

    // Verify player access
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      WHERE p.id = $1 AND t.coach_id = $2
    `, [player_id, req.coach.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      INSERT INTO note_videos (player_id, video_id, note_type, reference_id, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [player_id, video_id, note_type, reference_id, description]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error attaching video:', error);
    res.status(500).json({ error: 'Failed to attach video' });
  }
});

// Get videos for a player
router.get('/player/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    
    // Verify player access
    const playerCheck = await pool.query(`
      SELECT p.id FROM player p
      JOIN team t ON p.team_id = t.id
      WHERE p.id = $1 AND t.coach_id = $2
    `, [playerId, req.coach.id]);

    if (playerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT nv.*, va.file_name, va.file_path, va.file_size, va.mime_type, va.uploaded_at
      FROM note_videos nv
      JOIN video_attachments va ON nv.video_id = va.id
      WHERE nv.player_id = $1
      ORDER BY va.uploaded_at DESC
    `, [playerId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching player videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Serve video files
router.get('/stream/:videoId', authMiddleware, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const result = await pool.query(`
      SELECT file_path, file_name, mime_type FROM video_attachments WHERE id = $1
    `, [videoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const { file_path, file_name, mime_type } = result.rows[0];
    
    if (!fs.existsSync(file_path)) {
      return res.status(404).json({ error: 'Video file not found' });
    }

    const stat = fs.statSync(file_path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(file_path, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mime_type,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mime_type,
      };
      res.writeHead(200, head);
      fs.createReadStream(file_path).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ error: 'Failed to stream video' });
  }
});

// Get all videos for a team
router.get('/team', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT va.*, p.first_name, p.last_name
      FROM video_attachments va
      LEFT JOIN note_videos nv ON va.id = nv.video_id
      LEFT JOIN player p ON nv.player_id = p.id
      LEFT JOIN team t ON p.team_id = t.id
      WHERE t.coach_id = $1 OR va.uploaded_by = $1
      ORDER BY va.uploaded_at DESC
    `, [req.coach.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching team videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

module.exports = router;
