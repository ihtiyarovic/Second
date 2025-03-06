import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

// Use an environment variable for the backend URL
const API_URL = process.env.REACT_APP_API_URL || 'https://your-app-name.up.railway.app'; // Replace with your Railway URL

function Dashboard({ user, setUser }) {
  const [statistics, setStatistics] = useState({ totalPupils: 0, totalTeachers: 0, pupilStatistics: [] });
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: '',
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [answer, setAnswer] = useState({ question_id: null, selected_option: '' });
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'pupil' });

  useEffect(() => {
    if (user && user.token) {
      fetchQuestions();
      if (user.role === 'owner' || user.role === 'admin') {
        fetchStatistics();
      } else if (user.role === 'pupil') {
        fetchPupilStatistics();
      }
    }
  }, [user]);

  const fetchStatistics = async () => {
    try {
      const res = await axios.get(`${API_URL}/statistics`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setStatistics(res.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const fetchPupilStatistics = async () => {
    try {
      const res = await axios.get(`${API_URL}/statistics`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const pupilStats =
        res.data.pupilStatistics.find((stat) => stat.username === user.username) || {
          correctAnswers: 0,
          incorrectAnswers: 0,
        };
      setStatistics({ totalPupils: 0, totalTeachers: 0, pupilStatistics: [pupilStats] });
    } catch (err) {
      console.error('Error fetching pupil statistics:', err);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await axios.get(`${API_URL}/questions`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setQuestions(res.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      // Convert correct_answer to lowercase to match backend expectation
      const questionToAdd = {
        ...newQuestion,
        correct_answer: newQuestion.correct_answer.toLowerCase(), // Convert "A" to "a", etc.
      };
      console.log('Sending question:', questionToAdd); // Debug log
      const response = await axios.post(`${API_URL}/questions`, questionToAdd, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNewQuestion({
        text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: '',
      });
      fetchQuestions();
      alert('Question added successfully');
    } catch (err) {
      console.error('Error adding question:', err);
      alert('Failed to add question: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditQuestion = async (e) => {
    e.preventDefault();
    try {
      // Convert correct_answer to lowercase to match backend expectation
      const questionToUpdate = {
        ...editingQuestion,
        correct_answer: editingQuestion.correct_answer.toLowerCase(),
      };
      await axios.put(`${API_URL}/questions/${editingQuestion.id}`, questionToUpdate, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setEditingQuestion(null);
      fetchQuestions();
      alert('Question updated successfully');
    } catch (err) {
      console.error('Error updating question:', err);
      alert('Failed to update question: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      await axios.delete(`${API_URL}/questions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchQuestions();
      alert('Question deleted successfully');
    } catch (err) {
      console.error('Error deleting question:', err);
      alert('Failed to delete question: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answer.question_id || !answer.selected_option) {
      alert('Please select a question and answer.');
      return;
    }
    try {
      // Convert selected_option to lowercase to match backend expectation
      const answerToSubmit = {
        question_id: answer.question_id,
        selected_option: answer.selected_option.toLowerCase(), // Convert "A" to "a", etc.
      };
      await axios.post(`${API_URL}/answers`, answerToSubmit, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAnswer({ question_id: null, selected_option: '' });
      if (user.role === 'pupil') {
        fetchPupilStatistics();
      }
      alert('Answer submitted!');
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Failed to submit answer: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!user || !user.token) {
      alert('You must be logged in to add a user');
      return;
    }
    try {
      await axios.post(`${API_URL}/users`, newUser, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNewUser({ username: '', password: '', role: 'pupil' });
      if (user.role === 'owner' || user.role === 'admin') {
        fetchStatistics();
      }
      alert(`User ${newUser.username} added as ${newUser.role}`);
    } catch (err) {
      console.error('Error adding user:', err);
      alert('Failed to add user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRemoveUser = async (username) => {
    try {
      const userToRemove = statistics.pupilStatistics.find((stat) => stat.username === username);
      if (!userToRemove || !userToRemove.id) return;

      await axios.delete(`${API_URL}/users/${userToRemove.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchStatistics();
      alert(`User ${username} removed`);
    } catch (err) {
      console.error('Error removing user:', err);
      alert('Failed to remove user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  };

  if (!user || !user.token) return <div>Please log in to access the dashboard.</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <h2 className="dashboard-title">Dashboard ({user.role})</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>

        {/* Questions Section - Visible to All Roles (Pupils Can Answer, Owners/Admins Can Manage) */}
        <div className="questions-section">
          <h3 className="section-title">Questions</h3>
          <ul className="questions-list">
            {questions.map((q) => (
              <li key={q.id} className="question-item">
                <strong>{q.text}</strong>
                <br />
                A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d} (Correct: {q.correct_answer})
                {user.role === 'pupil' ? (
                  <form onSubmit={handleSubmitAnswer} className="answer-form">
                    <select
                      value={answer.question_id === q.id ? answer.selected_option : ''}
                      onChange={(e) =>
                        setAnswer({ question_id: q.id, selected_option: e.target.value })
                      }
                      className="answer-select"
                    >
                      <option value="">Select an answer</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={!answer.question_id || !answer.selected_option}
                    >
                      Submit Answer
                    </button>
                  </form>
                ) : (
                  (user.role === 'owner' || user.role === 'admin') && (
                    <div className="question-actions">
                      <button onClick={() => setEditingQuestion(q)} className="edit-button">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  )
                )}
              </li>
            ))}
          </ul>

          {/* Add/Edit Question - Only for Owners and Admins */}
          {(user.role === 'owner' || user.role === 'admin') && (
            <>
              <h4 className="sub-title">Add New Question</h4>
              <form onSubmit={handleAddQuestion} className="question-form">
                <input
                  type="text"
                  placeholder="Question Text"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="question-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Option A"
                  value={newQuestion.option_a}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_a: e.target.value })
                  }
                  className="question-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Option B"
                  value={newQuestion.option_b}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_b: e.target.value })
                  }
                  className="question-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Option C"
                  value={newQuestion.option_c}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_c: e.target.value })
                  }
                  className="question-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Option D"
                  value={newQuestion.option_d}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, option_d: e.target.value })
                  }
                  className="question-input"
                  required
                />
                <select
                  value={newQuestion.correct_answer}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, correct_answer: e.target.value })
                  }
                  className="question-select"
                  required
                >
                  <option value="">Select Correct Answer</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                <button type="submit" className="add-question-button">
                  Add Question
                </button>
              </form>

              {/* Edit Question */}
              {editingQuestion && (
                <div className="edit-question-section">
                  <h4 className="sub-title">Edit Question</h4>
                  <form onSubmit={handleEditQuestion} className="question-form">
                    <input
                      type="text"
                      value={editingQuestion.text}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, text: e.target.value })
                      }
                      className="question-input"
                      required
                    />
                    <input
                      type="text"
                      value={editingQuestion.option_a}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_a: e.target.value })
                      }
                      className="question-input"
                      required
                    />
                    <input
                      type="text"
                      value={editingQuestion.option_b}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_b: e.target.value })
                      }
                      className="question-input"
                      required
                    />
                    <input
                      type="text"
                      value={editingQuestion.option_c}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_c: e.target.value })
                      }
                      className="question-input"
                      required
                    />
                    <input
                      type="text"
                      value={editingQuestion.option_d}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_d: e.target.value })
                      }
                      className="question-input"
                      required
                    />
                    <select
                      value={editingQuestion.correct_answer}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          correct_answer: e.target.value,
                        })
                      }
                      className="question-select"
                      required
                    >
                      <option value="">Select Correct Answer</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <button type="submit" className="update-question-button">
                      Update Question
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {/* Add New User Section - Only for Owners and Admins */}
          {(user.role === 'owner' || user.role === 'admin') && (
            <div className="add-user-section">
              <h3 className="section-title">Add New User</h3>
              <form onSubmit={handleAddUser} className="user-form">
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="user-input"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="user-input"
                  required
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="role-select"
                  disabled={user.role !== 'owner'}
                >
                  <option value="pupil">Pupil</option>
                  {user.role === 'owner' && <option value="admin">Teacher</option>}
                </select>
                <button type="submit" className="add-user-button">
                  Add User
                </button>
              </form>
            </div>
          )}

          {/* User Statistics for Owners/Admins Only (with Remove Button) */}
          {(user.role === 'owner' || user.role === 'admin') && (
            <div className="statistics-section">
              <h3 className="section-title">User Statistics</h3>
              <p>Total Pupils: {statistics.totalPupils}</p>
              <p>Total Teachers: {statistics.totalTeachers}</p>
              <h4>Pupil Answer Statistics</h4>
              {statistics.pupilStatistics.length > 0 ? (
                <ul className="statistics-list">
                  {statistics.pupilStatistics.map((stat) => (
                    <li key={stat.username} className="statistic-item">
                      {stat.username}: {stat.correctAnswers} correct, {stat.incorrectAnswers} incorrect
                      <button
                        onClick={() => handleRemoveUser(stat.username)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No pupil statistics available</p>
              )}
            </div>
          )}

          {/* Pupil Statistics */}
          {user.role === 'pupil' && (
            <div className="statistics-section">
              <h3 className="section-title">Your Statistics</h3>
              <p>
                {user.username}: {statistics.pupilStatistics[0]?.correctAnswers || 0} correct,{' '}
                {statistics.pupilStatistics[0]?.incorrectAnswers || 0} incorrect
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
