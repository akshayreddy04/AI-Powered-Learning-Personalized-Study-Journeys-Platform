const express = require('express');
const router = express.Router();
const teacherNoteController = require('../controllers/teacherNoteController');
const authenticateToken = require("../controllers/auth");

router.post('/teachernotes', authenticateToken, teacherNoteController.createTeacherNote);
router.get('/teachernotes', authenticateToken, teacherNoteController.getTeacherNotesByUser);
router.get('/teachernotes/public', teacherNoteController.getAllPublicTeacherNotes);
router.get('/teachernotes/:noteId', authenticateToken, teacherNoteController.getTeacherNoteById);
router.put('/teachernotes/:noteId', authenticateToken, teacherNoteController.updateTeacherNote);
router.delete('/teachernotes/:noteId', authenticateToken, teacherNoteController.deleteTeacherNote);
router.get('/teachernotes/recommend', authenticateToken, teacherNoteController.recommendNotes);

module.exports = router;