const TeacherNote = require('../models/teacherNoteModel');

exports.createTeacherNote = async (req, res) => {
  try {
    const { topic, notes, reference_books, youtube_link, access, journey_id, chapter_id } = req.body;
    if (!topic || !notes) {
      return res.status(400).json({ error: 'Topic and notes are required!' });
    }
    const noteId = await TeacherNote.createTeacherNote({
      user_id: req.user.id,
      topic,
      notes,
      reference_books: reference_books || null,
      youtube_link: youtube_link || null,
      access: access || 'public',
      journey_id: journey_id || null,
      chapter_id: chapter_id || null
    });
    res.status(201).json({ message: 'Teacher note created successfully!', id: noteId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeacherNotesByUser = async (req, res) => {
  try {
    const { journey_id } = req.query;
    let notes = await TeacherNote.getTeacherNotesByUser(req.user.id);
    if (journey_id) {
      notes = notes.filter(note => note.journey_id === parseInt(journey_id) || note.access === 'public');
    }
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPublicTeacherNotes = async (req, res) => {
  try {
    const notes = await TeacherNote.getAllPublicTeacherNotes();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTeacherNoteById = async (req, res) => {
  try {
    const note = await TeacherNote.getTeacherNoteById(req.params.noteId, req.user.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found or not authorized!' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTeacherNote = async (req, res) => {
  try {
    const { topic, notes, reference_books, youtube_link, access, journey_id, chapter_id } = req.body;
    const noteId = parseInt(req.params.noteId, 10);
    if (isNaN(noteId)) {
      return res.status(400).json({ error: 'Invalid note ID' });
    }
    const note = await TeacherNote.getTeacherNoteById(noteId, req.user.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found or not authorized!' });
    }
    const updateData = {
      topic: topic || note.topic,
      notes: notes || note.notes,
      reference_books: reference_books !== undefined ? reference_books : null,
      youtube_link: youtube_link !== undefined ? youtube_link : null,
      access: access || note.access,
      journey_id: journey_id || note.journey_id || null,
      chapter_id: chapter_id || note.chapter_id || null
    };
    const updated = await TeacherNote.updateTeacherNote(noteId, req.user.id, updateData);
    if (updated) {
      res.json({ message: 'Teacher note updated successfully!' });
    } else {
      res.status(400).json({ error: 'Failed to update note' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTeacherNote = async (req, res) => {
  try {
    const note = await TeacherNote.getTeacherNoteById(req.params.noteId, req.user.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found or not authorized!' });
    }
    const deleted = await TeacherNote.deleteTeacherNote(req.params.noteId, req.user.id);
    if (deleted) {
      res.json({ message: 'Teacher note deleted successfully!' });
    } else {
      res.status(400).json({ error: 'Failed to delete note' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.recommendNotes = async (req, res) => {
    try {
      const { journey_id } = req.query;
      let notes = await TeacherNote.getTeacherNotesByUser(req.user.id);
  
      // Handle empty or missing journey_id by returning public notes
      if (journey_id && journey_id.trim()) {
        const numericJourneyId = parseInt(journey_id);
        notes = notes.filter(note => note.journey_id === numericJourneyId || note.access === 'public');
      } else {
        notes = notes.filter(note => note.access === 'public');
      }
  
      if (notes.length === 0) {
        return res.json({ recommendations: [] }); // Return empty array instead of 404
      }
  
      res.json({ recommendations: notes });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };