const db = require('../dbConnec');

exports.createTeacherNote = async (data) => {
    const [result] = await db.execute(
      'INSERT INTO teacher_notes (user_id, topic, notes, reference_books, youtube_link, access, journey_id, chapter_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [data.user_id, data.topic, data.notes, data.reference_books, data.youtube_link, data.access, data.journey_id || null, data.chapter_id || null]
    );
    return result.insertId;
  };

  exports.getTeacherNotesByUser = async (userId, journeyId = null) => {
    let query = 'SELECT * FROM teacher_notes WHERE user_id = ?';
    let params = [userId];
    if (journeyId) {
      query += ' AND (journey_id = ? OR access = "public")';
      params.push(journeyId);
    }
    const [rows] = await db.execute(query, params);
    return rows;
  };

exports.getAllPublicTeacherNotes = async () => {
    const [rows] = await db.execute('SELECT * FROM teacher_notes WHERE access = ? ORDER BY created_at DESC', ['public']);
    return rows;
};

exports.getTeacherNoteById = async (note_id, user_id) => {
    console.log('Fetching teacher note with ID:', note_id, 'for user:', user_id);
    const [rows] = await db.execute('SELECT * FROM teacher_notes WHERE id = ? AND user_id = ?', [note_id, user_id]);
    console.log('Query result:', rows);
    return rows[0];
};

exports.updateTeacherNote = async (note_id, user_id, data) => {
    const [result] = await db.execute(
      'UPDATE teacher_notes SET topic = ?, notes = ?, reference_books = ?, youtube_link = ?, access = ?, journey_id = ?, chapter_id = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [data.topic, data.notes, data.reference_books, data.youtube_link, data.access, data.journey_id || null, data.chapter_id || null, note_id, user_id]
    );
    return result.affectedRows > 0;
  };

exports.deleteTeacherNote = async (note_id, user_id) => {
    const [result] = await db.execute('DELETE FROM teacher_notes WHERE id = ? AND user_id = ?', [note_id, user_id]);
    return result.affectedRows > 0;
};
