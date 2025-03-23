import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { calculateProgress, extractVideoId, journey, textss } from '../Constants';
import CreateChapter from '../Components/forms/CreateChapter';
import AddNotes from '../Components/forms/AddNotes';
import EditChapter from '../Components/forms/EditChapter';
import VideoPlayer from '../Components/VideoPlayer';
import { getJourneyById } from '../Api/journeys';
import { deleteChapter, getChaptersByJourneyId, updateChapterComplete } from '../Api/chapters';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getAuthToken, logout } from '../Constants'; // For authentication

const JourneyPage = () => {
  const [toggleDropDown, setToggleDD] = useState('hidden');
  const toggleDD = () => {
    setToggleDD(toggleDropDown === 'hidden' ? ' ' : 'hidden');
  };

  const [chapters, setChapters] = useState([]);
  const [teacherNotes, setTeacherNotes] = useState([]); // State for teacher notes
  const [recommendedNotes, setRecommendedNotes] = useState([]); // State for recommended notes
  const { jId } = useParams();
  const [open, setOpen] = useState(false);
  const [chapterId, setChapterId] = useState(null);
  const [chDetails, setChDetails] = useState(null);
  const [openNotes, setOpenNotes] = useState(false); // For adding notes modal
  const [openEdit, setOpenEdit] = useState(false);
  const [jData, setJData] = useState('');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate(); // Added for navigation

  const deleteOneChapter = async (chapterId) => {
    const isConfirmed = window.confirm('Are you sure you want to delete this chapter?');
    if (isConfirmed) {
      try {
        await deleteChapter(chapterId);
        console.log('Chapter deleted successfully.');
        fetchData();
      } catch (error) {
        console.error('Error deleting chapter:', error);
      }
    } else {
      console.log('Deletion canceled.');
    }
  };

  const updateCheckBox = async (check, chId) => {
    const chapterData = {
      is_completed: !check, // Toggle the completion status
    };

    try {
      const response = await updateChapterComplete(chId, chapterData);
      console.log(response);
      await fetchData(); // Wait for the data to be fetched before calculating progress
    } catch (error) {
      console.error('Error updating chapter:', error);
    }
  };

  const fetchData = async () => {
    try {
      const journeys = await getJourneyById(jId);
      const chapterList = await getChaptersByJourneyId(jId);

      if (journeys) {
        setJData(journeys);
        console.log('Journey data:', journeys);
      }

      if (chapterList) {
        setChapters(chapterList);
        console.log('Chapters:', chapterList);
        getProgress(chapterList);
      }

      // Fetch teacher notes and recommendations for this journey
      await fetchTeacherNotesForJourney(jId);
      await fetchRecommendedNotes(jId);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getProgress = (chapterList) => {
    if (chapterList.length !== 0) {
      const percent = calculateProgress(chapterList);
      console.log('Progress:', percent);
      setProgress(percent);
    }
  };

  // Fetch teacher notes for the current journey
  const fetchTeacherNotesForJourney = async (journeyId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/teachernotes?journey_id=${journeyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeacherNotes(data);
      } else {
        console.error('Expected an array of teacher notes, but got:', data);
        toast.error('Invalid response format for teacher notes.');
      }
    } catch (error) {
      console.error('Error fetching teacher notes for journey:', error);
      toast.error('Failed to fetch teacher notes.');
    }
  };

  // Fetch recommended notes for the current journey
  const fetchRecommendedNotes = async (journeyId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/teachernotes/recommend?journey_id=${journeyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data.recommendations)) {
        setRecommendedNotes(data.recommendations);
      } else {
        console.error('Expected an array of recommended notes, but got:', data);
        toast.error('Invalid response format for recommended notes.');
      }
    } catch (error) {
      console.error('Error fetching recommended teacher notes:', error);
      toast.error('Failed to fetch recommended notes.');
    }
  };

  // Handle opening the notes modal for a specific chapter
  const handleOpenNotes = (chapter) => {
    setChapterId(chapter.id);
    setOpenNotes(true);
  };

  // Handle submitting a new or updated teacher note for a chapter
  const handleSubmitNote = async (noteData) => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }

      const formData = {
        topic: noteData.topic,
        notes: noteData.notesContent,
        reference_books: noteData.referenceBooks || null,
        youtube_link: noteData.youtubeLink || null,
        access: noteData.access || 'public',
        chapter_id: chapterId, // Link to the chapter
        journey_id: jId,       // Link to the journey
      };

      let response;
      if (noteData.id) { // Update existing note
        response = await fetch(`http://localhost:5000/api/v1/teachernotes/${noteData.id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else { // Create new note
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
      toast.success(noteData.id ? 'Note updated successfully 👌' : 'Note added successfully 👌');
      await fetchTeacherNotesForJourney(jId); // Refresh notes list
      await fetchRecommendedNotes(jId); // Refresh recommendations
      setOpenNotes(false); // Close the modal
    } catch (error) {
      console.error('Error submitting teacher note:', error);
      toast.error('Failed to submit the note. 😞');
    }
  };

  // Handle deleting a teacher note
  const handleDeleteNote = async (noteId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        navigate('/auth');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/v1/teachernotes/${noteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setTeacherNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      setRecommendedNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId)); // Update recommended notes
      toast.success('Note deleted successfully 👌');
    } catch (error) {
      console.error('Error deleting teacher note:', error);
      toast.error('Failed to delete the note. 😞');
    }
  };

  useEffect(() => {
    fetchData();
  }, [open, setOpen, setOpenEdit, setOpenNotes]); // Include setOpenNotes for re-fetching

  return (
    <div>
      {/* Banner */}
      <section className="bg-white px-4 py-3 antialiased dark:bg-gray-900 md:py-8">
        <div className="mx-auto grid max-w-screen-xl rounded-lg bg-gray-50 p-4 dark:bg-gray-800 md:p-8 lg:grid-cols-12 lg:gap-8 lg:p-16 xl:gap-16">
          <div className="lg:col-span-10 lg:mt-0">
            <div className="flex flex-col gap-3">
              <div className="font-bold text-4xl text-white">{jData.title}</div>
              <div className="font-medium text-xl text-white">{jData.description}</div>
              <div className="font-semi text-md font-semibold text-white bg-slate-600 rounded-md w-fit p-1">
                {jData.is_public ? 'public' : 'private'}
              </div>

              <div className="my-6 w-full bg-gray-300 rounded-full h-4">
                <div className={`bg-blue-600 h-4 rounded-full`} style={{ width: `${progress}%` }}></div>
                <div className="font-semi text-xl text-white my-1">Progress: {progress}%</div>
              </div>
            </div>
          </div>

          <div className="my-5 me-auto place-content-end place-self-start place-items-center lg:col-span-1">
            <Link
              to={`/notes/${jData.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-5 py-3 text-center text-base font-medium text-white hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900"
            >
              Notes
            </Link>
          </div>
        </div>

        <div className="my-4 mx-auto max-w-screen-xl rounded-lg text-white bg-gray-500 p-4 md:p-8 flex flex-col">
          <h1 className="text-4xl font-bold my-4">Chapters</h1>

          <div className="bg-white dark:bg-gray-800 relative shadow-md sm:rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
              <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
                <button
                  onClick={() => setOpen(!open)}
                  type="button"
                  id="createProductModalButton"
                  data-modal-target="createProductModal"
                  data-modal-toggle="createProductModal"
                  className="flex items-center justify-center text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800"
                >
                  <span className="font-bold text-2xl pb-1 mx-2">+</span> Add New Chapter
                </button>
                <CreateChapter open={open} setOpen={setOpen} journeyId={jId} />
                <EditChapter openEdit={openEdit} setOpenEdit={setOpenEdit} chapterId={chapterId} chDetails={chDetails} />
              </div>
              {textss[0]}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-4 py-4">Status</th>
                    <th scope="col" className="px-4 py-4">Chapter Id</th>
                    <th scope="col" className="px-4 py-3">Chapter Title</th>
                    <th scope="col" className="px-4 py-3">Teacher Notes</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                    <th scope="col" className="px-4 py-3">Actions</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>

                <tbody>
                  {chapters && chapters?.map((chapter, index) => (
                    <tr key={chapter.id} className="border-b dark:border-gray-700">
                      <td className="px-4 py-3 text-md font-semibold">
                        <input
                          type="checkbox"
                          checked={chapter.is_completed}
                          onClick={() => updateCheckBox(chapter.is_completed, chapter.id)}
                          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                        />
                      </td>
                      <th scope="row" className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {index + 1}
                      </th>
                      <td className="px-4 py-3 text-md font-semibold cursor-pointer hover:underline">
                        <Link to={`/player/${chapter.id}`}>
                          {chapter.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleOpenNotes(chapter)}
                          className="text-yellow-500 rounded hover:bg-slate-900 p-2 text-md font-semibold border"
                        >
                          View/Add Notes
                        </button>
                      </td>
                      <td className="px-4 py-3 max-w-[12rem] truncate">
                        <button
                          className="text-green-500 rounded hover:bg-slate-900 p-2 text-md font-semibold border"
                          onClick={() => {
                            setChDetails(chapter);
                            setChapterId(chapter.id);
                            setOpenEdit(!openEdit);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                      <td className="px-4 py-3 max-w-[12rem] truncate">
                        <button
                          className="text-red-500 rounded hover:bg-slate-900 p-2 text-md font-semibold border"
                          onClick={() => deleteOneChapter(chapter.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Notes Section */}
      <div className="container mx-auto mt-8 px-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Recommended Notes for This Journey</h2>
        {recommendedNotes.length === 0 ? (
          <p className="text-gray-400">No recommended notes available for this journey.</p>
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
                  onClick={() => {
                    setEditingNoteId(note.id);
                    setTopic(note.topic);
                    setNotesContent(note.notes);
                    setReferenceBooks(note.reference_books || '');
                    setYoutubeLink(note.youtube_link || '');
                    setAccess(note.access);
                    handleOpenNotes({ id: note.chapter_id || note.journey_id }); // Open notes modal for editing
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Teacher Notes */}
      {openNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl w-full border border-purple-600">
            <h2 className="text-2xl font-bold text-white mb-6">Manage Teacher Notes for Chapter</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitNote({ topic, notesContent, referenceBooks, youtubeLink, access, id: editingNoteId }); }} className="space-y-4">
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
                  onClick={() => setOpenNotes(false)}
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

            {/* List Existing Teacher Notes for the Chapter/Journey */}
            <div className="mt-6">
              <h3 className="text-xl font-bold text-white mb-4">Existing Notes</h3>
              {teacherNotes
                .filter((note) => note.chapter_id === chapterId || note.journey_id === jId)
                .map((note) => (
                  <div key={note.id} className="p-4 bg-gray-700 rounded-lg mb-4">
                    <h4 className="text-lg font-semibold text-blue-400">{note.topic}</h4>
                    <p className="text-gray-300">{note.notes.length > 100 ? note.notes.substring(0, 100) + '...' : note.notes}</p>
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
                        onClick={() => {
                          setEditingNoteId(note.id);
                          setTopic(note.topic);
                          setNotesContent(note.notes);
                          setReferenceBooks(note.reference_books || '');
                          setYoutubeLink(note.youtube_link || '');
                          setAccess(note.access);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              {teacherNotes.filter((note) => note.chapter_id === chapterId || note.journey_id === jId).length === 0 && (
                <p className="text-gray-400">No teacher notes available for this chapter or journey.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyPage;