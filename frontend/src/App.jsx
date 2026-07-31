import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('access_token') || '');
  
  // Стани для завдань
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Поля форми створення нового завдання
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');

  // Завантаження завдань при авторизації
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/tasks/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTasks(response.data);
    } catch (err) {
      console.error('Помилка завантаження завдань:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/tasks/', 
        { title, description, priority },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTitle('');
      setDescription('');
      fetchTasks(); // Оновлюємо список завдань
    } catch (err) {
      console.error('Помилка створення завдання:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/token/', {
        username,
        password
      });
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);
      setMessage('');
      setUsername('');
      setPassword('');
    } catch (err) {
      setMessage('Помилка входу. Перевірте логін або пароль.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken('');
    setTasks([]);
  };

  if (token) {
    return (
      <div style={{ fontFamily: 'sans-serif', maxWidth: '700px', margin: '30px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Панель Task CRM 🚀</h2>
        <button onClick={handleLogout} style={{ float: 'right', padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Вийти
        </button>
        <div style={{ clear: 'both', marginBottom: '20px' }}></div>

        {/* Форма створення завдання */}
        <div style={{ background: '#f1f3f5', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          <h4>Створити нове завдання</h4>
          <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Назва завдання" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              style={{ padding: '8px', boxSizing: 'border-box' }} 
              required 
            />
            <textarea 
              placeholder="Опис" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              style={{ padding: '8px', boxSizing: 'border-box' }} 
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '8px' }}>
              <option value="low">Низький пріоритет</option>
              <option value="medium">Середній пріоритет</option>
              <option value="high">Високий пріоритет</option>
            </select>
            <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Додати завдання
            </button>
          </form>
        </div>

        <h3>Список завдань</h3>
        {loading ? <p>Завантаження...</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {tasks.length === 0 ? <p>Немає завдань</p> : tasks.map(task => (
              <li key={task.id} style={{ background: '#f8f9fa', padding: '10px', marginBottom: '10px', borderRadius: '5px', borderLeft: '4px solid #007BFF' }}>
                <strong>{task.title}</strong> — <span style={{ color: '#666' }}>{task.status}</span>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{task.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Вхід у Task CRM</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Користувач:</label><br />
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
        </div>
        <div>
          <label>Пароль:</label><br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} required />
        </div>
        <button type="submit" style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Увійти</button>
      </form>
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default App;