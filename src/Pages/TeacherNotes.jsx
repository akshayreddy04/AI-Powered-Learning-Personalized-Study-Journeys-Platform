import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import { useNavigate, useParams } from 'react-router-dom'; // Added useParams
import { getAuthToken, logout } from '../Constants'; // Use 'constants' if named differently

const TeacherNotes = () => {
  const [notes, setNotes] = useState([]);
  const [recommendedNotes, setRecommendedNotes] = useState([]); // State for recommended notes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [notesContent, setNotesContent] = useState('');
  const [referenceBooks, setReferenceBooks] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [access, setAccess] = useState('public');
  const [file, setFile] = useState(null); // State to hold the selected file
  const [editingNoteId, setEditingNoteId] = useState(null);
  const { journeyId: urlJourneyId } = useParams(); // Get journeyId from URL params
  const [localJourneyId, setLocalJourneyId] = useState(urlJourneyId || ''); // Default to URL param
  const navigate = useNavigate();

  const handleDownloadPDF = (note) => {
    const doc = new jsPDF();
    doc.setFontSize(12);

    // Add Title (Topic)
    doc.text(`Topic: ${note.topic}`, 10, 10);

    // Add Note Content
    doc.text(`Notes: ${note.notes}`, 10, 20);

    // Add Reference Books and YouTube link (if exists)
    if (note.reference_books) {
      doc.text(`Reference Books: ${note.reference_books}`, 10, 30);
    }

    if (note.youtube_link) {
      doc.text(`YouTube Link: ${note.youtube_link}`, 10, 40);
    }

    // Add Access
    doc.text(`Access: ${note.access}`, 10, 50);

    // Save the document
    doc.save(`${note.topic}.pdf`);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type;
    setFile(file); // Save the file for submission

    try {
      if (fileType === 'application/pdf') {
        // Extract text from PDF
        const buffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(buffer);
        let pdfText = '';

        const numPages = pdfDoc.getPageCount();
        for (let i = 0; i < numPages; i++) {
          const page = pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          pdfText += textContent.items.map((item) => item.str).join(' ');
        }

        setNotesContent((prevContent) => prevContent + '\n' + pdfText);
      } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword'
      ) {
        // Extract text from Word document
        const buffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
        setNotesContent((prevContent) => prevContent + '\n' + value.trim());
      } else {
        toast.error('Unsupported file type! Only PDFs and Word documents are allowed.');
      }
    } catch (error) {
      console.error('Error extracting file content:', error);
      toast.error('Failed to extract content from the file.');
    }
  };

  // Fetch notes and recommendations when the component mounts (for authenticated users)
  useEffect(() => {
    fetchNotes();
    fetchRecommendedNotes(); // Fetch recommendations on mount
  }, [localJourneyId]); // Re-fetch when localJourneyId changes

  const fetchNotes = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/teachernotes${localJourneyId ? `?journey_id=${localJourneyId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setNotes(data);
      } else {
        console.error('Expected an array of notes, but got:', data);
        toast.error('Invalid response format for notes.');
      }
    } catch (error) {
      console.error('Error fetching teacher notes:', error);
      toast.error('Failed to fetch notes.');
    }
  };

  const fetchRecommendedNotes = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/teachernotes/recommend?journey_id=${localJourneyId || ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('No recommended notes found, returning empty array');
          setRecommendedNotes([]); // Handle 404 gracefully
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data.recommendations)) {
        setRecommendedNotes(data.recommendations);
      } else {
        console.error('Expected an array of recommended notes, but got:', data);
        setRecommendedNotes([]); // Fallback to empty array
        toast.error('Invalid response format for recommended notes.');
      }
    } catch (error) {
      console.error('Error fetching recommended teacher notes:', error);
      setRecommendedNotes([]); // Fallback to empty array on error
      toast.error('Failed to fetch recommended notes.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }

      const formData = {
        topic,
        notes: notesContent,
        reference_books: referenceBooks || null,
        youtube_link: youtubeLink || null,
        access,
        journey_id: localJourneyId || null, // Link to journey (optional)
      };

      let response;
      if (editingNoteId) {
        response = await fetch(`http://localhost:5000/api/v1/teachernotes/${editingNoteId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('http://localhost:5000/api/v1/teachernotes', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      toast.success(editingNoteId ? 'Note updated successfully 👌' : 'Note added successfully 👌');
      await fetchNotes(); // Refresh notes list
      await fetchRecommendedNotes(); // Refresh recommendations
      closeModal();
    } catch (error) {
      console.error('Error submitting teacher note:', error);
      toast.error('Failed to submit the note. 😞');
    }
  };

  const openModal = () => {
    setEditingNoteId(null);
    setIsModalOpen(true);
    resetForm();
  };

  const openEditModal = async (note) => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/teachernotes/${note.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEditingNoteId(note.id);
      setTopic(data.topic);
      setNotesContent(data.notes);
      setReferenceBooks(data.reference_books || '');
      setYoutubeLink(data.youtube_link || '');
      setAccess(data.access);
      setLocalJourneyId(data.journey_id || ''); // Set journey ID if exists
      setFile(null); // Clear file when editing
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching note for editing:', error);
      toast.error('Failed to load note for editing.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/teachernotes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      setRecommendedNotes((prevNotes) => prevNotes.filter((note) => note.id !== id)); // Update recommended notes
      toast.success('Note deleted successfully 👌');
    } catch (error) {
      console.error('Error deleting teacher note:', error);
      toast.error('Failed to delete the note. 😞');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTopic('');
    setNotesContent('');
    setReferenceBooks('');
    setYoutubeLink('');
    setAccess('public');
    setLocalJourneyId('');
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="py-6 bg-gradient-to-r from-purple-800 via-purple-600 to-blue-500 shadow-lg">
        <h1 className="text-center text-4xl font-bold text-white tracking-wider">Teacher Notes</h1>
      </header>

      {/* Journey ID Input (Optional for Recommendations) */}
      <div className="container mx-auto mt-6 px-6">
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Journey ID (for Recommendations, optional)</label>
          <input
            type="text"
            value={localJourneyId}
            onChange={(e) => setLocalJourneyId(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter Journey ID (e.g., 1)"
          />
        </div>
      </div>

      {/* Add Note Button */}
      <div className="container mx-auto mt-6 px-6 flex justify-end">
        <button
          onClick={openModal}
          className="px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
        >
          + Add Note
        </button>
      </div>

      {/* Recommended Notes Section */}
      <div className="container mx-auto mt-8 px-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Recommended Notes</h2>
        {recommendedNotes.length === 0 ? (
          <p className="text-gray-400">No recommended notes available.</p>
        ) : (
          recommendedNotes.map((note, index) => (
            <div key={note.id || index} className="p-6 bg-gray-800 rounded-lg mb-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300">
              <h3 className="text-xl font-bold text-blue-400">{note.topic}</h3>
              <p className="mt-2 text-gray-300">{note.notes.length > 100 ? note.notes.substring(0, 100) + '...' : note.notes}</p>
              {note.reference_books && <p className="text-gray-500">References: {note.reference_books}</p>}
              {note.youtube_link && (
                <p className="text-gray-500">
                  <a href={note.youtube_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-300">
                    Watch Video
                  </a>
                </p>
              )}
              <p className="text-gray-500">Access: {note.access}</p>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => openEditModal(note)}
                  className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notes List */}
      <div className="container mx-auto mt-8 px-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {notes?.length === 0 ? (
          <p className="text-center text-gray-400 text-lg">No notes found. Start by adding some!</p>
        ) : (
          notes.map((note, index) => {
            // Trim the notes to 200 characters
            const trimmedNotes = note?.notes?.length > 200 ? note?.notes?.substring(0, 200) + '...' : note?.notes;
            return (
              <div
                key={note.id || index}
                className="p-6 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
              >
                <h3 className="text-xl font-bold text-blue-400">{note.topic}</h3>
                <p className="mt-2 text-gray-300">{trimmedNotes}</p>

                {note.notes && note.notes.length > 200 && (
                  <button
                    onClick={() => handleDownloadPDF(note)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    Download PDF
                  </button>
                )}

                {note.youtube_link && (
                  <p className="mt-2">
                    <a
                      href={note.youtube_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline hover:text-blue-300"
                    >
                      Watch Video
                    </a>
                  </p>
                )}
                <p className="mt-2 text-gray-500">Reference Books: {note.reference_books || 'None'}</p>
                <p className="text-gray-500">Access: {note.access}</p>
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => openEditModal(note)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-lg w-full border border-purple-600">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingNoteId ? 'Update Note' : 'Add a New Note'}
            </h2>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              <div>
                <label className="block text-gray-400">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400">Notes</label>
                <textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400">Reference Books</label>
                <input
                  type="text"
                  value={referenceBooks}
                  onChange={(e) => setReferenceBooks(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-400">YouTube Link</label>
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-400">Attach File</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-gray-400">Access</label>
                <select
                  value={access}
                  onChange={(e) => setAccess(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded-lg text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  {editingNoteId ? 'Update Note' : 'Submit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherNotes;